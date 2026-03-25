const DANGEROUS_PROTOCOL = /^\s*(javascript|vbscript|data\s*:\s*text\/html)\s*:/i

/**
 * Format bytes into a human-readable file size string.
 */
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return ''
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  return `${size % 1 === 0 ? size : size.toFixed(1)} ${units[unitIndex]}`
}

export function registerAttachmentCommands(engine) {
  engine.commands.register('insertAttachment', {
    execute(eng, { url, filename = 'file', filesize }) {
      if (!url) return

      // Ensure editor has focus (e.g. when called from a modal)
      eng.element.focus()

      // If no selection range exists, place cursor at the end
      if (!eng.selection.getRange()) {
        const range = document.createRange()
        range.selectNodeContents(eng.element)
        range.collapse(false)
        eng.selection.setRange(range)
      }

      const a = document.createElement('a')
      a.href = DANGEROUS_PROTOCOL.test(url) ? '#' : url
      a.className = 'rmx-attachment'
      a.setAttribute('data-attachment', 'true')
      a.setAttribute('data-filename', filename)
      if (filesize) a.setAttribute('data-filesize', String(filesize))
      a.target = '_blank'
      a.rel = 'noopener noreferrer'

      const sizeLabel = filesize ? ` (${formatFileSize(filesize)})` : ''
      a.textContent = `\u{1F4CE} ${filename}${sizeLabel}`

      eng.selection.insertNode(a)

      // Add a paragraph after the attachment if it's the last element
      if (!a.nextSibling && a.parentElement === eng.element) {
        const p = document.createElement('p')
        p.innerHTML = '<br>'
        a.parentElement.insertBefore(p, a.nextSibling)
      }
    },
    meta: { icon: 'attachment', tooltip: 'Insert Attachment' },
  })

  engine.commands.register('removeAttachment', {
    execute(eng, { element }) {
      if (!element || !element.classList?.contains('rmx-attachment')) return
      element.parentNode.removeChild(element)
    },
    meta: { tooltip: 'Remove Attachment' },
  })
}
