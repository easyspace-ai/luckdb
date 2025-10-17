import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            // Grid 包需要的别名配置 - 支持 dist 目录中的别名导入
            '@/api/*': path.resolve(__dirname, '../packages/grid/src/api/*'),
            '@/context/*': path.resolve(__dirname, '../packages/grid/src/context/*'),
            '@/hooks/*': path.resolve(__dirname, '../packages/grid/src/hooks/*'),
            '@/model/*': path.resolve(__dirname, '../packages/grid/src/model/*'),
            '@/lib/*': path.resolve(__dirname, '../packages/grid/src/lib/*'),
            '@/components/*': path.resolve(__dirname, '../packages/grid/src/components/*'),
            '@/grid/*': path.resolve(__dirname, '../packages/grid/src/grid/*'),
            '@/utils/*': path.resolve(__dirname, '../packages/grid/src/utils/*'),
            '@/types/*': path.resolve(__dirname, '../packages/grid/src/types/*'),
            '@/ui/*': path.resolve(__dirname, '../packages/grid/src/ui/*'),
            '@/api': path.resolve(__dirname, '../packages/grid/src/api'),
            '@/context': path.resolve(__dirname, '../packages/grid/src/context'),
            '@/hooks': path.resolve(__dirname, '../packages/grid/src/hooks'),
            '@/model': path.resolve(__dirname, '../packages/grid/src/model'),
            '@/lib': path.resolve(__dirname, '../packages/grid/src/lib'),
            '@/components': path.resolve(__dirname, '../packages/grid/src/components'),
            '@/grid': path.resolve(__dirname, '../packages/grid/src/grid'),
            '@/utils': path.resolve(__dirname, '../packages/grid/src/utils'),
            '@/types': path.resolve(__dirname, '../packages/grid/src/types'),
            '@/ui': path.resolve(__dirname, '../packages/grid/src/ui'),
        },
    },
    optimizeDeps: {
        include: ['@luckdb/grid', '@luckdb/sdk'],
        exclude: [],
    },
    define: {
        'import.meta.env.VITE_BASENAME': JSON.stringify(process.env.VITE_BASENAME || ''),
    },
});
