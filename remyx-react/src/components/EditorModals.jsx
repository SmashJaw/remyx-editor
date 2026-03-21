import React, { Suspense } from 'react'

/**
 * Item 22: Extracted from RemyxEditor.jsx — handles all lazy-loaded modal rendering.
 * Reduces RemyxEditor component size by consolidating modal Suspense boundaries.
 */

// Lazy-loaded modal components — only loaded when opened
const CommandPalette = React.lazy(() => import('./CommandPalette/CommandPalette.jsx').then(m => ({ default: m.CommandPalette })))
const LinkModal = React.lazy(() => import('./Modals/LinkModal.jsx').then(m => ({ default: m.LinkModal })))
const ImageModal = React.lazy(() => import('./Modals/ImageModal.jsx').then(m => ({ default: m.ImageModal })))
const TablePickerModal = React.lazy(() => import('./Modals/TablePickerModal.jsx').then(m => ({ default: m.TablePickerModal })))
const EmbedModal = React.lazy(() => import('./Modals/EmbedModal.jsx').then(m => ({ default: m.EmbedModal })))
const FindReplacePanel = React.lazy(() => import('./Modals/FindReplaceModal.jsx').then(m => ({ default: m.FindReplacePanel })))
const SourceModal = React.lazy(() => import('./Modals/SourceModal.jsx').then(m => ({ default: m.SourceModal })))
const ExportModal = React.lazy(() => import('./Modals/ExportModal.jsx').then(m => ({ default: m.ExportModal })))
const AttachmentModal = React.lazy(() => import('./Modals/AttachmentModal.jsx').then(m => ({ default: m.AttachmentModal })))
const ImportDocumentModal = React.lazy(() => import('./Modals/ImportDocumentModal.jsx').then(m => ({ default: m.ImportDocumentModal })))

/**
 * @param {object} props
 * @param {object} props.modals - Modal state from useModal
 * @param {Function} props.closeModal - Close a modal by name
 * @param {object} props.engine - Editor engine instance
 * @param {boolean} props.showCommandPalette - Whether command palette is enabled
 * @param {boolean} props.commandPaletteOpen - Whether command palette is currently open
 * @param {Function} props.setCommandPaletteOpen - Toggle command palette
 * @param {Function} props.handleOpenModal - Open modal handler
 */
export function EditorModals({
  modals,
  closeModal,
  engine,
  showCommandPalette,
  commandPaletteOpen,
  setCommandPaletteOpen,
  handleOpenModal,
}) {
  return (
    <Suspense fallback={<div className="rmx-loading-spinner" />}>
      {modals.link.open && (
        <LinkModal
          open={modals.link.open}
          onClose={() => closeModal('link')}
          engine={engine}
          data={modals.link.data}
        />
      )}
      {modals.image.open && (
        <ImageModal
          open={modals.image.open}
          onClose={() => closeModal('image')}
          engine={engine}
          data={modals.image.data}
        />
      )}
      {modals.attachment?.open && (
        <AttachmentModal
          open={modals.attachment.open}
          onClose={() => closeModal('attachment')}
          engine={engine}
          data={modals.attachment.data}
        />
      )}
      {modals.importDocument?.open && (
        <ImportDocumentModal
          open={modals.importDocument.open}
          onClose={() => closeModal('importDocument')}
          engine={engine}
          data={modals.importDocument.data}
        />
      )}
      {modals.table.open && (
        <TablePickerModal
          open={modals.table.open}
          onClose={() => closeModal('table')}
          engine={engine}
          data={modals.table.data}
        />
      )}
      {modals.embed.open && (
        <EmbedModal
          open={modals.embed.open}
          onClose={() => closeModal('embed')}
          engine={engine}
          data={modals.embed.data}
        />
      )}
      {modals.source.open && (
        <SourceModal
          open={modals.source.open}
          onClose={() => {
            closeModal('source')
            if (engine?.isSourceMode) {
              engine.isSourceMode = false
              engine.eventBus.emit('mode:change', { sourceMode: false })
            }
          }}
          engine={engine}
        />
      )}
      {modals.export.open && (
        <ExportModal
          open={modals.export.open}
          onClose={() => closeModal('export')}
          engine={engine}
        />
      )}
      {showCommandPalette && commandPaletteOpen && (
        <CommandPalette
          open={commandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
          engine={engine}
          onOpenModal={handleOpenModal}
        />
      )}
    </Suspense>
  )
}

export { FindReplacePanel }
