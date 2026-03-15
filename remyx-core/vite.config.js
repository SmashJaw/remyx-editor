import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig(async () => {
  const plugins = []
  if (process.env.ANALYZE) {
    const { visualizer } = await import('rollup-plugin-visualizer')
    plugins.push(visualizer({ open: true, filename: 'stats.html' }))
  }

  return {
    build: {
      lib: {
        entry: resolve(import.meta.dirname, 'src/index.js'),
        name: 'RemyxCore',
        formats: ['es', 'cjs'],
        fileName: 'remyx-core',
      },
      rollupOptions: {
        external: ['marked', 'turndown', 'turndown-plugin-gfm', 'mammoth', 'pdfjs-dist', /pdfjs-dist\/.*/],
      },
      sourcemap: true,
      minify: 'terser',
      terserOptions: {
        compress: { drop_console: true, drop_debugger: true },
      },
    },
    plugins,
  }
})
