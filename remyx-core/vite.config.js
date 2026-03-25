import { defineConfig } from 'vite'
import { resolve } from 'path'
import { copyFileSync, mkdirSync, readdirSync } from 'fs'

/** Copy individual theme CSS files to dist/themes/ for granular imports */
function copyThemeFiles() {
  return {
    name: 'copy-theme-files',
    closeBundle() {
      const themesDir = resolve(import.meta.dirname, 'src/themes')
      const outDir = resolve(import.meta.dirname, 'dist/themes')
      mkdirSync(outDir, { recursive: true })
      for (const file of readdirSync(themesDir)) {
        if (file.endsWith('.css')) {
          copyFileSync(resolve(themesDir, file), resolve(outDir, file))
        }
      }
    },
  }
}

export default defineConfig(async () => {
  const plugins = [copyThemeFiles()]
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
