import { createPlugin } from '../createPlugin.js'

// Maximum length for a URL match to prevent ReDoS on extremely long strings
const MAX_URL_LENGTH = 2048

// Combined regex that matches all three URL patterns in a single pass:
// 1. Protocol URLs: https://example.com/path
// 2. www. prefixed: www.example.com/path
// 3. Bare domains: example.com/path
// Uses alternation groups to eliminate redundant text scans
const COMBINED_URL_REGEX = /(?:https?:\/\/[^\s<]{1,2000}[^\s<.,:;"')\]!?])|(?:www\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,62}[a-zA-Z0-9])?(?:\.[a-zA-Z]{2,20})+(?:\/[^\s<]{0,2000}[^\s<.,:;"')\]!?])?)|(?:(?<![a-zA-Z0-9@/:.])(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,62}[a-zA-Z0-9])?\.){1,10}[a-zA-Z]{2,20}(?:\/[^\s<]{0,2000}[^\s<.,:;"')\]!?])?)/g

// Pre-compiled regexes for checking if a match is part of a larger URL
const PROTOCOL_BEFORE_REGEX = /https?:\/\/$/
const PROTOCOL_OR_WWW_BEFORE_REGEX = /https?:\/\/[^\s]*$/

// Common TLDs to validate bare domains against (avoids false positives like "file.txt")
const COMMON_TLDS = new Set([
  'com', 'org', 'net', 'edu', 'gov', 'mil', 'int',
  'io', 'co', 'us', 'uk', 'ca', 'au', 'de', 'fr', 'es', 'it', 'nl', 'be', 'at', 'ch',
  'jp', 'cn', 'kr', 'in', 'br', 'mx', 'ru', 'za', 'nz', 'se', 'no', 'fi', 'dk', 'pl',
  'dev', 'app', 'ai', 'me', 'tv', 'cc', 'info', 'biz', 'pro', 'name', 'museum',
  'xyz', 'online', 'site', 'tech', 'store', 'blog', 'cloud', 'design', 'agency',
])

/**
 * Extract the TLD from a matched domain string.
 * e.g. "example.com/path" → "com", "docs.github.io" → "io"
 */
function extractTLD(domain) {
  // Remove any path component
  const hostPart = domain.split('/')[0]
  const parts = hostPart.split('.')
  return parts[parts.length - 1].toLowerCase()
}

export function AutolinkPlugin() {
  // Store handler reference for cleanup
  let _handler = null

  return createPlugin({
    name: 'autolink',
    requiresFullAccess: true, // Needs direct DOM event listener access
    init(engine) {
      _handler = (e) => {
        if (e.key !== ' ' && e.key !== 'Enter') return

        const sel = window.getSelection()
        if (!sel || !sel.focusNode) return
        const textNode = sel.focusNode
        if (textNode.nodeType !== Node.TEXT_NODE) return

        // Check if already inside a link
        if (textNode.parentElement.closest('a')) return

        const text = textNode.textContent
        const match = findLastURLMatch(text)
        if (!match) return

        const { href, startIdx, endIdx } = match

        // Ensure the matched range is before the cursor position
        const cursorOffset = sel.focusOffset
        if (endIdx > cursorOffset) return

        // Create the link
        const range = document.createRange()
        range.setStart(textNode, startIdx)
        range.setEnd(textNode, endIdx)

        const link = document.createElement('a')
        link.href = href
        link.target = '_blank'
        link.rel = 'noopener noreferrer'
        range.surroundContents(link)

        // Move cursor after the link
        const newRange = document.createRange()
        newRange.setStartAfter(link)
        newRange.collapse(true)
        sel.removeAllRanges()
        sel.addRange(newRange)
      }

      engine.element.addEventListener('keydown', _handler)
    },
    destroy(engine) {
      if (_handler) {
        engine.element.removeEventListener('keydown', _handler)
        _handler = null
      }
    },
  })
}

/**
 * Find the last URL-like match in a text string.
 * Checks protocol URLs first, then www. domains, then bare domains.
 * Returns { url, href, startIdx, endIdx } or null.
 */
function findLastURLMatch(text) {
  // Guard against extremely long text nodes that could cause regex performance issues
  if (!text || text.length > MAX_URL_LENGTH * 2) return null

  // Task 270: Limit search to the last 200 characters of the text node
  const searchStart = Math.max(0, text.length - 200)
  if (searchStart > 0) {
    text = text.slice(searchStart)
  }

  let best = null

  // Single pass using combined regex with alternation groups
  for (const m of text.matchAll(COMBINED_URL_REGEX)) {
    const url = m[0]
    const isProtocol = url.startsWith('http://') || url.startsWith('https://')
    const isWww = !isProtocol && url.startsWith('www.')
    const isBare = !isProtocol && !isWww

    let href = url
    let candidate = null

    if (isProtocol) {
      candidate = { url, href: url, startIdx: m.index, endIdx: m.index + url.length }
    } else if (isWww) {
      // Make sure this isn't part of a protocol URL already matched
      const before = text.slice(Math.max(0, m.index - 8), m.index)
      if (PROTOCOL_BEFORE_REGEX.test(before)) continue
      candidate = { url, href: 'https://' + url, startIdx: m.index, endIdx: m.index + url.length }
    } else if (isBare) {
      const tld = extractTLD(url)
      // Only auto-link if the TLD is a known one (avoids false positives)
      if (!COMMON_TLDS.has(tld)) continue
      // Make sure this isn't part of a www. or protocol URL already matched
      const before = text.slice(Math.max(0, m.index - 12), m.index)
      if (PROTOCOL_OR_WWW_BEFORE_REGEX.test(before) || /www\.$/.test(before)) continue
      candidate = { url, href: 'https://' + url, startIdx: m.index, endIdx: m.index + url.length }
    }

    if (candidate && (!best || candidate.startIdx >= best.startIdx)) {
      best = candidate
    }
  }

  // Task 270: Adjust indices back to original text positions
  if (best && searchStart > 0) {
    best.startIdx += searchStart
    best.endIdx += searchStart
  }

  return best
}
