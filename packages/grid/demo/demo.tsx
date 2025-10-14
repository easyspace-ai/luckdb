import { FC, useState, useMemo, useCallback, useRef } from 'react';
import { Grid } from '../src/grid/core/Grid';
import type { IGridColumn, ICellItem } from '../src/grid/types/grid';
import type { IGridRef } from '../src/grid/core/Grid';
import { CellType } from '../src/grid/renderers/cell-renderer/interface';
import type { ICell } from '../src/grid/renderers/cell-renderer/interface';
import { 
  DateEditor,
  SelectEditor,
  NumberEditor,
  LinkEditor,
  UserEditor,
  AttachmentEditor,
  RatingEditor
} from '../src/grid/components/editors/enhanced';
import { useGridTheme } from '../src/grid/hooks/business/useGridTheme';
import { useGridColumnStatistics } from '../src/grid/hooks/business/useGridColumnStatistics';
import { RowCounter } from '../src/grid/components/ui/RowCounter';
import { Tooltip as GridTooltip, useGridTooltipStore } from '../src/grid/components/ui/Tooltip';
import type { ISelectOption, IUserInfo, IAttachmentFile } from '../src/grid/types/editor';

/**
 * 🎯 luck-grid 全功能演示
 * 
 * 这个演示展示了 Grid 组件的所有增强功能：
 * - 📝 文本编辑器 (双击文本单元格)
 * - 🔢 数字编辑器 (双击数字单元格)
 * - 📋 单选编辑器 (双击单选单元格)
 * - 🏷️ 多选标签 (双击多选单元格)
 * - ☑️ 复选框 (点击切换)
 * - 📅 日期编辑器 (双击日期单元格)
 * - 👤 用户选择器 (双击用户单元格)
 * - 🔗 链接编辑器 (双击链接单元格)
 * - 📎 附件上传器 (双击附件单元格)
 * - 🔘 Button 字段 (点击按钮触发操作)
 * - 🧮 Formula 字段 (公式计算，只读)
 * - 📊 Rollup 字段 (汇总字段，只读)
 * - 🎨 主题切换
 * - 📊 列统计
 * - 🔢 行计数器
 */

// 定义数据类型
interface IRecord {
  id: string;
  name: string;
  score: number;
  status: string; // 单选状态
  tags: string[]; // 多选标签
  rating: number | null; // 评分字段
  dueDate: string | null;
  assignee: string | null;
  link: string | null;
  attachments: IAttachmentFile[] | null;
  group: string;
  clickCount: number; // Button 字段的点击计数
  totalScore: number; // Formula 字段 - 计算总分
  priority: string; // Rollup 字段示例
  isCompleted: boolean; // 复选框字段
}

// 选项配置
const STATUS_OPTIONS: ISelectOption[] = [
  { id: 'todo', name: '待处理', color: '#94a3b8' },
  { id: 'in-progress', name: '进行中', color: '#f59e0b' },
  { id: 'completed', name: '已完成', color: '#10b981' },
  { id: 'blocked', name: '阻塞', color: '#ef4444' },
];

const TAG_OPTIONS: ISelectOption[] = [
  { id: 'tag-a', name: '标签A', color: '#3b82f6' },
  { id: 'tag-b', name: '标签B', color: '#8b5cf6' },
  { id: 'tag-c', name: '标签C', color: '#ec4899' },
  { id: 'tag-d', name: '标签D', color: '#14b8a6' },
  { id: 'tag-e', name: '标签E', color: '#f59e0b' },
  { id: 'tag-f', name: '标签F', color: '#10b981' },
];

const USER_OPTIONS: IUserInfo[] = [
  { id: 'user1', name: '张三', avatar: 'https://i.pravatar.cc/150?img=1' },
  { id: 'user2', name: '李四', avatar: 'https://i.pravatar.cc/150?img=2' },
  { id: 'user3', name: '王五', avatar: 'https://i.pravatar.cc/150?img=3' },
  { id: 'user4', name: '赵六', avatar: 'https://i.pravatar.cc/150?img=4' },
];

