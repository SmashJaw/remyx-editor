import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'RemyxCore',
      formats: ['es', 'cjs'],
      fileName: (format) => `remyx-core.${format === 'es' ? 'js' : 'cjs'}`,
      cssFileName: 'style',
    },
    rollupOptions: {
      external: ['mammoth', 'pdfjs-dist', /pdfjs-dist\/.*/],
    },
    cssCodeSplit: false,
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
})
