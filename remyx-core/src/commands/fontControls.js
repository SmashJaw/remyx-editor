/**
 * Font formatting commands.
 *
 * **Deprecation notice:** Several commands in this module use `document.execCommand()`,
 * which is deprecated by the W3C and may be removed from browsers in the future.
 * Affected commands: `fontFamily` (execCommand 'fontName'), `foreColor`, `backColor`
 * (execCommand 'hiliteColor'/'backColor').
 *
 * Migration path: Replace with Selection/Range-based span wrapping (similar to
 * the `fontSize` command which already uses this approach). The Clipboard API
 * should replace execCommand('cut'/'copy') in useContextMenu.js.
 *
 * Current browser support for execCommand remains broad (as of 2026), so this is
 * not an urgent issue, but should be addressed in a future major version.
 */
export function registerFontCommands(engine) {
  engine.commands.register('fontFamily', {
    execute(eng, family) {
      if (!family) return
      document.execCommand('fontName', false, family)
    },
    isActive(eng) {
      try {
        const val = document.queryCommandValue('fontName')
        return val || false
      } catch {
        return false
      }
    },
    meta: { icon: 'fontFamily', tooltip: 'Font Family' },
  })

  engine.commands.register('fontSize', {
    execute(eng, size) {
      if (!size) return
      // execCommand fontSize uses 1-7 scale, so we use spans instead
      const sel = eng.selection.getSelection()
      if (!sel || sel.rangeCount === 0) return
      const range = sel.getRangeAt(0)

      if (range.collapsed) return

      // Check if already wrapped in a font-size span
      const parent = eng.selection.getParentElement()
      if (parent && parent.tagName === 'SPAN' && parent.style.fontSize) {
        parent.style.fontSize = size
        return
      }

      const span = document.createElement('span')
      span.style.fontSize = size

      try {
        range.surroundContents(span)
      } catch {
        const fragment = range.extractContents()
        span.appendChild(fragment)
        range.insertNode(span)
      }
    },
    meta: { icon: 'fontSize', tooltip: 'Font Size' },
  })

  engine.commands.register('foreColor', {
    execute(eng, color) {
      if (!color) return
      document.execCommand('foreColor', false, color)
    },
    isActive(eng) {
      try {
        return document.queryCommandValue('foreColor') || false
      } catch {
        return false
      }
    },
    meta: { icon: 'foreColor', tooltip: 'Text Color' },
  })

  engine.commands.register('backColor', {
    execute(eng, color) {
      if (!color) return
      // hiliteColor works on most browsers, backColor on IE
      try {
        document.execCommand('hiliteColor', false, color)
      } catch {
        document.execCommand('backColor', false, color)
      }
    },
    isActive(eng) {
      try {
        return document.queryCommandValue('backColor') || false
      } catch {
        return false
      }
    },
    meta: { icon: 'backColor', tooltip: 'Background Color' },
  })
}
