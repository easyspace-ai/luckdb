import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TableEditorLayout } from '@/components/layouts/table-editor-layout';
import luckdb from '@/lib/luckdb';
import type { Base, Table, View, Field, Record } from '@luckdb/sdk';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { AddFieldDialog, EditFieldDialog } from '@/components/field';
import { AddRecordDialog } from '@/components/record';
import type { CreateFieldRequest, UpdateFieldRequest, Field as CustomFieldType } from '@/types/field';

// Grid 组件导入
import { 
  AppProviders,
  Grid,
  type IGridRef,
  type IGridColumn,
  type ICellItem,
  type ICell,
  CellType,
  GridToolbar,
} from '@luckdb/grid';
import { createGridSdkAdapter, getCurrentUserInfo, getWebSocketUrl } from '@/lib/grid-sdk-adapter';
import { useAuthStore } from '@/stores/auth-store';

export default function TableEditor() {
  const { baseId, tableId, viewId } = useParams<{
    baseId: string;
    tableId?: string;
    viewId?: string;
  }>();
  const navigate = useNavigate();
  
  // 恢复认证状态
  const { accessToken, refreshToken, isAuthenticated } = useAuthStore();
  
  // 在组件加载时恢复 SDK 认证状态
  useEffect(() => {
    if (accessToken && refreshToken && isAuthenticated) {
      console.log('🔐 Restoring SDK authentication...');
      luckdb.setAccessToken(accessToken);
      luckdb.setRefreshToken(refreshToken);
      console.log('✅ SDK authentication restored');
    } else {
      console.log('❌ No authentication tokens found');
    }
  }, [accessToken, refreshToken, isAuthenticated]);

  const gridRef = useRef<IGridRef>(null);
  const [base, setBase] = useState<Base | null>(null);
  const [table, setTable] = useState<Table | null>(null);
  const [view, setView] = useState<View | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [showToolbar, setShowToolbar] = useState(true);
  
  // 字段管理状态
  const [addFieldDialogOpen, setAddFieldDialogOpen] = useState(false);
  const [editFieldDialogOpen, setEditFieldDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<CustomFieldType | null>(null);
  
  // 记录管理状态
  const [addRecordDialogOpen, setAddRecordDialogOpen] = useState(false);

  // 将 SDK Field 转换为自定义 Field 类型
  const convertToCustomField = useCallback((field: Field): CustomFieldType => {
    return {
      id: field.id,
      name: field.name,
      type: field.type as any, // 类型转换
      description: field.description,
      options: field.options ? {
        choices: (field.options as any).choices,
        defaultValue: (field.options as any).defaultValue,
        isUnique: (field.options as any).isUnique,
        isRequired: (field.options as any).isRequired,
        displayStyle: (field.options as any).displayStyle,
      } : undefined,
      isPrimary: (field as any).isPrimary || (field as any).primary,
      createdAt: field.createdAt,
      updatedAt: field.updatedAt,
    };
  }, []);

  // 获取字段类型对应的图标
  const getFieldIcon = useCallback((type: string): string => {
    const iconMap: { [key: string]: string } = {
      text: '📝',
      number: '🔢',
      boolean: '✓',
      date: '📅',
      select: '📋',
      multiSelect: '🏷️',
      user: '👤',
      link: '🔗',
      email: '📧',
      phone: '📱',
      attachment: '📎',
      rating: '⭐',
    };
    return iconMap[type] || '📄';
  }, []);

  // 将 Fields 转换为 Grid Columns
  const gridColumns = useMemo<IGridColumn[]>(() => {
    const columns = fields.map((field, index) => ({
      id: field.id,
      name: field.name,
      width: 150,
      isPrimary: index === 0, // 第一列作为主列
      icon: getFieldIcon(field.type),
    }));
    
    console.log('🔍 Generated gridColumns:', {
      fieldsCount: fields.length,
      columnsCount: columns.length,
      fields: fields.map(f => ({ id: f.id, name: f.name, type: f.type })),
      columns: columns.map(c => ({ id: c.id, name: c.name }))
    });
    
    return columns;
  }, [fields, getFieldIcon]);

  useEffect(() => {
    if (baseId) {
      if (tableId && viewId) {
        // 有完整的路径参数，直接加载
        loadTableData(tableId, viewId);
      } else {
        // 只有 baseId，需要重定向到第一个表格
        redirectToFirstTable();
      }
    }
  }, [baseId, tableId, viewId]);

  // 获取单元格内容
  const getCellContent = useCallback(
    (cell: [number, number]): ICell => {
      const [colIndex, rowIndex] = cell;
      
      // 边界检查
      if (colIndex < 0 || rowIndex < 0 || !records.length || !fields.length) {
        return {
          type: CellType.Text,
          data: '',
          displayData: '',
        };
      }

      const record = records[rowIndex];
      const field = fields[colIndex];

      // 添加调试信息
      if (rowIndex === 0 && colIndex === 0) {
        console.log('Grid getCellContent debug:', {
          totalRecords: records.length,
          totalFields: fields.length,
          currentRecord: record,
          currentField: field,
          recordData: record?.data
        });
      }

      if (!record || !field) {
        console.log(`Missing data: record=${!!record}, field=${!!field}, colIndex=${colIndex}, rowIndex=${rowIndex}`);
        return {
          type: CellType.Text,
          data: '',
          displayData: '',
        };
      }

      const value = record.data?.[field.id];

      // 根据字段类型返回对应的单元格数据
      console.log(`🔍 Processing field: ${field.name} (${field.type}) with value:`, value);
      console.log(`🔍 Field details:`, {
        fieldId: field.id,
        fieldName: field.name,
        fieldType: field.type,
        normalizedType: (field.type || '').toLowerCase(),
        value: value,
        valueType: typeof value,
        isArray: Array.isArray(value),
        isNull: value === null,
        isUndefined: value === undefined
      });
      
      // 使用小写比较，更宽松的匹配
      const fieldType = (field.type || '').toLowerCase();
      
      switch (fieldType) {
        case 'text':
        case 'singlelinetext':
        case 'longtext':
        case 'string':
        case 'singleline':
        case 'multiline':
        case 'richtext':
        case 'formula':
          return {
            type: CellType.Text,
            data: value ? String(value) : '',
            displayData: value ? String(value) : '',
          };

        case 'number':
        case 'integer':
        case 'float':
        case 'decimal':
        case 'currency':
        case 'percent':
        case 'autonumber':
        case 'count':
          return {
            type: CellType.Number,
            data: value ? (value as number) : 0,
            displayData: value ? String(value) : '0',
          };

        case 'boolean':
        case 'checkbox':
        case 'check':
          return {
            type: CellType.Boolean,
            data: value ? (value as boolean) : false,
            displayData: value ? '✓' : '',
          };

        case 'date':
        case 'datetime':
        case 'createdtime':
        case 'lastmodifiedtime':
        case 'timestamp':
        case 'time':
        case 'createdate':
        case 'modifydate':
        case 'createdatetime':
        case 'modifieddatetime':
          return {
            type: CellType.Date,
            data: value ? (value as string) : '',
            displayData: value ? new Date(value as string).toLocaleDateString('zh-CN') : '',
          };

        case 'select':
        case 'singleselect':
        case 'dropdown':
        case 'singlechoice':
        case 'option':
        case 'choice': {
          const options = field.options?.choices || [];
          const choiceMap = new Map<string, any>();
          options.forEach((choice: any) => {
            choiceMap.set(choice.id, choice);
          });
          
          const strValue = value ? String(value) : '';
          
          return {
            type: CellType.Select,
            data: strValue ? [strValue] : [],
            displayData: strValue ? [strValue] : [],
            choiceMap,
            choiceSorted: options,
            isMultiple: false,
          } as any;
        }

        case 'multipleselect':
        case 'multipleselects':
        case 'multiselect':
        case 'multiplechoice':
        case 'multichoice':
        case 'tags':
        case 'categories': {
          const options = field.options?.choices || [];
          const choiceMap = new Map<string, any>();
          options.forEach((choice: any) => {
            choiceMap.set(choice.id, choice);
          });
          
          // 确保 arrValue 是字符串数组
          let arrValue: string[] = [];
          if (Array.isArray(value)) {
            // 处理数组值，如 ["重要", "紧急", "待办"]
            arrValue = value.map(v => String(v || '')).filter(v => v !== '');
          } else if (value) {
            // 处理单个值
            arrValue = [String(value)];
          }
          // 如果 value 是 null 或 undefined，arrValue 保持为空数组 []
          
          return {
            type: CellType.Select,
            data: arrValue,
            displayData: arrValue,
            choiceMap,
            choiceSorted: options,
            isMultiple: true,
          } as any;
        }

        case 'rating':
        case 'star':
          return {
            type: CellType.Rating,
            data: value ? (value as number) : 0,
            displayData: value ? String(value) : '0',
            icon: '⭐',
            color: '#fbbf24',
            max: 5,
          } as any;

        case 'user':
        case 'createdby':
        case 'lastmodifiedby':
        case 'owner':
        case 'assignee':
        case 'collaborator':
        case 'member': {
          const userName = value ? String(value) : '';
          return {
            type: CellType.User,
            data: userName ? [{ id: userName, name: userName, avatarUrl: '' }] : [],
            displayData: userName ? `👤 ${userName}` : '',
          };
        }

        case 'url':
        case 'link':
        case 'hyperlink':
        case 'website':
        case 'weburl':
        case 'attachment':
          return {
            type: CellType.Link,
            data: {
              title: value ? String(value) : '',
              url: value ? String(value) : '',
            },
            displayData: value ? String(value) : '',
          };

        case 'email':
        case 'mail':
        case 'emailaddress':
          return {
            type: CellType.Text,
            data: value ? String(value) : '',
            displayData: value ? String(value) : '',
          };

        case 'phone':
        case 'telephone':
        case 'mobile':
        case 'phoneNumber':
        case 'contact':
          return {
            type: CellType.Link,
            data: {
              title: value ? String(value) : '',
              url: value ? `tel:${value}` : '',
            },
            displayData: value ? String(value) : '',
          };

        default:
          console.log(`🔍 Unknown field type: ${field.type} (normalized: ${fieldType}), using TextField. Value:`, value);
          return {
            type: CellType.Text,
            data: value ? String(value) : '',
            displayData: value ? String(value) : '',
          };
      }
    },
    [fields, records]
  );

  // 处理单元格编辑
  const handleCellEdited = useCallback(
    async (cell: ICellItem, newCell: ICell) => {
      const [columnIndex, rowIndex] = cell;
      const field = fields[columnIndex];
      const record = records[rowIndex];
      
      if (!field || !record) return;

      try {
        // 提取新值
        let newValue: any;
        
        switch (field.type) {
          case 'multipleSelect':
          case 'multipleSelects':
            newValue = Array.isArray(newCell.data) ? newCell.data : [];
            break;
          
          case 'select':
          case 'singleSelect':
            if (Array.isArray(newCell.data) && newCell.data.length > 0) {
              newValue = newCell.data[0];
            } else {
              newValue = '';
            }
            break;
          
          case 'boolean':
          case 'checkbox':
            newValue = Boolean(newCell.data);
            break;
          
          case 'number':
          case 'rating':
            newValue = typeof newCell.data === 'number' ? newCell.data : Number(newCell.data) || 0;
            break;
          
          case 'user':
          case 'createdBy':
          case 'lastModifiedBy':
            if (Array.isArray(newCell.data) && newCell.data.length > 0) {
              newValue = newCell.data[0].name || newCell.data[0].id;
            } else {
              newValue = '';
            }
            break;
          
          case 'url':
          case 'link':
            newValue = typeof newCell.data === 'object' ? newCell.data.url : newCell.data;
            break;
          
          case 'email':
          case 'phone':
            newValue = newCell.data;
            break;
          
          default:
            newValue = newCell.data;
            break;
        }

        // 更新记录
        const updatedRecord = await luckdb.updateRecord(tableId!, record.id, {
          [field.id]: newValue
        });

        // 更新本地状态
        setRecords(prevRecords => 
          prevRecords.map(r => r.id === record.id ? updatedRecord : r)
        );

        toast.success('更新成功');
      } catch (error: any) {
        console.error('Failed to update record:', error);
        toast.error(error?.message || '更新失败');
      }
    },
    [fields, records, tableId]
  );

  const redirectToFirstTable = async () => {
    if (!baseId) return;

    try {
      setLoading(true);

      // 获取 Base 信息
      const baseData = await luckdb.getBase(baseId);
      setBase(baseData);

      // 获取 Tables
      const tables = await luckdb.listTables({ baseId });
      if (tables.length === 0) {
        toast.error('该数据库中没有表格');
        setLoading(false);
        return;
      }

      const firstTable = tables[0];

      // 获取第一个 Table 的 Views
      const views = await luckdb.listViews({ tableId: firstTable.id });
      if (views.length === 0) {
        toast.error('该表格中没有视图');
        setLoading(false);
        return;
      }

      const firstView = views[0];

      // 重定向到完整 URL
      navigate(`/base/${baseId}/${firstTable.id}/${firstView.id}`, { replace: true });
    } catch (error: any) {
      console.error('Failed to redirect:', error);
      toast.error(error?.message || '加载失败');
      setLoading(false);
    }
  };

  // 字段操作回调函数 - 必须在条件返回之前定义
  const handleAddColumn = useCallback(async (_fieldType?: any, _insertIndex?: number) => {
    console.log('[Field] onAddColumn triggered', { _fieldType, _insertIndex });
    toast.info('打开添加字段');
    // 打开添加字段弹窗
    setAddFieldDialogOpen(true);
  }, []);

  const handleEditColumn = useCallback(async (columnIndex: number, updatedColumn: any) => {
    try {
      const field = fields[columnIndex];
      if (!field) return;

      const updatedField = await luckdb.updateField(field.id, {
        name: updatedColumn.name,
        description: updatedColumn.description,
        options: updatedColumn.options,
      });

      setFields(prev => prev.map(f => f.id === field.id ? updatedField : f));
      toast.success('字段更新成功');
    } catch (error: any) {
      console.error('Failed to update field:', error);
      toast.error(error?.message || '更新字段失败');
    }
  }, [fields]);

  const handleDuplicateColumn = useCallback(async (columnIndex: number) => {
    try {
      const field = fields[columnIndex];
      if (!field) return;

      const duplicatedField = await luckdb.createField({
        tableId: tableId!,
        name: `${field.name}_副本`,
        type: field.type,
        description: field.description,
        options: field.options,
      });

      setFields(prev => {
        const newFields = [...prev];
        newFields.splice(columnIndex + 1, 0, duplicatedField);
        return newFields;
      });
      
      toast.success('字段复制成功');
    } catch (error: any) {
      console.error('Failed to duplicate field:', error);
      toast.error(error?.message || '复制字段失败');
    }
  }, [fields, tableId]);

  const handleDeleteColumn = useCallback(async (columnIndex: number) => {
    try {
      const field = fields[columnIndex];
      if (!field) return;

      await luckdb.deleteField(field.id);
      setFields(prev => prev.filter(f => f.id !== field.id));
      toast.success('字段删除成功');
    } catch (error: any) {
      console.error('Failed to delete field:', error);
      toast.error(error?.message || '删除字段失败');
    }
  }, [fields]);

  const handleStartEditColumn = useCallback((columnIndex: number, column: any) => {
    console.log('Start editing column:', columnIndex, column);
    const field = fields[columnIndex];
    if (field) {
      setEditingField(convertToCustomField(field));
      setEditFieldDialogOpen(true);
    }
  }, [fields, convertToCustomField]);

  // 处理添加字段
  const handleAddField = useCallback(async (fieldData: CreateFieldRequest) => {
    try {
      const newField = await luckdb.createField({
        tableId: tableId!,
        name: fieldData.name,
        type: fieldData.type,
        description: fieldData.description,
        options: fieldData.options,
      });
      
      setFields(prev => [...prev, newField]);
      toast.success('字段创建成功');
    } catch (error: any) {
      console.error('Failed to create field:', error);
      toast.error(error?.message || '创建字段失败');
      throw error;
    }
  }, [tableId]);

  // 处理编辑字段
  const handleEditField = useCallback(async (fieldId: string, fieldData: UpdateFieldRequest) => {
    try {
      const updatedField = await luckdb.updateField(fieldId, {
        name: fieldData.name,
        type: fieldData.type,
        description: fieldData.description,
        options: fieldData.options,
      });

      setFields(prev => prev.map(f => f.id === fieldId ? updatedField : f));
      toast.success('字段更新成功');
    } catch (error: any) {
      console.error('Failed to update field:', error);
      toast.error(error?.message || '更新字段失败');
      throw error;
    }
  }, []);

  // 处理添加记录
  const handleAddRecord = useCallback(async (recordData: { [fieldId: string]: any }) => {
    try {
      const newRecord = await luckdb.createRecord({
        tableId: tableId!,
        data: recordData,
      });
      
      setRecords(prev => [...prev, newRecord]);
      toast.success('记录创建成功');
    } catch (error: any) {
      console.error('Failed to create record:', error);
      toast.error(error?.message || '创建记录失败');
      throw error;
    }
  }, [tableId]);

  // 创建 Grid SDK 适配器 - 必须在条件返回之前定义
  const apiClient = createGridSdkAdapter() as any;
  const userInfo = getCurrentUserInfo();
  const wsUrl = getWebSocketUrl();

  const loadTableData = async (tableId: string, viewId: string) => {
    if (!baseId) return;

    try {
      setLoading(true);

      // 1. 获取 Base 信息
      const baseData = await luckdb.getBase(baseId);
      setBase(baseData);

      // 2. 获取 Table 信息
      const tableData = await luckdb.getTable(tableId);
      setTable(tableData);

      // 3. 获取 View 信息
      const viewData = await luckdb.getView(viewId);
      setView(viewData);

      // 4. 并行加载字段和记录数据
      const [fieldsData, recordsResponse] = await Promise.all([
        luckdb.listFields({ tableId }),
        luckdb.listRecords({ tableId, limit: 100 }),
      ]);

      setFields(fieldsData);
      
      // 调试 recordsResponse 结构
      console.log('🔍 Records response debug:', {
        recordsResponse,
        recordsResponseKeys: Object.keys(recordsResponse),
        recordsResponseData: recordsResponse.data,
        recordsResponseDataLength: recordsResponse.data?.length,
        recordsResponseDataType: typeof recordsResponse.data,
        recordsResponseDataIsArray: Array.isArray(recordsResponse.data),
        recordsResponseDataKeys: recordsResponse.data ? Object.keys(recordsResponse.data) : null,
        recordsResponseDataValues: recordsResponse.data ? Object.values(recordsResponse.data) : null,
        sampleDataKey: recordsResponse.data ? Object.keys(recordsResponse.data)[0] : null,
        sampleDataValue: recordsResponse.data ? (recordsResponse.data as any)[Object.keys(recordsResponse.data)[0]] : null
      });
      
      // 检查 recordsResponse.data 的具体结构
      if (recordsResponse.data && typeof recordsResponse.data === 'object') {
        const dataObj = recordsResponse.data as any;
        console.log('🔍 recordsResponse.data structure:', {
          dataKeys: Object.keys(dataObj),
          dataValues: Object.values(dataObj),
          hasRecords: 'records' in dataObj,
          hasData: 'data' in dataObj,
          hasItems: 'items' in dataObj,
          dataRecords: dataObj.records,
          dataData: dataObj.data,
          dataItems: dataObj.items
        });
      }
      
      // 根据实际结构设置 records
      // recordsResponse.data 应该是 { list: [...], pagination: {...} } 格式
      let recordsData: any[] = [];
      const dataObj = recordsResponse.data as any;
      if (dataObj && Array.isArray(dataObj)) {
        // 如果直接是数组
        recordsData = dataObj;
      } else if (dataObj && dataObj.list && Array.isArray(dataObj.list)) {
        // 如果是 { list: [...] } 格式
        recordsData = dataObj.list;
      } else {
        console.warn('Unexpected recordsResponse.data structure:', dataObj);
        recordsData = [];
      }
      
      console.log('🔍 Final recordsData:', {
        recordsData,
        recordsDataLength: recordsData.length,
        recordsDataType: typeof recordsData,
        recordsDataIsArray: Array.isArray(recordsData),
        sampleRecord: recordsData[0]
      });
      
      setRecords(recordsData);
      
      console.log('🔍 Table data loaded:', {
        base: baseData.name,
        table: tableData.name,
        view: viewData.name,
        fieldsCount: fieldsData.length,
        recordsCount: recordsData.length,
        fields: fieldsData.map(f => ({ id: f.id, name: f.name, type: f.type, options: f.options })),
        sampleRecord: recordsData?.[0],
        allRecords: recordsData
      });
      
      // 调试字段类型
      console.log('🔍 Field types debug:', {
        allFieldTypes: fieldsData.map(f => f.type),
        uniqueFieldTypes: [...new Set(fieldsData.map(f => f.type))],
        fieldDetails: fieldsData.map(f => ({ name: f.name, type: f.type, options: f.options }))
      });
    } catch (error: any) {
      console.error('Failed to load table data:', error);
      toast.error(error?.message || '加载数据失败');
      
      // 如果 view 不存在，尝试重定向到表格的第一个视图
      if (error?.response?.status === 404 && tableId) {
        try {
          const views = await luckdb.listViews({ tableId });
          if (views.length > 0) {
            navigate(`/base/${baseId}/${tableId}/${views[0].id}`, { replace: true });
            return;
          }
        } catch (err) {
          console.error('Failed to redirect to first view:', err);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // 条件渲染 - 必须在所有 hooks 之后
  if (loading) {
    return (
      <TableEditorLayout>
        <div className="h-full flex items-center justify-center p-6">
          <Skeleton className="h-[400px] w-full" />
        </div>
      </TableEditorLayout>
    );
  }

  if (!base || !table || !view) {
    return (
      <TableEditorLayout>
        <div className="h-full flex items-center justify-center">
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">
                {!base && '数据库不存在'}
                {base && !table && '表格不存在'}
                {base && table && !view && '视图不存在'}
              </p>
            </CardContent>
          </Card>
        </div>
      </TableEditorLayout>
    );
  }

  return (
    <TableEditorLayout>
      <div className="h-screen flex flex-col">
        {/* 工具栏 */}
        <div className="border-b p-4 bg-background flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{table.name}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {view.name} · {records.length} 条记录 · {fields.length} 个字段
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 text-sm rounded-md border bg-muted/50">
                视图: {view.name}
              </div>
            </div>
          </div>
        </div>

        {/* Grid 组件区域 */}
        <div className="flex-1 flex flex-col min-h-0">
          {baseId && tableId && viewId ? (
            <AppProviders
              baseId={baseId}
              tableId={tableId}
              viewId={viewId}
              apiClient={apiClient}
              wsUrl={wsUrl}
              userId={userInfo?.id || 'anonymous'}
            >
              {/* 工具栏 */}
              {showToolbar && (
                <div className="flex-shrink-0">
                  <GridToolbar
                    onUndo={() => console.log('Undo')}
                    onRedo={() => console.log('Redo')}
                    onAddNew={() => {
                      console.log('[Record] Toolbar AddNew clicked - open AddRecordDialog');
                      setAddRecordDialogOpen(true);
                    }}
                    onFieldConfig={() => {
                      console.log('[Field] Toolbar FieldConfig clicked - open AddFieldDialog');
                      setAddFieldDialogOpen(true);
                    }}
                    onFilter={() => console.log('Filter')}
                    onSort={() => console.log('Sort')}
                    onGroup={() => console.log('Group')}
                    onSearch={() => console.log('Search')}
                    onFullscreen={() => console.log('Fullscreen')}
                    onShare={() => console.log('Share')}
                    onAPI={() => console.log('API')}
                    onCollaboration={() => console.log('Collaboration')}
                    onToggleToolbar={() => setShowToolbar(false)}
                    onToggleStatistics={() => console.log('Toggle statistics')}
                  />
                </div>
              )}

              {/* Grid */}
              <div className="flex-1 min-h-0 w-full p-[5px]">
                <div className="border border-border rounded-md overflow-hidden h-full w-full">
                  <div className="h-full w-full relative">
                    <Grid
                    ref={gridRef}
                    columns={gridColumns}
                    rowCount={records.length}
                    getCellContent={getCellContent}
                    freezeColumnCount={1}
                    rowHeight={36}
                    columnHeaderHeight={40}
                    style={{
                      width: '100%',
                      height: '100%',
                    }}
                  onCellEdited={handleCellEdited}
                  onColumnResize={(column, newSize) => {
                    console.log('Column resized:', column.name, 'New width:', newSize);
                  }}
                  onColumnOrdered={(dragColIndexCollection, dropColIndex) => {
                    console.log('Column ordered:', dragColIndexCollection, 'Drop at:', dropColIndex);
                  }}
                  // 字段操作回调
                  onAddColumn={handleAddColumn}
                  onEditColumn={handleEditColumn}
                  onDuplicateColumn={handleDuplicateColumn}
                  onDeleteColumn={handleDeleteColumn}
                  onStartEditColumn={handleStartEditColumn}
                  // 其他功能回调
                  onColumnHeaderMenuClick={(colIndex, bounds) => {
                    console.log('Column header menu clicked:', colIndex, bounds);
                  }}
                  onRowHeaderMenuClick={(rowIndex, position) => {
                    console.log('Row header menu clicked:', rowIndex, position);
                  }}
                  onCellContextMenu={(rowIndex, colIndex, position) => {
                    console.log('Cell context menu clicked:', rowIndex, colIndex, position);
                  }}
                  />
                  </div>
                </div>
              </div>
            </AppProviders>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">
                    缺少必要的参数，无法加载 Grid 组件
                  </p>
                  <div className="mt-4 space-y-2 text-sm font-mono">
                    <div>Base ID: {baseId || '缺失'}</div>
                    <div>Table ID: {tableId || '缺失'}</div>
                    <div>View ID: {viewId || '缺失'}</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* 字段管理弹窗 */}
      <AddFieldDialog
        open={addFieldDialogOpen}
        onOpenChange={setAddFieldDialogOpen}
        onSave={handleAddField}
      />
      
      <EditFieldDialog
        open={editFieldDialogOpen}
        onOpenChange={setEditFieldDialogOpen}
        field={editingField}
        onSave={handleEditField}
      />

      {/* 记录管理弹窗 */}
      <AddRecordDialog
        open={addRecordDialogOpen}
        onOpenChange={setAddRecordDialogOpen}
        fields={fields.map(convertToCustomField)}
        onSave={handleAddRecord}
      />
    </TableEditorLayout>
  );
}
