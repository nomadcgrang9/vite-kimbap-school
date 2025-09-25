import { defineConfig } from 'vite'
import { resolve } from 'path'
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs'

// static 폴더 복사를 위한 커스텀 플러그인
const copyStaticPlugin = () => ({
  name: 'copy-static',
  writeBundle() {
    const staticSrc = resolve(__dirname, 'public/static')
    const staticDest = resolve(__dirname, 'dist/static')
    
    // 재귀적으로 파일을 복사하는 함수
    const copyRecursive = (src: string, dest: string) => {
      if (!existsSync(src)) return
      
      if (!existsSync(dest)) {
        mkdirSync(dest, { recursive: true })
      }
      
      const items = readdirSync(src)
      items.forEach((item: string) => {
        const srcPath = resolve(src, item)
        const destPath = resolve(dest, item)
        
        if (statSync(srcPath).isDirectory()) {
          copyRecursive(srcPath, destPath)
        } else {
          copyFileSync(srcPath, destPath)
          console.log(`📁 Copied: static/${item}`)
        }
      })
    }
    
    // static 디렉토리가 존재하는지 확인하고 복사
    if (existsSync(staticSrc)) {
      copyRecursive(staticSrc, staticDest)
    }
  }
})

// 정적 HTML 파일들을 위한 멀티 페이지 설정
export default defineConfig({
  plugins: [copyStaticPlugin()],
  root: 'public',
  base: '/',
  publicDir: false, // public 안에 있으므로 자동 복사 비활성화
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'public/index.html'),
        student: resolve(__dirname, 'public/student.html'),
        admin: resolve(__dirname, 'public/admin-v2.html')
      }
    },
    assetsDir: '.'  // assets를 루트에 배치
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '.e2b.dev'
    ]
  }
})
