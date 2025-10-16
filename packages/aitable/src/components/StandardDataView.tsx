import React, { useMemo, useState, useRef } from 'react';
import type { IGridProps, IGridRef } from '../grid/core/Grid';
import { Grid } from '../grid/core/Grid';
import { GridErrorBoundary } from '../grid/error-handling/GridErrorBoundary';
import { GridToolbar as RefactoredToolbar } from '../grid/components/toolbar/GridToolbar.refactored';
import { cn, tokens } from '../grid/design-system';

export interface StandardToolbarConfig {
  showUndoRedo?: boolean;
  showAddNew?: boolean;
  showFieldConfig?: boolean;
  showFilter?: boolean;
  showSort?: boolean;
  showGroup?: boolean;
  showSearch?: boolean;
  showFullscreen?: boolean;
  showShare?: boolean;
  showAPI?: boolean;
  showCollaboration?: boolean;
}

export interface StandardDataViewProps {
  // Section visibility
  showHeader?: boolean; // 顶部标签：表 / 示图 + 添加
  showToolbar?: boolean; // 工具栏
  showStatus?: boolean; // 底部状态栏

  // Header tabs
  tabs?: Array<{ key: string; label: string }>; // 默认 ['table','chart']
  defaultTabKey?: string;
  onAdd?: () => void; // 顶部 + 按钮

  // Toolbar configuration
  toolbarConfig?: StandardToolbarConfig;
  onToolbar?: Partial<Parameters<typeof RefactoredToolbar>[0]>; // 允许传入回调覆盖

  // Grid
  gridProps: IGridProps; // 必填：对外暴露 Grid 的完整能力

  // Status Bar 渲染器，可自定义
  statusContent?: React.ReactNode;

  className?: string;
  style?: React.CSSProperties;
}

const DEFAULT_TABS: Array<{ key: string; label: string }> = [
  { key: 'table', label: '表' },
  { key: 'chart', label: '示图' },
];

const DEFAULT_TOOLBAR: Required<StandardToolbarConfig> = {
  showUndoRedo: true,
  showAddNew: true,
  showFieldConfig: true,
  showFilter: true,
  showSort: true,
  showGroup: true,
  showSearch: true,
  showFullscreen: true,
  showShare: false,
  showAPI: false,
  showCollaboration: false,
};

export function StandardDataView(props: StandardDataViewProps) {
  const {
    showHeader = true,
    showToolbar = true,
    showStatus = true,
    tabs = DEFAULT_TABS,
    defaultTabKey = 'table',
    onAdd,
    toolbarConfig,
    onToolbar,
    gridProps,
    statusContent,
    className,
    style,
  } = props;

  const gridRef = useRef<IGridRef>(null);
  const [activeKey, setActiveKey] = useState<string>(defaultTabKey);

  const mergedToolbar = useMemo(() => ({
    ...DEFAULT_TOOLBAR,
    ...(toolbarConfig ?? {}),
  }), [toolbarConfig]);

  return (
    <div
      className={cn('flex h-full w-full flex-col', className)}
      style={style}
    >
      {/* Section 1: Header Tabs */}
      {showHeader && (
        <div
          className={cn(
            'flex items-center px-4',
            'h-12 border-b',
          )}
          style={{
            backgroundColor: tokens.colors.surface.base,
            borderColor: tokens.colors.border.subtle,
          }}
        >
          {/* Tabs - shadcn/lifted 风格（无依赖实现） */}
          <div role="tablist" className="flex items-center gap-0 py-0">
            {tabs.map((t) => {
              const active = activeKey === t.key;
              return (
                <button
                  key={t.key}
                  role="tab"
                  aria-selected={active}
                  data-state={active ? 'active' : 'inactive'}
                  onClick={() => setActiveKey(t.key)}
                  className={cn(
                    // simplified lifted: rely on bottom border to indicate active
                    'h-10 -mb-px px-3 text-sm font-medium rounded-none rounded-t',
                    'transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40',
                    active
                      ? 'text-foreground border-b-2 border-b-gray-900'
                      : 'text-muted-foreground border-b-2 border-b-transparent hover:text-foreground/80',
                  )}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={onAdd}
              className={cn(
                'h-8 w-8 inline-flex items-center justify-center rounded-full',
                'border bg-white text-gray-800',
                'transition-all duration-150',
                'hover:bg-gray-50',
              )}
              style={{ borderColor: tokens.colors.border.default }}
            >
              +
            </button>
          </div>
        </div>
      )}

      {/* Section 2: Toolbar */}
      {showToolbar && activeKey === 'table' && (
        <RefactoredToolbar
          align="left"
          onUndo={onToolbar?.onUndo}
          onRedo={onToolbar?.onRedo}
          onAddNew={mergedToolbar.showAddNew ? onToolbar?.onAddNew : undefined}
          onFieldConfig={mergedToolbar.showFieldConfig ? onToolbar?.onFieldConfig : undefined}
          onFilter={mergedToolbar.showFilter ? onToolbar?.onFilter : undefined}
          onSort={mergedToolbar.showSort ? onToolbar?.onSort : undefined}
          onGroup={mergedToolbar.showGroup ? onToolbar?.onGroup : undefined}
          onSearch={mergedToolbar.showSearch ? onToolbar?.onSearch : undefined}
          onFullscreen={mergedToolbar.showFullscreen ? onToolbar?.onFullscreen : undefined}
          onShare={mergedToolbar.showShare ? onToolbar?.onShare : undefined}
          onAPI={mergedToolbar.showAPI ? onToolbar?.onAPI : undefined}
          onCollaboration={mergedToolbar.showCollaboration ? onToolbar?.onCollaboration : undefined}
          undoDisabled={!mergedToolbar.showUndoRedo}
          redoDisabled={!mergedToolbar.showUndoRedo}
          showStatistics={false}
        />
      )}

      {/* Section 3: Content */}
      <div className="flex min-h-0 flex-1 flex-col">
        {activeKey === 'table' ? (
          <div className="relative flex min-h-0 flex-1">
            <GridErrorBoundary>
              <Grid ref={gridRef} {...gridProps} />
            </GridErrorBoundary>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-gray-500">
            图表视图将在后续版本中提供 API 对接
          </div>
        )}
      </div>

      {/* Section 4: Status Bar */}
      {showStatus && (
        <div
          className="h-10 border-t px-4 text-sm text-gray-600 flex items-center justify-between"
          style={{ borderColor: tokens.colors.border.subtle }}
        >
          <div>
            共 {gridProps.rowCount} 条记录
          </div>
          <div>
            {statusContent}
          </div>
        </div>
      )}
    </div>
  );
}

export default StandardDataView;


