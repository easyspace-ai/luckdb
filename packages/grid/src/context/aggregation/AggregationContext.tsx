import { createContext, useContext, useMemo, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ApiClient } from '@/api/client';
import type { Field } from '@/model/field/Field';
import type { Record } from '@/model/record/Record';

type AggregationType = 
  | 'count' 
  | 'countEmpty' 
  | 'countNotEmpty' 
  | 'countUnique'
  | 'sum' 
  | 'avg' 
  | 'min' 
  | 'max'
  | 'median'
  | 'percentEmpty'
  | 'percentNotEmpty'
  | 'percentUnique';

interface IAggregationResult {
  fieldId: string;
  type: AggregationType;
  value: number | string | null;
}

interface IFieldStatistics {
  count: number;
  empty: number;
  notEmpty: number;
  unique: number;
  sum?: number;
  avg?: number;
  min?: number;
  max?: number;
  median?: number;
}

interface IAggregationContext {
  isLoading: boolean;
  getFieldAggregation: (fieldId: string, type: AggregationType) => number | string | null;
  getFieldStatistics: (fieldId: string) => IFieldStatistics;
  getAllAggregations: (fieldId: string) => IAggregationResult[];
  calculateCustomAggregation: (
    fieldId: string, 
    records: Record[], 
    type: AggregationType
  ) => number | string | null;
}

const AggregationContext = createContext<IAggregationContext | null>(null);

