import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    host: true, // Allow external access
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/rest': {
        target: 'https://ywvqvldqlowloxrpldss.supabase.co',
        changeOrigin: true,
        secure: false,
      },
      '/auth': {
        target: 'https://ywvqvldqlowloxrpldss.supabase.co',
        changeOrigin: true,
        secure: false,
      },
      '/supabase': {
        target: 'https://ywvqvldqlowloxrpldss.supabase.co',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/supabase/, '')
      },
      '/groq': {
        target: 'https://api.groq.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/groq/, '')
      }
    }
  }
})