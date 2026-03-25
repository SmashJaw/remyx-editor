import { escapeHTMLAttr } from '@remyxjs/core'

/**
 * LinkPlugin — Advanced link management.
 *
 * - Link previews: hover tooltip with title, description, thumbnail (via onUnfurl callback)
 * - Broken link detection: periodic scan with visual indicators
 * - Auto-link: detect and convert raw URLs, emails, phone numbers on typing
 * - Link analytics: onLinkClick callback with metadata
 * - Internal link suggestions: onSuggest callback for document search
 * - Bookmark anchors: named anchors and intra-document linking
 *
 * @param {object} [options]
 * @param {Function} [options.onLinkClick] — (metadata) => void, called on every link click
 * @param {Function} [options.onUnfurl]    — (url) => Promise<{ title, description, image }>, for link previews
 * @param {Function} [options.onSuggest]   — (query) => Promise<Array<{ title, url }>>, for internal link search
 * @param {Function} [options.onBrokenLink] — (url, element) => void, called when a broken link is detected
 * @param {Function} [options.validateLink] — (url) => Promise<boolean>, check if a link is alive
 * @param {number}   [options.scanInterval=60000] — ms between broken link scans (0 = disabled)
 * @param {boolean}  [options.autoLink=true]  — auto-convert typed URLs/emails/phones to links
 * @param {boolean}  [options.showPreviews=true] — show hover previews on links
 */

import { createPlugin } from '@remyxjs/core'

// ---------------------------------------------------------------------------
// URL / email / phone detection patterns
// ---------------------------------------------------------------------------

/** Match URLs starting with http(s):// or www. */
const URL_REGEX = /(?:https?:\/\/|www\.)[^\s<>"']+/gi

/** Match email addresses */
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g

/** Match phone numbers (common formats) */
const PHONE_REGEX = /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g

/**
 * Find raw URLs, emails, and phone numbers in a text node.
 * @param {string} text
 * @returns {Array<{ type: 'url'|'email'|'phone', value: string, index: number }>}
 */
export function detectLinks(text) {
  const results = []
  let match

  URL_REGEX.lastIndex = 0
  while ((match = URL_REGEX.exec(text)) !== null) {
    results.push({ type: 'url', value: match[0], index: match.index })
  }

  EMAIL_REGEX.lastIndex = 0
  while ((match = EMAIL_REGEX.exec(text)) !== null) {
    // Skip if already inside a URL match
    const emailStart = match.index
    if (!results.some(r => emailStart >= r.index && emailStart < r.index + r.value.length)) {
      results.push({ type: 'email', value: match[0], index: match.index })
    }
  }

  PHONE_REGEX.lastIndex = 0
  while ((match = PHONE_REGEX.exec(text)) !== null) {
    results.push({ type: 'phone', value: match[0], index: match.index })
  }

  return results.sort((a, b) => a.index - b.index)
}

/**
 * Convert a detected link to an href.
 * @param {{ type: string, value: string }} link
 * @returns {string}
 */
function linkToHref(link) {
  if (link.type === 'email') return `mailto:${link.value}`
  if (link.type === 'phone') return `tel:${link.value.replace(/[^\d+]/g, '')}`
  if (link.value.startsWith('www.')) return `https://${link.value}`
  return link.value
}

// ---------------------------------------------------------------------------
// Bookmark anchor helpers
// ---------------------------------------------------------------------------

/**
 * Generate a slug from text for use as an anchor ID.
 * @param {string} text
 * @returns {string}
 */
export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    || 'anchor'
}

// ---------------------------------------------------------------------------
// Link preview tooltip
// ---------------------------------------------------------------------------

let _previewEl = null

