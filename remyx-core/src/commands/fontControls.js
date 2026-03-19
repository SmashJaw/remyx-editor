/**
 * CSP-compatible font formatting commands.
 *
 * All commands use Selection/Range-based span wrapping instead of the
 * deprecated `document.execCommand()` API. This eliminates CSP violations
 * and ensures forward compatibility with browsers removing execCommand.
 */

/**
 * Wraps the current selection in a span with the given style property/value.
 * If already wrapped in a span with that property, updates the value.
 */
function wrapWithStyle(engine, property, value) {
  if (!value) return
  const sel = engine.selection.getSelection()
  if (!sel || sel.rangeCount === 0) return
  const range = sel.getRangeAt(0)
  if (range.collapsed) return

  // Check if already wrapped in a styled span
  const parent = engine.selection.getParentElement()
  if (parent && parent.tagName === 'SPAN' && parent.style[property]) {
    parent.style[property] = value
    return
  }

  const span = document.createElement('span')
  span.style[property] = value

  try {
    range.surroundContents(span)
  } catch {
    const fragment = range.extractContents()
    span.appendChild(fragment)
    range.insertNode(span)
  }
}

/**
 * Get the computed style value for a CSS property from the current selection.
 */
function getSelectionStyle(engine, property) {
  const parent = engine.selection.getParentElement()
  if (!parent) return false
  try {
    return window.getComputedStyle(parent)[property] || false
  } catch {
    return false
  }
}

export function registerFontCommands(engine) {
  engine.commands.register('fontFamily', {
    execute(eng, family) {
      wrapWithStyle(eng, 'fontFamily', family)
    },
    isActive(eng) {
      return getSelectionStyle(eng, 'fontFamily')
    },
    meta: { icon: 'fontFamily', tooltip: 'Font Family' },
  })

  engine.commands.register('fontSize', {
    execute(eng, size) {
      if (!size) return
      // Validate numeric value
      if (!/^\d+(\.\d+)?(px|pt|em|rem|%)$/.test(size)) return
      wrapWithStyle(eng, 'fontSize', size)
    },
    meta: { icon: 'fontSize', tooltip: 'Font Size' },
  })

  engine.commands.register('foreColor', {
    execute(eng, color) {
      wrapWithStyle(eng, 'color', color)
    },
    isActive(eng) {
      return getSelectionStyle(eng, 'color')
    },
    meta: { icon: 'foreColor', tooltip: 'Text Color' },
  })

  engine.commands.register('backColor', {
    execute(eng, color) {
      wrapWithStyle(eng, 'backgroundColor', color)
    },
    isActive(eng) {
      return getSelectionStyle(eng, 'backgroundColor')
    },
    meta: { icon: 'backColor', tooltip: 'Background Color' },
  })
}
