import React from 'react';

export interface IGridToolbarProps {
  onFieldConfig?: () => void;
  onFilter?: () => void;
  onSort?: () => void;
  onGroup?: () => void;
  onSearch?: () => void;
  onFullscreen?: () => void;
  onShare?: () => void;
  onAPI?: () => void;
  onCollaboration?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onAddNew?: () => void;
  onToggleToolbar?: () => void;
  onToggleStatistics?: () => void;
}

export const GridToolbar: React.FC<IGridToolbarProps> = (props) => {
  const {
    onFieldConfig,
    onFilter,
    onSort,
    onGroup,
    onSearch,
    onFullscreen,
    onShare,
    onAPI,
    onCollaboration,
    onUndo,
    onRedo,
    onAddNew,
    onToggleToolbar,
    onToggleStatistics,
  } = props;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: '#ffffff',
        minHeight: '48px',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* 左侧：导航控制 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={onUndo}
          style={{
            padding: '6px 10px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            backgroundColor: '#ffffff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
          }}
          title="撤销"
        >
          ←
        </button>
        <button
          onClick={onRedo}
          style={{
            padding: '6px 10px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            backgroundColor: '#ffffff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
          }}
          title="重做"
        >
          →
        </button>
        <button
          onClick={onAddNew}
          style={{
            padding: '6px 10px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            backgroundColor: '#ffffff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
          }}
          title="新增"
        >
          ⊕
        </button>
      </div>

      {/* 中间：功能按钮 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={onFieldConfig}
          style={{
            padding: '6px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            backgroundColor: '#ffffff',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          字段配置
        </button>
        <button
          onClick={onFilter}
          style={{
            padding: '6px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            backgroundColor: '#ffffff',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          筛选
        </button>
        <button
          onClick={onSort}
          style={{
            padding: '6px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            backgroundColor: '#ffffff',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          排序
        </button>
        <button
          onClick={onGroup}
          style={{
            padding: '6px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            backgroundColor: '#ffffff',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          分组
        </button>
      </div>

      {/* 右侧：工具图标 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={onSearch}
          style={{
            padding: '6px 10px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            backgroundColor: '#ffffff',
            cursor: 'pointer',
          }}
          title="搜索"
        >
          🔍
        </button>
        <button
          onClick={onFullscreen}
          style={{
            padding: '6px 10px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            backgroundColor: '#ffffff',
            cursor: 'pointer',
          }}
          title="全屏"
        >
          ⛶
        </button>
        <button
          onClick={onShare}
          style={{
            padding: '6px 10px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            backgroundColor: '#ffffff',
            cursor: 'pointer',
          }}
          title="分享"
        >
          ↗
        </button>
        <button
          onClick={onAPI}
          style={{
            padding: '6px 10px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            backgroundColor: '#ffffff',
            cursor: 'pointer',
          }}
          title="API"
        >
          {'</>'}
        </button>
        <button
          onClick={onCollaboration}
          style={{
            padding: '6px 10px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            backgroundColor: '#ffffff',
            cursor: 'pointer',
          }}
          title="协作"
        >
          👥
        </button>
        <div style={{ width: '1px', height: '24px', backgroundColor: '#d1d5db', margin: '0 4px' }} />
        <button
          onClick={onToggleToolbar}
          style={{
            padding: '6px 10px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            backgroundColor: '#ffffff',
            cursor: 'pointer',
          }}
          title="隐藏工具栏"
        >
          ▲
        </button>
      </div>
    </div>
  );
};

