/**
 * DragDropPlugin — Enhanced drag-and-drop content management.
 *
 * - Drop zone overlays with visual guides
 * - Drag between multiple Remyx editors
 * - External file/image/rich-text drop support
 * - Drag-to-reorder list items, table rows, block elements
 * - Ghost preview during drag
 *
 * @param {object} [options]
 * @param {Function} [options.onDrop] — (event, data) => void
 * @param {Function} [options.onFileDrop] — (files) => void
 * @param {boolean}  [options.allowExternalDrop=true]
 * @param {boolean}  [options.showDropZone=true]
 * @param {boolean}  [options.enableReorder=true]
 */

import { createPlugin } from '@remyxjs/core'

// ---------------------------------------------------------------------------
// Drop zone overlay
// ---------------------------------------------------------------------------

const DROP_ZONE_CLASS = 'rmx-drop-zone'
const DROP_ZONE_ACTIVE_CLASS = 'rmx-drop-zone-active'
const DROP_INDICATOR_CLASS = 'rmx-drop-indicator'
const DRAGGING_CLASS = 'rmx-dragging'

function createDropIndicator() {
  const indicator = document.createElement('div')
  indicator.className = DROP_INDICATOR_CLASS
  indicator.style.cssText = 'position:absolute;left:0;right:0;height:3px;background:var(--rmx-primary,#6366f1);border-radius:2px;pointer-events:none;z-index:100;transition:top 0.1s ease;'
  return indicator
}

// ---------------------------------------------------------------------------
// Reorder helpers
// ---------------------------------------------------------------------------

/**
 * Get the closest block element to a Y position.
 * @param {HTMLElement} container
 * @param {number} y
 * @returns {{ element: HTMLElement|null, position: 'before'|'after' }}
 */
function getDropTarget(container, y) {
  const children = Array.from(container.children).filter(
    el => !el.classList.contains(DROP_INDICATOR_CLASS) && !el.classList.contains(DROP_ZONE_CLASS)
  )
  let closest = null
  let closestDist = Infinity
  let position = 'after'

  for (const child of children) {
    const rect = child.getBoundingClientRect()
    const midY = rect.top + rect.height / 2

    const dist = Math.abs(y - midY)
    if (dist < closestDist) {
      closestDist = dist
      closest = child
      position = y < midY ? 'before' : 'after'
    }
  }

  return { element: closest, position }
}

/**
 * Get the draggable block ancestor of an element.
 * @param {HTMLElement} el
 * @param {HTMLElement} editorEl
 * @returns {HTMLElement|null}
 */
function getDraggableBlock(el, editorEl) {
  let node = el
  while (node && node !== editorEl && node.parentNode !== editorEl) {
    node = node.parentNode
  }
  return node !== editorEl ? node : null
}

// ---------------------------------------------------------------------------
// Plugin
// ---------------------------------------------------------------------------

