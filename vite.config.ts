import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    base: './',
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          headers: env.DRIVE_UPLOAD_TOKEN
            ? { Authorization: `Bearer ${env.DRIVE_UPLOAD_TOKEN}` }
            : undefined,
        }
      }
    }
  }
})
