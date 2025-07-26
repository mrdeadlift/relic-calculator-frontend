import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],

  // Path resolution
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@composables': resolve(__dirname, 'src/composables'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@stores': resolve(__dirname, 'src/stores'),
      '@types': resolve(__dirname, 'src/types'),
    },
  },

  // Build optimizations
  build: {
    // Bundle splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk
          vendor: ['vue', 'vue-router', 'pinia'],
          // UI components
          ui: ['@headlessui/vue'],
          // Utils
          utils: ['lodash-es', 'date-fns'],
        },
      },
    },
    // Smaller chunk size limit
    chunkSizeWarningLimit: 600,
    // Enable minification
    minify: 'terser',
    // Generate source maps for production debugging
    sourcemap: true,
  },

  // Development server optimizations
  server: {
    // Enable HTTP/2
    https: false,
    // Hot reload optimization
    hmr: {
      overlay: false,
    },
    // Cors configuration
    cors: true,
  },

  // Dependency optimization
  optimizeDeps: {
    include: ['vue', 'vue-router', 'pinia', 'lodash-es', 'date-fns'],
  },

  // CSS optimization
  css: {
    devSourcemap: true,
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/assets/styles/_variables.scss";`,
      },
    },
  },

  // Performance settings
  define: {
    __VUE_OPTIONS_API__: false,
    __VUE_PROD_DEVTOOLS__: false,
  },
})
