# @luckdb/utils

LuckDB 工具函数库

## 安装

```bash
pnpm add @luckdb/utils
```

## 使用

```typescript
import { formatDate, truncate, isEmail, formatFileSize } from '@luckdb/utils';

// 日期格式化
formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss'); // "2024-01-01 12:00:00"

// 字符串截断
truncate('这是一个很长的字符串', 10); // "这是一个很长的字..."

// 邮箱验证
isEmail('user@example.com'); // true

// 文件大小格式化
formatFileSize(1024000); // "1000 KB"
```

## API

### 日期工具

- `formatDate(date, format)` - 格式化日期
- `getRelativeTime(date)` - 获取相对时间

### 字符串工具

- `truncate(str, length, suffix)` - 截断字符串
- `capitalize(str)` - 首字母大写
- `camelToSnake(str)` - 驼峰转下划线
- `snakeToCamel(str)` - 下划线转驼峰
- `randomString(length)` - 生成随机字符串

### 验证工具

- `isEmail(email)` - 验证邮箱
- `isURL(url)` - 验证 URL
- `isPhoneNumber(phone)` - 验证手机号
- `isEmpty(value)` - 验证是否为空

### 格式化工具

- `formatFileSize(bytes)` - 格式化文件大小
- `formatNumber(num)` - 格式化数字（千分位）
- `formatPercent(value, decimals)` - 格式化百分比

