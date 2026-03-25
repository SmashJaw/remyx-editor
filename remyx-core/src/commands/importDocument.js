export function registerImportDocumentCommands(engine) {
  engine.commands.register('importDocument', {
    execute(eng, { html, mode = 'insert' }) {
      if (!html) return

      eng.element.focus()

      if (mode === 'replace') {
        eng.setHTML(html)
      } else {
        // Insert at cursor
        if (!eng.selection.getRange()) {
          const range = document.createRange()
          range.selectNodeContents(eng.element)
          range.collapse(false)
          eng.selection.setRange(range)
        }
        eng.selection.insertHTML(eng.sanitizer.sanitize(html))
      }

      eng.eventBus.emit('content:change')
    },
    meta: { icon: 'importDocument', tooltip: 'Import Document' },
  })
}
