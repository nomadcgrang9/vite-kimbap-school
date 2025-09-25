import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import pages from '@hono/vite-cloudflare-pages'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    pages()
  ],
  base: '/', // 루트 경로로 변경하여 직접 접근 가능하게 함
  build: {
    outDir: 'dist'
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '.e2b.dev'  // E2B 샌드박스 도메인 허용
    ]
  }
})
