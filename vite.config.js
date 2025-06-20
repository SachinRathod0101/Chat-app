import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    'process.env': process.env
  },
  server: {
    proxy: {
      '/api': 'http://localhost:5000'
    }
  }
})
