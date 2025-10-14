#!/bin/bash

# 批量更新导入路径的脚本

# 更新 core 目录下的文件
find src/grid/core -type f \( -name "*.ts" -o -name "*.tsx" \) ! -name "index.ts" -exec sed -i '' \
  -e "s|from '\\./configs'|from '../configs'|g" \
  -e "s|from '\\./managers'|from '../managers'|g" \
  -e "s|from '\\./renderers'|from '../renderers'|g" \
  -e "s|from '\\./utils'|from '../utils/core'|g" \
  -e "s|from '\\./hooks'|from '../hooks/primitive'|g" \
  -e "s|from '\\./components'|from '../components'|g" \
  {} \;

# 更新 hooks/business 目录
find src/grid/hooks/business -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e "s|from '../../grid/|from '@/grid/|g" \
  -e "s|from '../constant'|from './constant'|g" \
  {} \;

# 更新 hooks/primitive 目录
find src/grid/hooks/primitive -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e "s|from '\\../interface'|from '../../types/grid'|g" \
  -e "s|from '\\../managers'|from '../../managers'|g" \
  -e "s|from '\\../utils'|from '../../utils/core'|g" \
  {} \;

# 更新 components 目录
find src/grid/components -type f \( -name "*.ts" -o -name "*.tsx" \) ! -name "index.ts" -exec sed -i '' \
  -e "s|from '../../interface'|from '../../types/grid'|g" \
  -e "s|from '../../configs'|from '@/grid/configs'|g" \
  -e "s|from '../../renderers'|from '@/grid/renderers'|g" \
  -e "s|from '../../managers'|from '@/grid/managers'|g" \
  -e "s|from '../../utils'|from '@/grid/utils/core'|g" \
  -e "s|from '../../hooks'|from '@/grid/hooks/primitive'|g" \
  {} \;

# 更新 store 目录
find src/grid/store -type f \( -name "*.ts" -o -name "*.tsx" \) ! -name "index.ts" -exec sed -i '' \
  -e "s|from '../../grid/|from '@/grid/|g" \
  -e "s|from '../grid-enhancements/|from '@/grid/|g" \
  {} \;

# 更新 utils/business 目录
find src/grid/utils/business -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e "s|from '../../grid/|from '@/grid/|g" \
  {} \;

echo "导入路径更新完成！"


