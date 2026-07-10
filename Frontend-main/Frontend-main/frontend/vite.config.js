import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    proxy: {
      '/utility': 'http://localhost:8000',
      '/guest': 'http://localhost:8000',
      '/v1': 'http://localhost:8000',
    }
  }
})