function showPreview(anchor, data, editorEl) {
  hidePreview()
  const rect = anchor.getBoundingClientRect()
  const editorRect = editorEl.getBoundingClientRect()

  _previewEl = document.createElement('div')
  _previewEl.className = 'rmx-link-preview'
  _previewEl.innerHTML = `
    ${data.image ? `<img class="rmx-link-preview-img" src="${data.image}" alt="" />` : ''}
    <div class="rmx-link-preview-text">
      <div class="rmx-link-preview-title">${escapeHTML(data.title || anchor.href)}</div>
      ${data.description ? `<div class="rmx-link-preview-desc">${escapeHTML(data.description)}</div>` : ''}
      <div class="rmx-link-preview-url">${escapeHTML(anchor.href)}</div>
    </div>
  `
  _previewEl.style.position = 'absolute'
  _previewEl.style.left = `${rect.left - editorRect.left}px`
  _previewEl.style.top = `${rect.bottom - editorRect.top + 4}px`

  editorEl.style.position = 'relative'
  editorEl.appendChild(_previewEl)
}

function hidePreview() {
  if (_previewEl) {
    _previewEl.remove()
    _previewEl = null
  }
}

// Task 261: escapeHTML imported from shared utils/escapeHTML.js
function escapeHTML(str) {
  if (!str) return ''
  return escapeHTMLAttr(str)
}

// ---------------------------------------------------------------------------
// Plugin
// ---------------------------------------------------------------------------

