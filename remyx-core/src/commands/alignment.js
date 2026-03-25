/**
 * CSP-compatible text alignment commands using direct style manipulation.
 * Task 255: isActive() reads block.style.textAlign only (no getComputedStyle).
 */
export function registerAlignmentCommands(engine) {
  engine.commands.register('alignLeft', {
    execute(eng) {
      const block = eng.selection.getParentBlock()
      if (block) block.style.textAlign = 'left'
    },
    isActive(eng) {
      const block = eng.selection.getParentBlock()
      if (!block) return false
      const align = block.style.textAlign
      return !align || align === 'left' || align === 'start'
    },
    meta: { icon: 'alignLeft', tooltip: 'Align Left' },
  })

  engine.commands.register('alignCenter', {
    execute(eng) {
      const block = eng.selection.getParentBlock()
      if (block) block.style.textAlign = 'center'
    },
    isActive(eng) {
      const block = eng.selection.getParentBlock()
      if (!block) return false
      const align = block.style.textAlign
      return align === 'center'
    },
    meta: { icon: 'alignCenter', tooltip: 'Align Center' },
  })

  engine.commands.register('alignRight', {
    execute(eng) {
      const block = eng.selection.getParentBlock()
      if (block) block.style.textAlign = 'right'
    },
    isActive(eng) {
      const block = eng.selection.getParentBlock()
      if (!block) return false
      const align = block.style.textAlign
      return align === 'right' || align === 'end'
    },
    meta: { icon: 'alignRight', tooltip: 'Align Right' },
  })

  engine.commands.register('alignJustify', {
    execute(eng) {
      const block = eng.selection.getParentBlock()
      if (block) block.style.textAlign = 'justify'
    },
    isActive(eng) {
      const block = eng.selection.getParentBlock()
      if (!block) return false
      const align = block.style.textAlign
      return align === 'justify'
    },
    meta: { icon: 'alignJustify', tooltip: 'Justify' },
  })
}