export const FullGridDemo: FC = () => {
  const gridRef = useRef<IGridRef>(null);
  const { theme, toggleTheme } = useGridTheme();
  const { showTooltip: showGridTooltip } = useGridTooltipStore();

  // 初始数据
  const [records, setRecords] = useState<IRecord[]>([
    {
      id: '1',
      name: '实现登录功能',
      score: 85,
      status: 'completed',
      tags: ['tag-a'],
      rating: 4,
      dueDate: '2025-10-20',
      assignee: 'user1',
      link: 'https://github.com/issue/1',
      attachments: null,
      group: 'A',
      clickCount: 0,
      totalScore: 85,
      priority: '高',
      isCompleted: true,
    },
    {
      id: '2',
      name: '优化数据库查询',
      score: 92,
      status: 'in-progress',
      tags: ['tag-b', 'tag-c'],
      rating: 5,
      dueDate: '2025-10-25',
      assignee: 'user2',
      link: 'https://github.com/issue/2',
      attachments: null,
      group: 'A',
      clickCount: 2,
      totalScore: 92,
      priority: '中',
      isCompleted: false,
    },
    {
      id: '3',
      name: '编写单元测试',
      score: 78,
      status: 'completed',
      tags: ['tag-b', 'tag-c'],
      rating: 3,
      dueDate: '2025-10-15',
      assignee: 'user3',
      link: null,
      attachments: null,
      group: 'B',
      clickCount: 1,
      totalScore: 78,
      priority: '低',
      isCompleted: true,
    },
    {
      id: '4',
      name: '设计UI界面',
      score: 88,
      status: 'todo',
      tags: ['tag-a', 'tag-b', 'tag-c', 'tag-d'],
      rating: 4,
      dueDate: '2025-11-01',
      assignee: 'user4',
      link: 'https://figma.com/design/1',
      attachments: null,
      group: 'B',
      clickCount: 0,
      totalScore: 88,
      priority: '高',
      isCompleted: false,
    },
    {
      id: '5',
      name: '部署到生产环境',
      score: 95,
      status: 'completed',
      tags: ['tag-a'],
      rating: 5,
      dueDate: '2025-10-30',
      assignee: 'user1',
      link: 'https://deploy.example.com',
      attachments: null,
      group: 'A',
      clickCount: 3,
      totalScore: 95,
      priority: '高',
      isCompleted: true,
    },
  ]);


  // 选中行状态
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set(['1', '2', '3']));

  // 定义列
  const columns = useMemo<IGridColumn[]>(
    () => [
      {
        id: 'name',
        name: '任务名称',
        width: 200,
        isPrimary: true,
        isFixed: true,
      },
      {
        id: 'score',
        name: '评分',
        width: 100,
      },
      {
        id: 'status',
        name: '单选',
        width: 120,
      },
      {
        id: 'tags',
        name: '多选',
        width: 250,
      },
      {
        id: 'isCompleted',
        name: '复选框',
        width: 100,
      },
      {
        id: 'rating',
        name: '评分',
        width: 150,
      },
      {
        id: 'dueDate',
        name: '截止日期',
        width: 150,
      },
      {
        id: 'assignee',
        name: '负责人',
        width: 150,
      },
      {
        id: 'link',
        name: '链接',
        width: 200,
      },
      {
        id: 'attachments',
        name: '附件',
        width: 150,
      },
      {
        id: 'group',
        name: '分组',
        width: 100,
      },
      {
        id: 'clickAction',
        name: '操作',
        width: 120,
      },
      {
        id: 'totalScore',
        name: '总分(公式)',
        width: 120,
      },
      {
        id: 'priority',
        name: '优先级(汇总)',
        width: 140,
      },
    ],
    []
  );

  // 获取单元格内容
  const getCellContent = useCallback((cell: ICellItem): ICell => {
    const [columnIndex, rowIndex] = cell;
    const record = records[rowIndex];

    if (!record) {
      return {
        type: CellType.Text,
        data: '',
        displayData: '',
        readonly: true,  // 禁用Grid默认编辑器
      };
    }

    switch (columnIndex) {
      case 0: // 任务名称
        return {
          type: CellType.Text,
          data: record.name,
          displayData: record.name,
        };

      case 1: // 评分
        return {
          type: CellType.Number,
          data: record.score,
          displayData: String(record.score),
          customEditor: (props, editorRef) => (
            <NumberEditor
              ref={editorRef}
              value={record.score}
              onChange={(newValue) => {
                updateRecord(record.id, 'score', newValue);
                props.onChange?.(newValue);
              }}
              onSave={() => props.setEditing?.(false)}
              onCancel={() => props.setEditing?.(false)}
              min={0}
              max={100}
              step={1}
              rect={props.rect}
              style={props.style}
            />
          ),
        };

      case 2: // 单选状态
        const statusOption = STATUS_OPTIONS.find(opt => opt.id === record.status);
        return {
          type: CellType.Select,
          data: [record.status],
          displayData: [statusOption?.name || record.status || ''],
          choiceSorted: STATUS_OPTIONS.map(o => o.name),
          isMultiple: false,
          customEditor: (props, editorRef) => (
            <SelectEditor
              ref={editorRef}
              value={record.status}
              options={STATUS_OPTIONS}
              onChange={(newValue) => {
                updateRecord(record.id, 'status', newValue);
                props.onChange?.(newValue);
              }}
              onSave={() => props.setEditing?.(false)}
              onCancel={() => props.setEditing?.(false)}
              searchable={true}
              rect={props.rect}
              style={props.style}
            />
          ),
        };

      case 3: // 多选标签
        const selectedTags = record.tags.map(tagId => 
          TAG_OPTIONS.find(opt => opt.id === tagId)?.name || tagId
        );
        return {
          type: CellType.Select,
          data: record.tags,
          displayData: selectedTags,
          choiceSorted: TAG_OPTIONS.map(o => o.name),
          choiceMap: TAG_OPTIONS.reduce((map, opt) => {
            map[opt.name] = { id: opt.id, name: opt.name, color: opt.color };
            return map;
          }, {} as Record<string, { id: string; name: string; color: string }>),
          isMultiple: true,
          customEditor: (props, editorRef) => (
            <SelectEditor
              ref={editorRef}
              value={record.tags}
              options={TAG_OPTIONS}
              onChange={(newValue) => {
                const tags = Array.isArray(newValue) ? newValue as string[] : (newValue ? [newValue as string] : []);
                updateRecord(record.id, 'tags', tags);
                props.onChange?.(tags);
              }}
              onSave={() => props.setEditing?.(false)}
              onCancel={() => props.setEditing?.(false)}
              searchable={true}
              multiple={true}
              rect={props.rect}
              style={props.style}
            />
          ),
        };

      case 4: // 复选框
        return {
          type: CellType.Boolean,
          data: record.isCompleted,
          readonly: false,
        };

      case 5: // 评分
        return {
          type: CellType.Rating,
          data: record.rating || 0,
          icon: 'star',
          color: '#fbbf24',
          max: 5,
          readonly: false,
        };

      case 6: // 截止日期
        return {
          type: CellType.Text,
          data: record.dueDate || '',
          displayData: record.dueDate || '',
          customEditor: (props, editorRef) => (
            <DateEditor
              ref={editorRef}
              value={record.dueDate || null}
              onChange={(newValue) => {
                updateRecord(record.id, 'dueDate', newValue);
                props.onChange?.(newValue);
              }}
              onSave={() => props.setEditing?.(false)}
              onCancel={() => props.setEditing?.(false)}
              showTime={false}
              rect={props.rect}
              style={props.style}
            />
          ),
        };

      case 7: // 负责人
        const user = USER_OPTIONS.find(u => u.id === record.assignee);
        return {
          type: CellType.Text,
          data: user?.name || '',
          displayData: user?.name || '',
          customEditor: (props, editorRef) => (
            <UserEditor
              ref={editorRef}
              value={record.assignee}
              users={USER_OPTIONS}
              onChange={(newValue) => {
                updateRecord(record.id, 'assignee', newValue);
                props.onChange?.(newValue);
              }}
              onSave={() => props.setEditing?.(false)}
              onCancel={() => props.setEditing?.(false)}
              searchable={true}
              rect={props.rect}
              style={props.style}
            />
          ),
        };

      case 8: // 链接
        return {
          type: CellType.Text,
          data: record.link || '',
          displayData: record.link || '',
          customEditor: (props, editorRef) => (
            <LinkEditor
              ref={editorRef}
              value={record.link || null}
              onChange={(newValue) => {
                updateRecord(record.id, 'link', newValue);
                props.onChange?.(newValue);
              }}
              onSave={() => props.setEditing?.(false)}
              onCancel={() => props.setEditing?.(false)}
              rect={props.rect}
              style={props.style}
            />
          ),
        };

      case 9: // 附件
        const attachmentCount = record.attachments?.length || 0;
        return {
          type: CellType.Text,
          data: attachmentCount > 0 ? `${attachmentCount} 个文件` : '无',
          displayData: attachmentCount > 0 ? `${attachmentCount} 个文件` : '无',
          customEditor: (props, editorRef) => (
            <AttachmentEditor
              ref={editorRef}
              value={record.attachments || null}
              onChange={(newValue) => {
                updateRecord(record.id, 'attachments', newValue);
                props.onChange?.(newValue);
              }}
              onSave={() => props.setEditing?.(false)}
              onCancel={() => props.setEditing?.(false)}
              maxFiles={5}
              rect={props.rect}
              style={props.style}
            />
          ),
        };

      case 10: // 分组
        return {
          type: CellType.Text,
          data: record.group,
          displayData: record.group,
          readonly: true,  // 禁用Grid默认编辑器，使用自定义编辑器
        };

      case 11: // 操作按钮
        return {
          type: CellType.Button,
          data: {
            cellValue: { count: record.clickCount },
            fieldOptions: { label: '点击我', color: 'Teal' },
            tableId: 'demo-table',
            statusHook: {
              checkLoading: () => false,
              buttonClick: ({ recordId }) => {
                // 更新点击计数
                setRecords(prev =>
                  prev.map(r =>
                    r.id === recordId
                      ? { ...r, clickCount: r.clickCount + 1 }
                      : r
                  )
                );
              },
            },
          },
          id: `${record.id}-clickAction`,
          readonly: false,
        };

      case 12: // 总分（Formula 字段示例）
        return {
          type: CellType.Number,
          data: record.totalScore,
          displayData: `${record.totalScore} 分`,
          readonly: true, // Formula 字段只读
        };

      case 13: // 优先级（Rollup 字段示例）
        return {
          type: CellType.Text,
          data: record.priority,
          displayData: record.priority,
          readonly: true, // Rollup 字段只读
        };

      default:
        return {
          type: CellType.Text,
          data: '',
          displayData: '',
          readonly: true,
        };
    }
  }, [records]);

  // 列统计
  const statisticsColumns = [
    { id: 'score', statisticType: 'avg' as const },
  ];
  const { getStatisticDisplay } = useGridColumnStatistics(statisticsColumns, records);

  // 更新记录
  const updateRecord = useCallback((recordId: string, columnId: string, value: any) => {
    setRecords((prev) =>
      prev.map((r) => (r.id === recordId ? { ...r, [columnId]: value } : r))
    );
  }, []);

  // 处理单元格编辑（来自渲染器的更新，如复选框点击）
  const handleCellEdited = useCallback((cell: ICellItem, newCell: ICell) => {
    const [columnIndex, rowIndex] = cell;
    const record = records[rowIndex];
    if (!record) return;

    const column = columns[columnIndex];
    if (!column) return;

    // 根据列ID更新对应的字段
    const columnId = column.id;
    const fieldMap: Record<string, keyof IRecord> = {
      'name': 'name',
      'score': 'score',
      'status': 'status',
      'tags': 'tags',
      'isCompleted': 'isCompleted',
      'rating': 'rating',
      'dueDate': 'dueDate',
      'assignee': 'assignee',
      'link': 'link',
      'attachments': 'attachments',
    };

    const fieldKey = fieldMap[columnId];
    if (fieldKey && 'data' in newCell) {
      updateRecord(record.id, fieldKey, newCell.data);
    }
  }, [records, columns, updateRecord]);

  // 快速测试编辑器 - 定位并高亮指定单元格
  const testEditor = useCallback((columnIndex: number, rowIndex: number) => {
    if (gridRef.current) {
      // 滚动到指定单元格
      gridRef.current.scrollToItem?.([columnIndex, rowIndex]);
      
      // 延迟一下让滚动完成，然后模拟双击
      setTimeout(() => {
        const cell: ICellItem = [columnIndex, rowIndex];
        // 这里我们只是滚动到单元格，用户需要手动双击
        // 实际使用中可以触发编辑状态
      }, 100);
    }
  }, []);

  // 列操作回调函数
  const handleAddColumn = useCallback((fieldType: any, insertIndex?: number) => {
    console.log('📌 添加列:', { fieldType, insertIndex });
    alert(`添加列: 类型=${fieldType}, 位置=${insertIndex ?? '末尾'}`);
  }, []);

  const handleEditColumn = useCallback((columnIndex: number, updatedColumn: IGridColumn) => {
    console.log('✏️ 编辑列:', { columnIndex, updatedColumn });
    alert(`编辑列 ${columnIndex}: ${updatedColumn.name}`);
  }, []);

  const handleDuplicateColumn = useCallback((columnIndex: number) => {
    console.log('📋 复制列:', columnIndex);
    alert(`复制列 ${columnIndex}: ${columns[columnIndex]?.name}`);
  }, [columns]);

  const handleDeleteColumn = useCallback((columnIndex: number) => {
    console.log('🗑 删除列:', columnIndex);
    if (confirm(`确定要删除列 "${columns[columnIndex]?.name}" 吗？`)) {
      alert(`已删除列 ${columnIndex}`);
    }
  }, [columns]);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: theme.backgroundColor,
        color: theme.textColor,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* 顶部工具栏 */}
      <div
        style={{
          padding: '16px',
          borderBottom: `1px solid ${theme.borderColor}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
            🎨 luck-grid 全功能演示
          </h1>
          <p style={{ margin: '8px 0 0 0', color: theme.textColor, opacity: 0.7 }}>
            双击单元格进行编辑 | 体验所有增强功能
          </p>
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {/* 行计数器 */}
          <RowCounter
            totalCount={records.length}
            selectedCount={selectedRowIds.size}
          />

          {/* 统计信息 */}
          <div
            style={{
              padding: '8px 16px',
              backgroundColor: theme.secondaryColor,
              borderRadius: '8px',
            }}
          >
            <span style={{ fontSize: '12px', opacity: 0.7 }}>平均评分</span>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: theme.primaryColor }}>
              {getStatisticDisplay('score', 'total')}
            </div>
          </div>

          {/* 主题切换 */}
          <button
            onClick={toggleTheme}
            style={{
              padding: '8px 16px',
              backgroundColor: theme.primaryColor,
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          >
            {theme.mode === 'light' ? '🌙' : '🌞'} 切换主题
          </button>
        </div>
      </div>

      {/* Grid 组件 */}
      <div style={{ flex: 1, overflow: 'hidden', paddingBottom: '240px' ,height:'800px',width:'1000px'}}>
        <Grid
          ref={gridRef}
          columns={columns}
          rowCount={records.length}
          getCellContent={getCellContent}
          onCellEdited={handleCellEdited}
          onAddColumn={handleAddColumn}
          onEditColumn={handleEditColumn}
          onDuplicateColumn={handleDuplicateColumn}
          onDeleteColumn={handleDeleteColumn}
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: theme.backgroundColor,
            color: theme.textColor,
          }}
        />
      </div>

      {/* Tooltip */}
      <GridTooltip id="grid-tooltip" />

      {/* 测试控制面板 */}
      <div
        style={{
          position: 'fixed',
          bottom: '16px',
          left: '16px',
          right: '16px',
          padding: '16px',
          backgroundColor: theme.backgroundColor,
          border: `2px solid ${theme.primaryColor}`,
          borderRadius: '12px',
          fontSize: '13px',
          maxHeight: '220px',
          overflowY: 'auto',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
            🧪 编辑器测试面板
          </div>
          <div style={{ fontSize: '12px', opacity: 0.7 }}>
            点击下方按钮快速测试各编辑器（会滚动到对应单元格）
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
          {/* TextEditor */}
          <button
            onClick={() => testEditor(0, 0)}
            style={{
              padding: '10px 14px',
              backgroundColor: theme.primaryColor,
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              transition: 'transform 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <span>📝</span>
            <span>文本编辑器</span>
          </button>

          {/* NumberEditor */}
          <button
            onClick={() => testEditor(1, 0)}
            style={{
              padding: '10px 14px',
              backgroundColor: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              transition: 'transform 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <span>🔢</span>
            <span>数字编辑器</span>
          </button>

          {/* SelectEditor - 单选 */}
          <button
            onClick={() => testEditor(2, 0)}
            style={{
              padding: '10px 14px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              transition: 'transform 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <span>📋</span>
            <span>单选编辑器</span>
          </button>

          {/* MultiSelectEditor - 多选 */}
          <button
            onClick={() => testEditor(3, 0)}
            style={{
              padding: '10px 14px',
              backgroundColor: '#06b6d4',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              transition: 'transform 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <span>🏷️</span>
            <span>多选标签</span>
          </button>

          {/* BooleanEditor - 复选框 */}
          <button
            onClick={() => testEditor(4, 0)}
            style={{
              padding: '10px 14px',
              backgroundColor: '#84cc16',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              transition: 'transform 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <span>☑️</span>
            <span>复选框</span>
          </button>

          {/* RatingEditor */}
          <button
            onClick={() => testEditor(5, 0)}
            style={{
              padding: '10px 14px',
              backgroundColor: '#fbbf24',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
            }}
          >
            <span>⭐</span>
            <span>评分</span>
          </button>

          {/* DateEditor */}
          <button
            onClick={() => testEditor(6, 0)}
            style={{
              padding: '10px 14px',
              backgroundColor: '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              transition: 'transform 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <span>📅</span>
            <span>日期编辑器</span>
          </button>

          {/* UserEditor */}
          <button
            onClick={() => testEditor(7, 0)}
            style={{
              padding: '10px 14px',
              backgroundColor: '#ec4899',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              transition: 'transform 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <span>👤</span>
            <span>用户选择器</span>
          </button>

          {/* LinkEditor */}
          <button
            onClick={() => testEditor(8, 0)}
            style={{
              padding: '10px 14px',
              backgroundColor: '#06b6d4',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              transition: 'transform 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <span>🔗</span>
            <span>链接编辑器</span>
          </button>

          {/* AttachmentEditor */}
          <button
            onClick={() => testEditor(9, 0)}
            style={{
              padding: '10px 14px',
              backgroundColor: '#f97316',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              transition: 'transform 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <span>📎</span>
            <span>附件编辑器</span>
          </button>

          {/* Button Field */}
          <button
            onClick={() => testEditor(11, 0)}
            style={{
              padding: '10px 14px',
              backgroundColor: '#14b8a6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              transition: 'transform 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <span>🔘</span>
            <span>Button 字段</span>
          </button>

          {/* Formula Field */}
          <button
            onClick={() => testEditor(12, 0)}
            style={{
              padding: '10px 14px',
              backgroundColor: '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              transition: 'transform 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <span>🧮</span>
            <span>Formula 字段</span>
          </button>

          {/* Rollup Field */}
          <button
            onClick={() => testEditor(13, 0)}
            style={{
              padding: '10px 14px',
              backgroundColor: '#a855f7',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              transition: 'transform 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <span>📊</span>
            <span>Rollup 字段</span>
          </button>
        </div>

        <div style={{ 
          marginTop: '12px', 
          paddingTop: '12px', 
          borderTop: `1px solid ${theme.borderColor}`,
          fontSize: '12px',
          opacity: 0.8,
        }}>
          💡 提示：点击按钮后，请在高亮的单元格上双击以打开编辑器（Button 字段除外，直接点击即可）
        </div>
      </div>
    </div>
  );
};

