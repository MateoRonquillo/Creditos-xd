import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Intercepta todo lo que vaya a /api y lo manda al Gateway
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      }
    }
  }
})