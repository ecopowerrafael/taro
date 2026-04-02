import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    build: {
      chunkSizeWarningLimit: 700,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) {
              return undefined
            }

            if (id.includes('@daily-co/daily-js')) {
              return 'daily'
            }

            if (id.includes('react-router-dom')) {
              return 'router'
            }

            if (id.includes('react-dom') || id.includes('/react/')) {
              return 'react-vendor'
            }

            if (id.includes('framer-motion')) {
              return 'motion'
            }

            if (id.includes('@stripe') || id.includes('stripe')) {
              return 'stripe'
            }

            if (id.includes('socket.io-client')) {
              return 'socket'
            }

            return 'vendor'
          },
        },
      },
    },
    define: {
      'process.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL || ''),
      'process.env': {} // Fallback para evitar erro de ReferenceError: process is not defined
    }
  }
})
