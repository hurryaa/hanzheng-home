/** WARNING: DON'T EDIT THIS FILE */
/** WARNING: DON'T EDIT THIS FILE */
/** WARNING: DON'T EDIT THIS FILE */

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

function getPlugins() {
  const plugins = [react(), tsconfigPaths()];
  return plugins;
}

export default defineConfig({
  plugins: getPlugins(),
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // 将 React 相关库分离到单独的 chunk
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // 将图表库分离
          'charts': ['recharts'],
          // 将工具库分离
          'utils': ['clsx', 'tailwind-merge', 'zod'],
          // 将状态管理库分离
          'state': ['zustand'],
          // 将 UI 库分离
          'ui': ['framer-motion', 'sonner'],
          // 将 Excel 处理库分离
          'excel': ['xlsx']
        }
      }
    },
    // 设置 chunk 大小警告限制为 1000kb
    chunkSizeWarningLimit: 1000
  }
});
