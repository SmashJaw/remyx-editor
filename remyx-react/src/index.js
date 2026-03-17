// Re-export everything from core for convenience
export * from '@remyxjs/core'

// React component
export { default as RemyxEditor } from './components/RemyxEditor.jsx'

// React hooks
export { useRemyxEditor } from './hooks/useRemyxEditor.js'
export { useEditorEngine } from './hooks/useEditorEngine.js'

// React config provider
export { RemyxConfigProvider } from './config/RemyxConfigProvider.jsx'
export { useRemyxConfig } from './hooks/useRemyxConfig.js'

// Drag and drop
export { useDragDrop } from './hooks/useDragDrop.js'

// Autosave
export { useAutosave } from './hooks/useAutosave.js'
export { SaveStatus } from './components/SaveStatus/SaveStatus.jsx'
export { RecoveryBanner } from './components/RecoveryBanner/RecoveryBanner.jsx'

// Error boundary
export { EditorErrorBoundary } from './components/ErrorBoundary.jsx'

