import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // base: '/M-MALL/',
  // 개발환경에서는 base 경로 없음, 배포시에만 설정
  base: process.env.NODE_ENV === 'production' ? '/M-MALL/' : '/',
  build: {
    outDir: 'dist'
  }
})