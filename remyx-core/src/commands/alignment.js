/**
 * CSP-compatible text alignment commands using direct style manipulation.
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
      const align = block.style.textAlign || window.getComputedStyle(block).textAlign
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
      const align = block.style.textAlign || window.getComputedStyle(block).textAlign
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
      const align = block.style.textAlign || window.getComputedStyle(block).textAlign
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
      const align = block.style.textAlign || window.getComputedStyle(block).textAlign
      return align === 'justify'
    },
    meta: { icon: 'alignJustify', tooltip: 'Justify' },
  })
}
