import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['country-state-city']
  },
  build: {
    chunkSizeWarningLimit: 2000,
  },
  server: {
    port: 5173
  }
})
