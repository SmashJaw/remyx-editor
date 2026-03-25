import { escapeHTMLAttr as escapeHTML } from '../utils/escapeHTML.js'

const DANGEROUS_PROTOCOL = /^\s*(javascript|vbscript|data\s*:\s*text\/html)\s*:/i

function validateUrl(url) {
  if (!url) return url
  if (DANGEROUS_PROTOCOL.test(url)) return '#'
  return url
}

export function registerLinkCommands(engine) {
  engine.commands.register('insertLink', {
    execute(eng, { href, text, target = '_blank' }) {
      if (!href) return

      const selection = eng.selection
      const selectedText = selection.getSelectedText()

      if (selectedText) {
        const link = selection.wrapWith('a', {
          href,
          target,
          rel: target === '_blank' ? 'noopener noreferrer' : undefined,
        })
        if (link && text && text !== selectedText) {
          link.textContent = text
        }
      } else {
        const displayText = text || href
        const safeHref = validateUrl(href)
        const html = `<a href="${escapeAttr(safeHref)}" target="${escapeAttr(target)}"${target === '_blank' ? ' rel="noopener noreferrer"' : ''}>${escapeHTML(displayText)}</a>`
        selection.insertHTML(html)
      }
    },
    shortcut: 'mod+k',
    meta: { icon: 'link', tooltip: 'Insert Link' },
  })

  engine.commands.register('editLink', {
    execute(eng, { href, text, target }) {
      const linkEl = eng.selection.getClosestElement('a')
      if (!linkEl) return
      if (href !== undefined) linkEl.href = validateUrl(href)
      if (text !== undefined) linkEl.textContent = text
      if (target !== undefined) {
        linkEl.target = target
        if (target === '_blank') {
          linkEl.rel = 'noopener noreferrer'
        } else {
          linkEl.removeAttribute('rel')
        }
      }
    },
    meta: { tooltip: 'Edit Link' },
  })

  engine.commands.register('removeLink', {
    execute(eng) {
      eng.selection.unwrap('a')
    },
    meta: { icon: 'unlink', tooltip: 'Remove Link' },
  })
}

// Task 261: escapeHTML imported from shared utils/escapeHTML.js

function escapeAttr(str) {
  return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}
