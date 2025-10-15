#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 别名到相对路径的映射规则
const aliasMappings = {
  '@/api': '../api',
  '@/context': '../context',
  '@/hooks': '../hooks',
  '@/model': '../model',
  '@/lib': '../lib',
  '@/components': '../components',
  '@/grid': '../grid',
  '@/utils': '../utils',
  '@/types': '../types',
  '@/ui': '../ui'
};

// 递归处理目录
function processDirectory(dirPath, relativeTo = '') {
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath, path.join(relativeTo, item));
    } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
      processFile(fullPath, relativeTo);
    }
  }
}

// 处理单个文件
function processFile(filePath, relativeTo) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // 处理每个别名映射
  for (const [alias, relativePath] of Object.entries(aliasMappings)) {
    // 计算从当前文件到目标路径的相对路径
    const targetPath = calculateRelativePath(relativeTo, relativePath);
    
    // 替换别名导入
    const aliasRegex = new RegExp(`from\\s+['"]${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^'"]*)['"]`, 'g');
    const newContent = content.replace(aliasRegex, (match, suffix) => {
      modified = true;
      return `from '${targetPath}${suffix}'`;
    });
    
    content = newContent;
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

// 计算相对路径
function calculateRelativePath(from, to) {
  if (!from) {
    return `./${to}`;
  }
  
  const fromParts = from.split('/').filter(p => p);
  const toParts = to.split('/').filter(p => p);
  
  // 找到公共前缀
  let commonPrefixLength = 0;
  while (commonPrefixLength < fromParts.length && 
         commonPrefixLength < toParts.length && 
         fromParts[commonPrefixLength] === toParts[commonPrefixLength]) {
    commonPrefixLength++;
  }
  
  // 构建相对路径
  const upLevels = fromParts.length - commonPrefixLength;
  const upPath = '../'.repeat(upLevels);
  const downPath = toParts.slice(commonPrefixLength).join('/');
  
  if (downPath) {
    return `${upPath}${downPath}`;
  } else {
    return upPath.slice(0, -1) || './';
  }
}

// 开始处理
console.log('Converting alias imports to relative imports...');
processDirectory(path.join(__dirname, 'src'));
console.log('Conversion completed!');
