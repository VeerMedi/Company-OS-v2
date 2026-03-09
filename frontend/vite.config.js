// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// export default defineConfig({
//   plugins: [react()],
//   server: {
//     port: 3000,
//     proxy: {
//       '/api': {
//         target: 'http://localhost:5001',
//         changeOrigin: true,
//       }
//     }
//   },
//   build: {
//     outDir: 'dist',
//     sourcemap: true
//   }
// })

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react()
  ],

  server: {
    host: 'localhost',
    port: 3000,

    proxy: {
      // Uploads proxy (port 5001) - for profile photos and documents
      '/uploads': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
        secure: false
      },
      // Specific route for Node.js Analytics (port 5001)
      '/api/analytics/voice': {
        target: 'http://127.0.0.1:5005',
        changeOrigin: true,
      },
      // RAG Analytics API (port 5002)
      '/api/analytics': {
        target: 'http://127.0.0.1:5002',
        changeOrigin: true,
      },
      // General API proxy (port 5001)
      '/api': {
        target: 'http://127.0.0.1:5001', // Use 127.0.0.1 to avoid IPv6 issues
        changeOrigin: true,
        secure: false                    // 🔑 HTTPS frontend → HTTP backend allow
      }
    }
  },

  build: {
    outDir: 'dist',
    sourcemap: true
  }
})