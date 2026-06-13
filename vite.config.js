import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/mcp': {
        target: process.env.VITE_MCP_URL || 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path, // keep /mcp prefix as-is
      },
      '/api': {
        target: process.env.VITE_MCP_URL || 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  }
})