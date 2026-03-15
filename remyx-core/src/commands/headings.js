/**
 * Compute the effective heading tag, applying a baseHeadingLevel offset.
 * If baseHeadingLevel is 2, then logical H1 renders as <h2>, H2 as <h3>, etc.
 * Levels are clamped to 1-6.
 */
function getEffectiveLevel(logicalLevel, baseHeadingLevel) {
  if (!baseHeadingLevel || baseHeadingLevel <= 1) return logicalLevel
  const offset = baseHeadingLevel - 1
  return Math.min(logicalLevel + offset, 6)
}

export function registerHeadingCommands(engine) {
  const baseLevel = engine.options.baseHeadingLevel || 1

  engine.commands.register('heading', {
    execute(eng, level) {
      if (level === 'p') {
        document.execCommand('formatBlock', false, '<p>')
      } else {
        const effective = getEffectiveLevel(Number(level), baseLevel)
        document.execCommand('formatBlock', false, `<h${effective}>`)
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
      execute() { document.execCommand('formatBlock', false, `<h${effectiveLevel}>`) },
      isActive(eng) {
        const block = eng.selection.getParentBlock()
        return block && block.tagName === `H${effectiveLevel}`
      },
      meta: { tooltip: `Heading ${i}` },
    })
  }

  engine.commands.register('paragraph', {
    execute() { document.execCommand('formatBlock', false, '<p>') },
    isActive(eng) {
      const block = eng.selection.getParentBlock()
      return block && block.tagName === 'P'
    },
    meta: { tooltip: 'Normal text' },
  })
}