export function AggregationProvider({ 
  tableId,
  viewId,
  fields,
  records,
  apiClient,
  children 
}: { 
  tableId: string;
  viewId?: string;
  fields: Field[];
  records: Record[];
  apiClient: ApiClient;
  children: ReactNode;
}) {
  // 获取服务端聚合数据（可选，如果 API 支持）
  const { data: serverAggregations = [], isLoading } = useQuery({
    queryKey: ['aggregations', tableId, viewId],
    queryFn: () => apiClient.getAggregations?.(tableId, viewId) || Promise.resolve([]),
    enabled: !!tableId,
  });

  // 计算单个字段的统计信息
  const calculateFieldStatistics = useMemo(() => {
    const statsMap = new Map<string, IFieldStatistics>();

    fields.forEach(field => {
      const values = records
        .map(record => record.getCellValue(field.id))
        .filter(v => v !== null && v !== undefined && v !== '');

      const stats: IFieldStatistics = {
        count: records.length,
        empty: records.length - values.length,
        notEmpty: values.length,
        unique: new Set(values).size,
      };

      // 数字字段的额外统计
      if (field.type === 'number' || field.type === 'rating') {
        const numericValues = values
          .map(v => typeof v === 'number' ? v : parseFloat(String(v)))
          .filter(v => !isNaN(v));

        if (numericValues.length > 0) {
          stats.sum = numericValues.reduce((a, b) => a + b, 0);
          stats.avg = stats.sum / numericValues.length;
          stats.min = Math.min(...numericValues);
          stats.max = Math.max(...numericValues);
          
          // 计算中位数
          const sorted = [...numericValues].sort((a, b) => a - b);
          const mid = Math.floor(sorted.length / 2);
          stats.median = sorted.length % 2 === 0
            ? (sorted[mid - 1] + sorted[mid]) / 2
            : sorted[mid];
        }
      }

      statsMap.set(field.id, stats);
    });

    return statsMap;
  }, [fields, records]);

  const getFieldStatistics = (fieldId: string): IFieldStatistics => {
    return calculateFieldStatistics.get(fieldId) || {
      count: 0,
      empty: 0,
      notEmpty: 0,
      unique: 0,
    };
  };

  // 获取特定类型的聚合值
  const getFieldAggregation = (
    fieldId: string, 
    type: AggregationType
  ): number | string | null => {
    const stats = getFieldStatistics(fieldId);

    switch (type) {
      case 'count':
        return stats.count;
      case 'countEmpty':
        return stats.empty;
      case 'countNotEmpty':
        return stats.notEmpty;
      case 'countUnique':
        return stats.unique;
      case 'sum':
        return stats.sum ?? null;
      case 'avg':
        return stats.avg ?? null;
      case 'min':
        return stats.min ?? null;
      case 'max':
        return stats.max ?? null;
      case 'median':
        return stats.median ?? null;
      case 'percentEmpty':
        return stats.count > 0 ? (stats.empty / stats.count) * 100 : 0;
      case 'percentNotEmpty':
        return stats.count > 0 ? (stats.notEmpty / stats.count) * 100 : 0;
      case 'percentUnique':
        return stats.count > 0 ? (stats.unique / stats.count) * 100 : 0;
      default:
        return null;
    }
  };

  // 获取字段的所有可用聚合
  const getAllAggregations = (fieldId: string): IAggregationResult[] => {
    const field = fields.find(f => f.id === fieldId);
    if (!field) return [];

    const baseTypes: AggregationType[] = [
      'count',
      'countEmpty',
      'countNotEmpty',
      'countUnique',
      'percentEmpty',
      'percentNotEmpty',
      'percentUnique',
    ];

    const numericTypes: AggregationType[] = [
      'sum',
      'avg',
      'min',
      'max',
      'median',
    ];

    const types = field.type === 'number' || field.type === 'rating'
      ? [...baseTypes, ...numericTypes]
      : baseTypes;

    return types.map(type => ({
      fieldId,
      type,
      value: getFieldAggregation(fieldId, type),
    }));
  };

  // 自定义聚合计算（用于前端实时计算）
  const calculateCustomAggregation = (
    fieldId: string,
    customRecords: Record[],
    type: AggregationType
  ): number | string | null => {
    const field = fields.find(f => f.id === fieldId);
    if (!field) return null;

    const values = customRecords
      .map(record => record.getCellValue(fieldId))
      .filter(v => v !== null && v !== undefined && v !== '');

    const count = customRecords.length;
    const notEmpty = values.length;
    const empty = count - notEmpty;
    const unique = new Set(values).size;

    switch (type) {
      case 'count':
        return count;
      case 'countEmpty':
        return empty;
      case 'countNotEmpty':
        return notEmpty;
      case 'countUnique':
        return unique;
      case 'percentEmpty':
        return count > 0 ? (empty / count) * 100 : 0;
      case 'percentNotEmpty':
        return count > 0 ? (notEmpty / count) * 100 : 0;
      case 'percentUnique':
        return count > 0 ? (unique / count) * 100 : 0;
      case 'sum':
      case 'avg':
      case 'min':
      case 'max':
      case 'median': {
        const numericValues = values
          .map(v => typeof v === 'number' ? v : parseFloat(String(v)))
          .filter(v => !isNaN(v));

        if (numericValues.length === 0) return null;

        if (type === 'sum') {
          return numericValues.reduce((a, b) => a + b, 0);
        }
        if (type === 'avg') {
          return numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
        }
        if (type === 'min') {
          return Math.min(...numericValues);
        }
        if (type === 'max') {
          return Math.max(...numericValues);
        }
        if (type === 'median') {
          const sorted = [...numericValues].sort((a, b) => a - b);
          const mid = Math.floor(sorted.length / 2);
          return sorted.length % 2 === 0
            ? (sorted[mid - 1] + sorted[mid]) / 2
            : sorted[mid];
        }
      }
      default:
        return null;
    }
  };

  return (
    <AggregationContext.Provider value={{
      isLoading,
      getFieldAggregation,
      getFieldStatistics,
      getAllAggregations,
      calculateCustomAggregation,
    }}>
      {children}
    </AggregationContext.Provider>
  );
}

export function useAggregation() {
  const context = useContext(AggregationContext);
  if (!context) throw new Error('useAggregation must be used within AggregationProvider');
  return context;
}


