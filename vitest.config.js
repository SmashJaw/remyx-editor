import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: [
      'remyx-core/src/**/__tests__/**/*.test.{js,jsx}',
      'remyx-react/src/**/__tests__/**/*.test.{js,jsx}',
    ],
    setupFiles: ['./vitest.setup.js'],
    coverage: {
      provider: 'v8',
      reportsDirectory: '../coverage/unit',
      reporter: ['html', 'text-summary', 'lcov'],
      include: [
        'remyx-core/src/**/*.{js,jsx}',
        'remyx-react/src/**/*.{js,jsx}',
      ],
      exclude: [
        '**/src/**/__tests__/**',
        '**/src/index.js',
      ],
    },
  },
  resolve: {
    alias: {
      '@remyxjs/core': path.resolve(__dirname, 'remyx-core/src'),
      'react': path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
    },
  },
})