export function DragDropPlugin(options = {}) {
  const {
    onDrop,
    onFileDrop,
    allowExternalDrop = true,
    showDropZone = true,
    enableReorder = true,
  } = options

  let engine = null
  let dropIndicator = null
  let draggedBlock = null
  let ghostEl = null
  let ghostCleanupTimer = null

  function handleDragStart(e) {
    if (!engine || !enableReorder) return
    const block = getDraggableBlock(e.target, engine.element)
    if (!block) return

    draggedBlock = block
    block.classList.add(DRAGGING_CLASS)

    // Ghost preview
    ghostEl = block.cloneNode(true)
    ghostEl.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0.6;pointer-events:none;max-width:400px;'
    document.body.appendChild(ghostEl)
    ghostCleanupTimer = setTimeout(() => {
      if (ghostEl && ghostEl.parentNode) {
        ghostEl.parentNode.removeChild(ghostEl)
        ghostEl = null
      }
    }, 5000)
    e.dataTransfer.setDragImage(ghostEl, 20, 20)

    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/x-remyx-block', 'true')
    e.dataTransfer.setData('text/html', block.outerHTML)
  }

  function handleDragOver(e) {
    if (!engine) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'

    if (showDropZone) {
      engine.element.classList.add(DROP_ZONE_ACTIVE_CLASS)
    }

    // Show drop indicator
    if (enableReorder && dropIndicator) {
      const { element, position } = getDropTarget(engine.element, e.clientY)
      if (element) {
        const rect = element.getBoundingClientRect()
        const editorRect = engine.element.getBoundingClientRect()
        const top = position === 'before'
          ? rect.top - editorRect.top - 2
          : rect.bottom - editorRect.top + 1
        dropIndicator.style.top = `${top}px`
        dropIndicator.style.display = 'block'
      }
    }
  }

  function handleDragLeave(e) {
    if (!engine) return
    // Only remove if leaving the editor entirely
    if (!engine.element.contains(e.relatedTarget)) {
      engine.element.classList.remove(DROP_ZONE_ACTIVE_CLASS)
      if (dropIndicator) dropIndicator.style.display = 'none'
    }
  }

  function handleDrop(e) {
    if (!engine) return
    e.preventDefault()
    engine.element.classList.remove(DROP_ZONE_ACTIVE_CLASS)
    if (dropIndicator) dropIndicator.style.display = 'none'

    engine.history.snapshot()

    // Internal block reorder
    if (draggedBlock && engine.element.contains(draggedBlock)) {
      const { element, position } = getDropTarget(engine.element, e.clientY)
      if (element && element !== draggedBlock) {
        if (position === 'before') {
          element.before(draggedBlock)
        } else {
          element.after(draggedBlock)
        }
        engine.eventBus.emit('content:change')
        engine.eventBus.emit('dragdrop:reorder', { block: draggedBlock })
      }
      cleanupDrag()
      onDrop?.(e, { type: 'reorder' })
      return
    }

    // Cross-editor drag (HTML from another Remyx instance)
    const isRemyxBlock = e.dataTransfer.getData('text/x-remyx-block')
    if (isRemyxBlock) {
      const html = e.dataTransfer.getData('text/html')
      if (html) {
        const { element, position } = getDropTarget(engine.element, e.clientY)
        const temp = document.createElement('div')
        temp.innerHTML = html
        const fragment = document.createDocumentFragment()
        while (temp.firstChild) fragment.appendChild(temp.firstChild)

        if (element) {
          if (position === 'before') {
            element.before(fragment)
          } else {
            element.after(fragment)
          }
        } else {
          engine.element.appendChild(fragment)
        }
        engine.eventBus.emit('content:change')
        engine.eventBus.emit('dragdrop:crossEditor', {})
        onDrop?.(e, { type: 'crossEditor', html })
      }
      cleanupDrag()
      return
    }

    // External file drop
    if (allowExternalDrop && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files)
      onFileDrop?.(files)
      engine.eventBus.emit('dragdrop:fileDrop', { files })

      // Auto-insert images
      for (const file of files) {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader()
          reader.onload = () => {
            const img = document.createElement('img')
            img.src = reader.result
            img.style.maxWidth = '100%'
            const { element, position } = getDropTarget(engine.element, e.clientY)
            if (element) {
              if (position === 'before') element.before(img)
              else element.after(img)
            } else {
              engine.element.appendChild(img)
            }
            engine.eventBus.emit('content:change')
          }
          reader.readAsDataURL(file)
        }
      }

      cleanupDrag()
      onDrop?.(e, { type: 'file', files })
      return
    }

    // External rich text / plain text drop
    if (allowExternalDrop) {
      const html = e.dataTransfer.getData('text/html')
      const text = e.dataTransfer.getData('text/plain')
      const content = html || (text ? `<p>${text.replace(/\n/g, '</p><p>')}</p>` : '')

      if (content) {
        const { element, position } = getDropTarget(engine.element, e.clientY)
        const temp = document.createElement('div')
        temp.innerHTML = content
        const fragment = document.createDocumentFragment()
        while (temp.firstChild) fragment.appendChild(temp.firstChild)

        if (element) {
          if (position === 'before') element.before(fragment)
          else element.after(fragment)
        } else {
          engine.element.appendChild(fragment)
        }
        engine.eventBus.emit('content:change')
        engine.eventBus.emit('dragdrop:externalDrop', { html: content })
        onDrop?.(e, { type: 'external', html: content })
      }
    }

    cleanupDrag()
  }

  function handleDragEnd() {
    clearTimeout(ghostCleanupTimer)
    cleanupDrag()
  }

  function cleanupDrag() {
    if (draggedBlock) {
      draggedBlock.classList.remove(DRAGGING_CLASS)
      draggedBlock = null
    }
    if (ghostEl) {
      ghostEl.remove()
      ghostEl = null
    }
    engine?.element?.classList.remove(DROP_ZONE_ACTIVE_CLASS)
    if (dropIndicator) dropIndicator.style.display = 'none'
  }

  // Make blocks draggable on mousedown near left edge
  function handleMouseDown(e) {
    if (!engine || !enableReorder) return
    const block = getDraggableBlock(e.target, engine.element)
    if (!block) return

    // Only enable drag if clicking near the left edge (first 30px)
    const rect = block.getBoundingClientRect()
    if (e.clientX - rect.left < 30) {
      block.draggable = true
      block.addEventListener('dragend', () => { block.draggable = false }, { once: true })
    }
  }

  return createPlugin({
    name: 'dragDrop',
    requiresFullAccess: true,
    version: '1.0.0',
    description: 'Drop zones, cross-editor drag, file drops, block reorder, ghost previews',

    commands: [
      {
        name: 'moveBlockUp',
        execute(eng) {
          const block = eng.selection?.getParentBlock?.()
          if (!block) return
          let topBlock = block
          while (topBlock.parentNode !== eng.element) topBlock = topBlock.parentNode
          const prev = topBlock.previousElementSibling
          if (prev) {
            eng.history.snapshot()
            prev.before(topBlock)
            eng.eventBus.emit('content:change')
          }
        },
        shortcut: 'mod+shift+ArrowUp',
        meta: { icon: 'arrow-up', tooltip: 'Move Block Up' },
      },
      {
        name: 'moveBlockDown',
        execute(eng) {
          const block = eng.selection?.getParentBlock?.()
          if (!block) return
          let topBlock = block
          while (topBlock.parentNode !== eng.element) topBlock = topBlock.parentNode
          const next = topBlock.nextElementSibling
          if (next) {
            eng.history.snapshot()
            next.after(topBlock)
            eng.eventBus.emit('content:change')
          }
        },
        shortcut: 'mod+shift+ArrowDown',
        meta: { icon: 'arrow-down', tooltip: 'Move Block Down' },
      },
    ],

    init(eng) {
      engine = eng

      // Create and attach drop indicator
      if (enableReorder) {
        dropIndicator = createDropIndicator()
        dropIndicator.style.display = 'none'
        engine.element.style.position = 'relative'
        engine.element.appendChild(dropIndicator)
      }

      engine.element.addEventListener('dragstart', handleDragStart)
      engine.element.addEventListener('dragover', handleDragOver)
      engine.element.addEventListener('dragleave', handleDragLeave)
      engine.element.addEventListener('drop', handleDrop)
      engine.element.addEventListener('dragend', handleDragEnd)
      engine.element.addEventListener('mousedown', handleMouseDown)

      if (showDropZone) {
        engine.element.classList.add(DROP_ZONE_CLASS)
      }

      engine._dragDrop = {
        getDropTarget: (y) => getDropTarget(engine.element, y),
      }
    },

    destroy() {
      engine?.element?.removeEventListener('dragstart', handleDragStart)
      engine?.element?.removeEventListener('dragover', handleDragOver)
      engine?.element?.removeEventListener('dragleave', handleDragLeave)
      engine?.element?.removeEventListener('drop', handleDrop)
      engine?.element?.removeEventListener('dragend', handleDragEnd)
      engine?.element?.removeEventListener('mousedown', handleMouseDown)

      dropIndicator?.remove()
      cleanupDrag()
      engine?.element?.classList.remove(DROP_ZONE_CLASS, DROP_ZONE_ACTIVE_CLASS)
      engine = null
    },
  })
}
