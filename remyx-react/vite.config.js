import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig(async () => {
  const plugins = [react()]
  if (process.env.ANALYZE) {
    const { visualizer } = await import('rollup-plugin-visualizer')
    plugins.push(visualizer({ open: true, filename: 'stats.html' }))
  }

  return {
    plugins,
    build: {
      lib: {
        entry: resolve(import.meta.dirname, 'src/index.js'),
        name: 'RemyxReact',
        formats: ['es', 'cjs'],
        fileName: 'remyx-react',
      },
      rollupOptions: {
        external: ['react', 'react-dom', 'react/jsx-runtime', '@remyxjs/core'],
      },
      sourcemap: true,
      minify: 'terser',
      terserOptions: {
        compress: { drop_console: true, drop_debugger: true },
      },
    },
  }
})
