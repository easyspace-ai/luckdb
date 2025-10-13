# LuckDB Web Application

LuckDB 主 Web 应用 - 基于 Next.js 14

## 开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

访问 http://localhost:3000

## 构建

```bash
# 构建生产版本
pnpm build

# 启动生产服务器
pnpm start
```

## 项目结构

```
src/
├── app/              # Next.js 13+ App Router
│   ├── layout.tsx   # 根布局
│   ├── page.tsx     # 首页
│   └── dashboard/   # Dashboard 页面
├── components/      # 页面组件
├── lib/            # 工具函数
└── styles/         # 样式文件
```

## 环境变量

复制 `.env.example` 为 `.env.local` 并配置：

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

