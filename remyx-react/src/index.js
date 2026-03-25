// Re-export everything from core for convenience.
export * from '@remyxjs/core'

// React component
export { default as RemyxEditor } from './components/RemyxEditor.jsx'

// React hooks
export { useRemyxEditor } from './hooks/useRemyxEditor.js'
export { useEditorEngine } from './hooks/useEditorEngine.js'

// Drag and drop
export { useDragDrop } from './hooks/useDragDrop.js'

// Autosave
export { useAutosave } from './hooks/useAutosave.js'
export { SaveStatus } from './components/SaveStatus/SaveStatus.jsx'
export { RecoveryBanner } from './components/RecoveryBanner/RecoveryBanner.jsx'

// Comments & Annotations
export { useComments } from './hooks/useComments.js'
export { CommentsPanel } from './components/CommentsPanel/CommentsPanel.jsx'

// Spellcheck
export { useSpellcheck } from './hooks/useSpellcheck.js'

// Collaboration
export { useCollaboration } from './hooks/useCollaboration.js'
export { CollaborationBar } from './components/CollaborationBar/CollaborationBar.jsx'

// Error boundary
export { EditorErrorBoundary } from './components/ErrorBoundary.jsx'

// Toast notifications
export { Toast, useToast } from './components/Toast/Toast.jsx'

// UX components
export { EmptyState } from './components/EmptyState/EmptyState.jsx'
export { BreadcrumbBar } from './components/BreadcrumbBar/BreadcrumbBar.jsx'
export { Minimap } from './components/Minimap/Minimap.jsx'
export { SplitPreview } from './components/SplitPreview/SplitPreview.jsx'
export { TypographyDropdown } from './components/TypographyDropdown/TypographyDropdown.jsx'
