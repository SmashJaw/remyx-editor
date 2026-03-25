/**
 * Image commands for the editor.
 *
 * **Privacy notice:** Images inserted via external URL (`http://`, `https://`) will
 * make GET requests when rendered in the editor, revealing the viewer's IP address
 * and user-agent to the image host. This can be exploited as a tracking pixel.
 * For privacy-sensitive deployments, use an upload handler (`options.uploadHandler`)
 * to proxy images through your own server, or restrict to data URIs only.
 */
export function registerImageCommands(engine) {
  engine.commands.register('insertImage', {
    execute(eng, { src, alt = '', width, height }) {
      if (!src) return

      // Block SVG data URIs — can contain executable JavaScript
      if (/^data:image\/svg/i.test(src)) return

      // Block external SVG URLs — SVGs loaded via <img src> can still
      // exploit CSS-based attacks; only raster formats are safe over URL
      try {
        const url = new URL(src, window.location.href)
        if (url.pathname.toLowerCase().endsWith('.svg')) return
      } catch {
        // relative URLs that fail parsing are checked via extension
        if (/\.svg(\?|#|$)/i.test(src)) return
      }

      // Ensure editor has focus (e.g. when called from a modal)
      eng.element.focus()

      // If no selection range exists, place cursor at the end
      if (!eng.selection.getRange()) {
        const range = document.createRange()
        range.selectNodeContents(eng.element)
        range.collapse(false)
        eng.selection.setRange(range)
      }

      const img = document.createElement('img')
      img.src = src
      img.alt = alt
      if (width) img.style.width = typeof width === 'number' ? `${width}px` : width
      if (height) img.style.height = typeof height === 'number' ? `${height}px` : height
      img.style.maxWidth = '100%'
      img.className = 'rmx-image'

      eng.selection.insertNode(img)

      // Add a paragraph after the image if it's the last element
      if (!img.nextSibling || img.parentElement === eng.element) {
        const p = document.createElement('p')
        p.innerHTML = '<br>'
        img.parentElement.insertBefore(p, img.nextSibling)
      }
    },
    meta: { icon: 'image', tooltip: 'Insert Image' },
  })

  engine.commands.register('resizeImage', {
    execute(eng, { element, width, height }) {
      if (!element || element.tagName !== 'IMG') return
      element.style.width = typeof width === 'number' ? `${width}px` : width
      if (height) {
        element.style.height = typeof height === 'number' ? `${height}px` : height
      } else {
        element.style.height = 'auto'
      }
    },
    meta: { tooltip: 'Resize Image' },
  })

  engine.commands.register('alignImage', {
    execute(eng, { element, alignment }) {
      if (!element || element.tagName !== 'IMG') return
      element.style.float = ''
      element.style.margin = ''
      element.style.display = ''

      switch (alignment) {
        case 'left':
          element.style.float = 'left'
          element.style.margin = '0 16px 16px 0'
          break
        case 'right':
          element.style.float = 'right'
          element.style.margin = '0 0 16px 16px'
          break
        case 'center':
          element.style.display = 'block'
          element.style.margin = '16px auto'
          break
        default:
          break
      }
    },
    meta: { tooltip: 'Align Image' },
  })

  engine.commands.register('removeImage', {
    execute(eng, { element }) {
      if (!element || element.tagName !== 'IMG') return
      element.parentNode.removeChild(element)
    },
    meta: { tooltip: 'Remove Image' },
  })
}