export function LinkPlugin(options = {}) {
  const {
    onLinkClick,
    onUnfurl,
    onSuggest,
    onBrokenLink,
    validateLink,
    scanInterval = 60000,
    autoLink = true,
    showPreviews = true,
  } = options

  let engine = null
  let scanTimer = null
  let hoverTimer = null
  let unsubContentChange = null

  /** Cache for unfurl results */
  const _unfurlCache = new Map()

  /** Set of URLs marked as broken */
  const _brokenLinks = new Set()

  // -----------------------------------------------------------------------
  // Auto-link: convert typed URLs/emails/phones on Space/Enter
  // -----------------------------------------------------------------------

  function handleAutoLink(e) {
    if (!autoLink || !engine) return
    if (e.key !== ' ' && e.key !== 'Enter') return

    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0 || !sel.isCollapsed) return

    const range = sel.getRangeAt(0)
    const node = range.startContainer
    if (node.nodeType !== 3) return // text node only

    // Don't auto-link inside existing anchors
    if (node.parentElement?.closest('a')) return
    if (!engine.element.contains(node)) return

    const text = node.textContent.substring(0, range.startOffset)
    const links = detectLinks(text)
    if (links.length === 0) return

    // Convert the last detected link (most recent typing)
    const last = links[links.length - 1]
    const endPos = last.index + last.value.length

    // Only convert if the link ends right at the caret
    if (endPos !== range.startOffset) return

    e.preventDefault()
    engine.history.snapshot()

    const href = linkToHref(last)
    const linkRange = document.createRange()
    linkRange.setStart(node, last.index)
    linkRange.setEnd(node, endPos)

    const anchor = document.createElement('a')
    anchor.href = href
    anchor.target = '_blank'
    anchor.rel = 'noopener noreferrer'
    anchor.textContent = last.value

    linkRange.deleteContents()
    linkRange.insertNode(anchor)

    // Insert the space/enter after the link
    const space = document.createTextNode(e.key === ' ' ? ' ' : '')
    anchor.after(space)
    if (e.key === 'Enter') {
      const br = document.createElement('br')
      anchor.after(br)
      const afterBr = document.createTextNode('')
      br.after(afterBr)
      const newRange = document.createRange()
      newRange.setStart(afterBr, 0)
      newRange.collapse(true)
      sel.removeAllRanges()
      sel.addRange(newRange)
    } else {
      const newRange = document.createRange()
      newRange.setStartAfter(space)
      newRange.collapse(true)
      sel.removeAllRanges()
      sel.addRange(newRange)
    }

    node.parentNode?.normalize()
    engine.eventBus.emit('content:change')
  }

  // -----------------------------------------------------------------------
  // Link click tracking
  // -----------------------------------------------------------------------

  function handleLinkClick(e) {
    const anchor = e.target.closest?.('a[href]')
    if (!anchor || !engine?.element.contains(anchor)) return

    if (onLinkClick) {
      onLinkClick({
        href: anchor.href,
        text: anchor.textContent,
        target: anchor.target,
        timestamp: Date.now(),
        element: anchor,
      })
    }
  }

  // -----------------------------------------------------------------------
  // Link hover previews
  // -----------------------------------------------------------------------

  function handleMouseOver(e) {
    if (!showPreviews || !onUnfurl) return
    const anchor = e.target.closest?.('a[href]')
    if (!anchor || !engine?.element.contains(anchor)) return

    clearTimeout(hoverTimer)
    hoverTimer = setTimeout(async () => {
      const url = anchor.href
      try {
        let data = _unfurlCache.get(url)
        if (!data) {
          data = await onUnfurl(url)
          if (data) _unfurlCache.set(url, data)
        }
        if (data) {
          showPreview(anchor, data, engine.element)
        }
      } catch {
        // unfurl failed — silently skip
      }
    }, 400)
  }

  function handleMouseOut(e) {
    const anchor = e.target.closest?.('a[href]')
    if (anchor) {
      clearTimeout(hoverTimer)
      hidePreview()
    }
  }

  // -----------------------------------------------------------------------
  // Broken link detection
  // -----------------------------------------------------------------------

  /** Item 16: Concurrency limit for broken link scanning */
  const CONCURRENT_LINK_CHECKS = 5

  async function scanForBrokenLinks() {
    if (!engine || !validateLink) return
    const anchors = engine.element.querySelectorAll('a[href]')
    const checked = new Set()

    // Collect unique URLs with their anchors
    const urlAnchors = []
    for (const anchor of anchors) {
      const url = anchor.href
      if (checked.has(url) || url.startsWith('mailto:') || url.startsWith('tel:') || url.startsWith('#')) continue
      checked.add(url)
      urlAnchors.push({ url, anchor })
    }

    // Item 16: Process with concurrency limit of 5
    for (let i = 0; i < urlAnchors.length; i += CONCURRENT_LINK_CHECKS) {
      const batch = urlAnchors.slice(i, i + CONCURRENT_LINK_CHECKS)
      await Promise.all(batch.map(async ({ url, anchor }) => {
        try {
          const alive = await validateLink(url)
          if (!alive) {
            _brokenLinks.add(url)
            anchor.classList.add('rmx-link-broken')
            anchor.setAttribute('data-link-broken', 'true')
            onBrokenLink?.(url, anchor)
          } else {
            _brokenLinks.delete(url)
            anchor.classList.remove('rmx-link-broken')
            anchor.removeAttribute('data-link-broken')
          }
        } catch {
          _brokenLinks.add(url)
          anchor.classList.add('rmx-link-broken')
          anchor.setAttribute('data-link-broken', 'true')
          onBrokenLink?.(url, anchor)
        }
      }))
    }

    engine.eventBus.emit('link:scanComplete', {
      total: checked.size,
      broken: _brokenLinks.size,
    })
  }

  // -----------------------------------------------------------------------
  // Sync broken link classes on content change
  // -----------------------------------------------------------------------

  function syncBrokenLinks() {
    if (!engine || _brokenLinks.size === 0) return
    const anchors = engine.element.querySelectorAll('a[href]')
    for (const anchor of anchors) {
      if (_brokenLinks.has(anchor.href)) {
        anchor.classList.add('rmx-link-broken')
        anchor.setAttribute('data-link-broken', 'true')
      }
    }
  }

  // -----------------------------------------------------------------------
  // Plugin definition
  // -----------------------------------------------------------------------

  return createPlugin({
    name: 'advancedLinks',
    requiresFullAccess: true,
    version: '1.0.0',
    description: 'Link previews, broken link detection, auto-linking, analytics, bookmarks',

    commands: [
      {
        name: 'insertBookmark',
        execute(eng, params = {}) {
          const { name, id } = params
          const anchorId = id || slugify(name || 'bookmark')

          eng.history.snapshot()
          const sel = window.getSelection()
          if (!sel || sel.rangeCount === 0) return

          const range = sel.getRangeAt(0)
          const anchor = document.createElement('a')
          anchor.id = anchorId
          anchor.className = 'rmx-bookmark'
          anchor.setAttribute('data-bookmark', anchorId)
          anchor.textContent = name ? `\u{1F4CC} ${name}` : `\u{1F4CC} ${anchorId}`
          anchor.contentEditable = 'false'

          range.collapse(true)
          range.insertNode(anchor)

          // Add a space after the bookmark
          const space = document.createTextNode(' ')
          anchor.after(space)

          eng.eventBus.emit('content:change')
          eng.eventBus.emit('bookmark:created', { id: anchorId, name })
          return anchor
        },
        meta: { icon: 'bookmark', tooltip: 'Insert Bookmark Anchor' },
      },
      {
        name: 'linkToBookmark',
        execute(eng, bookmarkId) {
          if (!bookmarkId) return
          const sel = eng.selection
          const text = sel.getSelectedText()
          if (!text) return

          eng.history.snapshot()
          const link = sel.wrapWith('a', {
            href: `#${bookmarkId}`,
          })
          if (link) {
            link.classList.add('rmx-internal-link')
          }
          eng.eventBus.emit('content:change')
        },
        meta: { icon: 'link', tooltip: 'Link to Bookmark' },
      },
      {
        name: 'getBookmarks',
        execute(eng) {
          const bookmarks = eng.element.querySelectorAll('[data-bookmark]')
          return Array.from(bookmarks).map(el => ({
            id: el.getAttribute('data-bookmark'),
            name: el.textContent.replace(/^\u{1F4CC}\s*/u, ''),
            element: el,
          }))
        },
        meta: { tooltip: 'List Bookmarks' },
      },
      {
        name: 'removeBookmark',
        execute(eng, bookmarkId) {
          const el = eng.element.querySelector(`[data-bookmark="${bookmarkId}"]`)
          if (!el) return
          eng.history.snapshot()
          el.remove()
          eng.eventBus.emit('content:change')
          eng.eventBus.emit('bookmark:deleted', { id: bookmarkId })
        },
        meta: { icon: 'trash', tooltip: 'Remove Bookmark' },
      },
      {
        name: 'scanBrokenLinks',
        execute() {
          scanForBrokenLinks()
        },
        meta: { icon: 'scan', tooltip: 'Scan for Broken Links' },
      },
      {
        name: 'getBrokenLinks',
        execute() {
          return Array.from(_brokenLinks)
        },
        meta: { tooltip: 'Get Broken Links' },
      },
    ],

    contextMenuItems: [
      {
        label: 'Insert Bookmark Here',
        command: 'insertBookmark',
      },
    ],

    init(eng) {
      engine = eng

      // Expose API on engine
      engine._links = {
        detectLinks,
        slugify,
        getBrokenLinks: () => Array.from(_brokenLinks),
        getBookmarks: () => {
          const els = engine.element.querySelectorAll('[data-bookmark]')
          return Array.from(els).map(el => ({
            id: el.getAttribute('data-bookmark'),
            name: el.textContent.replace(/^\u{1F4CC}\s*/u, ''),
          }))
        },
        scanForBrokenLinks,
        clearUnfurlCache: () => _unfurlCache.clear(),
      }

      // Auto-link on space/enter
      if (autoLink) {
        engine.element.addEventListener('keydown', handleAutoLink)
      }

      // Link click tracking
      engine.element.addEventListener('click', handleLinkClick)

      // Link hover previews
      if (showPreviews && onUnfurl) {
        engine.element.addEventListener('mouseover', handleMouseOver)
        engine.element.addEventListener('mouseout', handleMouseOut)
      }

      // Broken link scanning
      if (validateLink && scanInterval > 0) {
        scanTimer = setInterval(scanForBrokenLinks, scanInterval)
        // Initial scan after a short delay
        setTimeout(scanForBrokenLinks, 2000)
      }

      // Sync broken link classes on content changes
      unsubContentChange = engine.eventBus.on('content:change', syncBrokenLinks)
    },

    destroy() {
      if (autoLink) {
        engine?.element?.removeEventListener('keydown', handleAutoLink)
      }
      engine?.element?.removeEventListener('click', handleLinkClick)
      engine?.element?.removeEventListener('mouseover', handleMouseOver)
      engine?.element?.removeEventListener('mouseout', handleMouseOut)

      hidePreview()
      clearTimeout(hoverTimer)
      clearInterval(scanTimer)
      unsubContentChange?.()
      _unfurlCache.clear()
      _brokenLinks.clear()
      engine = null
    },
  })
}
