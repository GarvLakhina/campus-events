import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/events': 'http://localhost:4000',
      '/reports': 'http://localhost:4000',
      '/colleges': 'http://localhost:4000'
    }
  }
})
