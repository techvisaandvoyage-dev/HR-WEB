import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['country-state-city']
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/pdf-lib') || id.includes('node_modules/pdfjs-dist')) {
            return 'pdf-tools';
          }
          if (id.includes('node_modules/browser-image-compression')) {
            return 'image-compression';
          }
          if (id.includes('node_modules/jszip')) {
            return 'doc-compression';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1500,
  },
  server: {
    port: 5173
  }
})
