/**
 * 表格数据 Hook
 * 使用现有的 API 客户端获取和管理表格数据
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createSDKAdapter, type SDKAdapter, type ITable, type IField, type IRecord } from '../api';
import { CellType } from '../grid';

export interface TableDataState {
  table: ITable | null;
  fields: IField[];
  records: IRecord[];
  totalRecords: number;
  loading: boolean;
  error: string | null;
}

export interface UseTableDataOptions {
  baseURL: string;
  token?: string;
  tableId: string;
  autoLoad?: boolean;
  limit?: number;
  offset?: number;
}

export interface CellData {
  type: CellType;
  data: any;
  displayData: string;
  // 选择字段特有属性
  choiceMap?: Map<string, { id: string; name: string; color: string }>;
  choiceSorted?: Array<{ id: string; name: string; color: string }>;
  isMultiple?: boolean;
}

/**
 * 表格数据管理 Hook
 */
export function useTableData(options: UseTableDataOptions) {
  const { baseURL, token, tableId, autoLoad = true, limit = 100, offset = 0 } = options;

  // 状态管理
  const [state, setState] = useState<TableDataState>({
    table: null,
    fields: [],
    records: [],
    totalRecords: 0,
    loading: false,
    error: null,
  });

  // 创建 API 客户端
  const apiClient = useMemo(() => {
    return createSDKAdapter({
      baseURL,
      token,
      onError: (error) => {
        console.error('API Error:', error);
        setState(prev => ({ ...prev, error: error.message || 'API 请求失败' }));
      },
      onUnauthorized: () => {
        console.log('未授权，需要重新登录');
        setState(prev => ({ ...prev, error: '未授权，请重新登录' }));
      },
    });
  }, [baseURL, token]);

  /**
   * 加载表格数据
   */
  const loadTableData = useCallback(async () => {
    if (!tableId) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // 并行获取表格、字段和记录数据
      const [table, fields, recordsResponse] = await Promise.all([
        apiClient.getTable(tableId),
        apiClient.getFields(tableId),
        apiClient.getRecords(tableId, {
          skip: offset,
          take: limit,
        }),
      ]);

      setState({
        table,
        fields,
        records: recordsResponse.data,
        totalRecords: recordsResponse.total,
        loading: false,
        error: null,
      });

      console.log(`✅ 表格数据加载完成: ${table.name} (${recordsResponse.data.length}/${recordsResponse.total} 条记录)`);
    } catch (error: any) {
      console.error('❌ 加载表格数据失败:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || '加载数据失败',
      }));
    }
  }, [apiClient, tableId, limit, offset]);

  /**
   * 创建记录
   */
  const createRecord = useCallback(async (data: Record<string, any>) => {
    if (!tableId) throw new Error('表格ID不能为空');

    try {
      const newRecord = await apiClient.createRecord(tableId, { fields: data });
      
      // 更新本地状态
      setState(prev => ({
        ...prev,
        records: [newRecord, ...prev.records],
        totalRecords: prev.totalRecords + 1,
      }));

      console.log('✅ 记录创建成功:', newRecord.id);
      return newRecord;
    } catch (error: any) {
      console.error('❌ 创建记录失败:', error);
      throw error;
    }
  }, [apiClient, tableId]);

  /**
   * 更新记录
   */
  const updateRecord = useCallback(async (recordId: string, fieldId: string, value: any) => {
    if (!tableId) throw new Error('表格ID不能为空');

    try {
      const updatedRecord = await apiClient.updateRecord(tableId, recordId, fieldId, value);
      
      // 更新本地状态
      setState(prev => ({
        ...prev,
        records: prev.records.map(record =>
          record.id === recordId ? updatedRecord : record
        ),
      }));

      console.log('✅ 记录更新成功:', recordId);
      return updatedRecord;
    } catch (error: any) {
      console.error('❌ 更新记录失败:', error);
      throw error;
    }
  }, [apiClient, tableId]);

  /**
   * 删除记录
   */
  const deleteRecord = useCallback(async (recordId: string) => {
    if (!tableId) throw new Error('表格ID不能为空');

    try {
      await apiClient.deleteRecord(tableId, recordId);
      
      // 更新本地状态
      setState(prev => ({
        ...prev,
        records: prev.records.filter(record => record.id !== recordId),
        totalRecords: prev.totalRecords - 1,
      }));

      console.log('✅ 记录删除成功:', recordId);
    } catch (error: any) {
      console.error('❌ 删除记录失败:', error);
      throw error;
    }
  }, [apiClient, tableId]);

  /**
   * 将字段类型转换为 Grid 组件字段类型
   */
  const convertFieldType = useCallback((fieldType: string): CellType => {
    const typeMap: Record<string, CellType> = {
      singleLineText: CellType.Text,
      longText: CellType.Text,
      number: CellType.Number,
      singleSelect: CellType.Select,
      multipleSelect: CellType.Select,
      date: CellType.Text,
      checkbox: CellType.Boolean,
      rating: CellType.Number,
      link: CellType.Text,
      user: CellType.Text,
      attachment: CellType.Text,
      formula: CellType.Text,
      rollup: CellType.Text,
      count: CellType.Number,
      createdTime: CellType.Text,
      lastModifiedTime: CellType.Text,
      createdBy: CellType.Text,
      lastModifiedBy: CellType.Text,
      autoNumber: CellType.Text,
      button: CellType.Text,
    };

    return typeMap[fieldType] || CellType.Text;
  }, []);

  /**
   * 将记录数据转换为 Grid 单元格格式
   */
  const convertRecordToCellData = useCallback((record: IRecord, field: IField): CellData => {
    const fieldValue = record.fields[field.name];
    const fieldType = convertFieldType(field.type);

    // 处理不同类型的字段值
    switch (field.type) {
      case 'singleSelect': {
        const options = field.options?.choices || [];
        const choiceMap = new Map<string, { id: string; name: string; color: string }>(
          options.map((choice: any) => [choice.id, { id: choice.id, name: choice.name, color: choice.color || '#64748b' }])
        );
        const choiceSorted = options.map((choice: any) => ({ id: choice.id, name: choice.name, color: choice.color || '#64748b' }));

        const value = fieldValue ? [fieldValue] : [];
        return {
          type: CellType.Select,
          data: value,
          displayData: String(fieldValue || ''),
          choiceMap,
          choiceSorted,
          isMultiple: false,
        };
      }

      case 'multipleSelect': {
        const options = field.options?.choices || [];
        const choiceMap = new Map<string, { id: string; name: string; color: string }>(
          options.map((choice: any) => [choice.id, { id: choice.id, name: choice.name, color: choice.color || '#64748b' }])
        );
        const choiceSorted = options.map((choice: any) => ({ id: choice.id, name: choice.name, color: choice.color || '#64748b' }));

        const values = Array.isArray(fieldValue) ? fieldValue : [];
        return {
          type: CellType.Select,
          data: values,
          displayData: values.join(', '),
          choiceMap,
          choiceSorted,
          isMultiple: true,
        };
      }

      case 'checkbox': {
        const boolValue = Boolean(fieldValue);
        return {
          type: CellType.Boolean,
          data: boolValue,
          displayData: boolValue ? 'true' : 'false',
        };
      }

      case 'number':
      case 'rating':
      case 'count': {
        const numValue = Number(fieldValue) || 0;
        return {
          type: CellType.Number,
          data: numValue,
          displayData: String(numValue),
        };
      }

      default: {
        const strValue = fieldValue ? String(fieldValue) : '';
        return {
          type: CellType.Text,
          data: strValue,
          displayData: strValue,
        };
      }
    }
  }, [convertFieldType]);

  /**
   * 获取单元格内容（适配 Grid 组件接口）
   */
  const getCellContent = useCallback((cell: [number, number]) => {
    const [col, row] = cell;
    
    // 边界检查
    if (col < 0 || row < 0 || col >= state.fields.length || row >= state.records.length) {
      return { 
        type: CellType.Text, 
        data: "", 
        displayData: "" 
      };
    }
    
    const field = state.fields[col];
    const record = state.records[row];
    
    if (!field || !record) {
      return { 
        type: CellType.Text, 
        data: "", 
        displayData: "" 
      };
    }

    return convertRecordToCellData(record, field);
  }, [state.fields, state.records, convertRecordToCellData]);

  /**
   * 生成列定义（适配 Grid 组件接口）
   */
  const columns = useMemo(() => {
    return state.fields.map(field => ({
      id: field.id,
      name: field.name,
      width: 150, // 默认宽度
      isPrimary: field.isPrimary,
    }));
  }, [state.fields]);

  // 自动加载数据
  useEffect(() => {
    if (autoLoad && tableId) {
      loadTableData();
    }
  }, [autoLoad, tableId, loadTableData]);

  return {
    // 状态
    ...state,
    
    // 数据
    columns,
    rowCount: state.records.length,
    
    // 方法
    loadTableData,
    createRecord,
    updateRecord,
    deleteRecord,
    getCellContent,
    
    // API 客户端（用于高级操作）
    apiClient,
  };
}

export default useTableData;
