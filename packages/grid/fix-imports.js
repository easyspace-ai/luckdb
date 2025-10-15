#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 手动修复的映射
const manualFixes = [
  // model/group/GroupManager.ts
  {
    file: 'src/model/group/GroupManager.ts',
    from: '../../../types/field',
    to: '../../types/field'
  },
  // model/sort/SortManager.ts
  {
    file: 'src/model/sort/SortManager.ts',
    from: '../../../types/field',
    to: '../../types/field'
  },
  // model/filter/factory.ts
  {
    file: 'src/model/filter/factory.ts',
    from: '../../../types/field',
    to: '../../types/field'
  },
  // grid/core/InfiniteScroller.tsx
  {
    file: 'src/grid/core/InfiniteScroller.tsx',
    from: '../../../utils/string',
    to: '../../utils/string'
  },
  // grid/types/grid.ts
  {
    file: 'src/grid/types/grid.ts',
    from: '../../../types',
    to: '../../types'
  },
  // grid/components/ui/LoadingIndicator.tsx
  {
    file: 'src/grid/components/ui/LoadingIndicator.tsx',
    from: '../../../../utils/icons',
    to: '../../../utils/icons'
  },
  // grid/store/useGridViewStore.ts
  {
    file: 'src/grid/store/useGridViewStore.ts',
    from: '../../../grid/managers',
    to: '../managers'
  },
  // grid/hooks/business/useGridFileEvent.ts
  {
    file: 'src/grid/hooks/business/useGridFileEvent.ts',
    from: '../../../../grid/interface',
    to: '../../../interface'
  },
  {
    file: 'src/grid/hooks/business/useGridFileEvent.ts',
    from: '../../../../grid/managers',
    to: '../../../managers'
  },
  // grid/components/editors/basic/TextEditor.tsx
  {
    file: 'src/grid/components/editors/basic/TextEditor.tsx',
    from: '../../../../../ui',
    to: '../../../../ui'
  },
  {
    file: 'src/grid/components/editors/basic/TextEditor.tsx',
    from: '../../../../../grid/configs',
    to: '../../../configs'
  },
  {
    file: 'src/grid/components/editors/basic/TextEditor.tsx',
    from: '../../../../../grid/renderers',
    to: '../../../renderers'
  },
  // grid/components/editors/basic/ImageEditor.tsx
  {
    file: 'src/grid/components/editors/basic/ImageEditor.tsx',
    from: '../../../../../grid/renderers/cell-renderer/interface',
    to: '../../../renderers/cell-renderer/interface'
  },
  {
    file: 'src/grid/components/editors/basic/ImageEditor.tsx',
    from: '../../../../../ui',
    to: '../../../../ui'
  },
  // grid/components/editors/basic/ChartEditor.tsx
  {
    file: 'src/grid/components/editors/basic/ChartEditor.tsx',
    from: '../../../../../grid/renderers/cell-renderer/interface',
    to: '../../../renderers/cell-renderer/interface'
  },
  {
    file: 'src/grid/components/editors/basic/ChartEditor.tsx',
    from: '../../../../../ui',
    to: '../../../../ui'
  },
  // grid/components/editors/basic/BooleanEditor.tsx
  {
    file: 'src/grid/components/editors/basic/BooleanEditor.tsx',
    from: '../../../../../grid/renderers',
    to: '../../../renderers'
  },
  // grid/components/editors/enhanced/RatingEditor.tsx
  {
    file: 'src/grid/components/editors/enhanced/RatingEditor.tsx',
    from: '../../../../../types/field',
    to: '../../../../types/field'
  },
  // grid/components/editors/EditorContainer.tsx
  {
    file: 'src/grid/components/editors/EditorContainer.tsx',
    from: '../../../../grid/configs',
    to: '../../configs'
  },
  {
    file: 'src/grid/components/editors/EditorContainer.tsx',
    from: '../../../../grid/hooks/primitive',
    to: '../../hooks/primitive'
  },
  {
    file: 'src/grid/components/editors/EditorContainer.tsx',
    from: '../../../../grid/managers',
    to: '../../managers'
  },
  {
    file: 'src/grid/components/editors/EditorContainer.tsx',
    from: '../../../../grid/utils/core',
    to: '../../utils/core'
  },
  // context files
  {
    file: 'src/context/base/BaseContext.tsx',
    from: '../../../api/client',
    to: '../../api/client'
  },
  {
    file: 'src/context/base/BaseContext.tsx',
    from: '../../../api/types',
    to: '../../api/types'
  },
  {
    file: 'src/context/field/FieldContext.tsx',
    from: '../../../api/client',
    to: '../../api/client'
  },
  {
    file: 'src/context/field/FieldContext.tsx',
    from: '../../../model/field/factory',
    to: '../../model/field/factory'
  },
  {
    file: 'src/context/field/FieldContext.tsx',
    from: '../../../api/types',
    to: '../../api/types'
  },
  {
    file: 'src/context/field/FieldContext.tsx',
    from: '../../../model/field/Field',
    to: '../../model/field/Field'
  },
  {
    file: 'src/context/permission/PermissionContext.tsx',
    from: '../../../api/client',
    to: '../../api/client'
  },
  {
    file: 'src/context/permission/PermissionContext.tsx',
    from: '../../../api/types',
    to: '../../api/types'
  },
  {
    file: 'src/context/session/SessionContext.tsx',
    from: '../../../api/client',
    to: '../../api/client'
  },
  {
    file: 'src/context/table/TableContext.tsx',
    from: '../../../api/client',
    to: '../../api/client'
  },
  {
    file: 'src/context/table/TableContext.tsx',
    from: '../../../api/types',
    to: '../../api/types'
  },
  {
    file: 'src/context/view/ViewContext.tsx',
    from: '../../../api/client',
    to: '../../api/client'
  },
  {
    file: 'src/context/view/ViewContext.tsx',
    from: '../../../model/view/View',
    to: '../../model/view/View'
  },
  {
    file: 'src/context/view/ViewContext.tsx',
    from: '../../../api/types',
    to: '../../api/types'
  },
  {
    file: 'src/context/connection/ConnectionContext.tsx',
    from: '../../../lib/websocket',
    to: '../../lib/websocket'
  },
  {
    file: 'src/context/connection/ConnectionContext.tsx',
    from: '../../../lib/sharedb',
    to: '../../lib/sharedb'
  },
  {
    file: 'src/context/history/HistoryContext.tsx',
    from: '../../../lib/operation-history',
    to: '../../lib/operation-history'
  },
  {
    file: 'src/context/AppProviders.tsx',
    from: '../../api/client',
    to: '../api/client'
  },
  // model files
  {
    file: 'src/model/field/Field.ts',
    from: '../../../api/types',
    to: '../../api/types'
  },
  {
    file: 'src/model/field/factory.ts',
    from: '../../../api/types',
    to: '../../api/types'
  },
  {
    file: 'src/model/record/Record.ts',
    from: '../../../api/types',
    to: '../../api/types'
  },
  {
    file: 'src/model/view/View.ts',
    from: '../../../api/types',
    to: '../../api/types'
  }
];

// 处理每个修复
for (const fix of manualFixes) {
  const filePath = path.join(__dirname, fix.file);
  
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    const regex = new RegExp(`from\\s+['"]${fix.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`, 'g');
    const newContent = content.replace(regex, `from '${fix.to}'`);
    
    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`Fixed: ${fix.file} - ${fix.from} -> ${fix.to}`);
    }
  } else {
    console.log(`File not found: ${fix.file}`);
  }
}

console.log('Manual fixes completed!');
