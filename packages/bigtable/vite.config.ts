import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: './example',
  publicDir: false,
  build: {
    outDir: '../dist-example',
  },
  resolve: {
    alias: {
      '@luckdb/bigtable': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3200,
    open: true,
  },
});
