/**
 * CSP-compatible heading commands using Range-based DOM manipulation.
 *
 * Compute the effective heading tag, applying a baseHeadingLevel offset.
 * If baseHeadingLevel is 2, then logical H1 renders as <h2>, H2 as <h3>, etc.
 * Levels are clamped to 1-6.
 */
function getEffectiveLevel(logicalLevel, baseHeadingLevel) {
  if (!baseHeadingLevel || baseHeadingLevel <= 1) return logicalLevel
  const offset = baseHeadingLevel - 1
  return Math.min(logicalLevel + offset, 6)
}

/**
 * Convert the current block element to a different block tag (e.g., <p> → <h2>).
 */
function convertBlock(engine, newTag) {
  const block = engine.selection.getParentBlock()
  if (!block) return

  // If already this tag, do nothing
  if (block.tagName === newTag.toUpperCase()) return

  const newEl = document.createElement(newTag)
  // Copy over children
  while (block.firstChild) {
    newEl.appendChild(block.firstChild)
  }
  // Copy class attribute if present
  if (block.className) newEl.className = block.className

  block.parentNode.replaceChild(newEl, block)

  // Restore cursor inside the new element
  const range = document.createRange()
  range.selectNodeContents(newEl)
  range.collapse(false)
  engine.selection.setRange(range)
}

export function registerHeadingCommands(engine) {
  const baseLevel = engine.options.baseHeadingLevel || 1

  engine.commands.register('heading', {
    execute(eng, level) {
      if (level === 'p') {
        convertBlock(eng, 'p')
      } else {
        const effective = getEffectiveLevel(Number(level), baseLevel)
        convertBlock(eng, `h${effective}`)
      }
    },
    isActive(eng) {
      const block = eng.selection.getParentBlock()
      if (!block) return false
      return /^H[1-6]$/.test(block.tagName) ? block.tagName.toLowerCase() : false
    },
    meta: { icon: 'heading', tooltip: 'Heading' },
  })

  // Individual heading commands for convenience
  for (let i = 1; i <= 6; i++) {
    const effectiveLevel = getEffectiveLevel(i, baseLevel)
    engine.commands.register(`h${i}`, {
      execute(eng) { convertBlock(eng, `h${effectiveLevel}`) },
      isActive(eng) {
        const block = eng.selection.getParentBlock()
        return block && block.tagName === `H${effectiveLevel}`
      },
      meta: { tooltip: `Heading ${i}` },
    })
  }

  engine.commands.register('paragraph', {
    execute(eng) { convertBlock(eng, 'p') },
    isActive(eng) {
      const block = eng.selection.getParentBlock()
      return block && block.tagName === 'P'
    },
    meta: { tooltip: 'Normal text' },
  })
}
