// Re-export everything from core for convenience
export * from '@remyx/core'

// React component
export { default as RemyxEditor } from './components/RemyxEditor.jsx'

// React hooks
export { useRemyxEditor } from './hooks/useRemyxEditor.js'
export { useEditorEngine } from './hooks/useEditorEngine.js'

// React config provider
export { RemyxConfigProvider, useRemyxConfig } from './config/RemyxConfigProvider.jsx'

// Error boundary
export { EditorErrorBoundary } from './components/ErrorBoundary.jsx'
