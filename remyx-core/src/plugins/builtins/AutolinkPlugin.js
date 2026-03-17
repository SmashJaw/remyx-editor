import { createPlugin } from '../createPlugin.js'

// Matches URLs with an explicit protocol: http://example.com, https://example.com/path
const PROTOCOL_URL_REGEX = /https?:\/\/[^\s<]+[^\s<.,:;"')\]!?]/g

// Matches www. prefixed domains: www.example.com, www.example.com/path
const WWW_REGEX = /www\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+([/][^\s<]*[^\s<.,:;"')\]!?])?/g

// Matches bare domain names: example.com, sub.example.co.uk, docs.github.io/path
// Requires at least one dot and a valid TLD (2+ alpha chars)
const DOMAIN_REGEX = /(?<![a-zA-Z0-9@/:.])([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}([/][^\s<]*[^\s<.,:;"')\]!?])?/g

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
  let best = null

  // 1) Protocol URLs — highest priority (https://example.com)
  for (const m of text.matchAll(PROTOCOL_URL_REGEX)) {
    const url = m[0]
    best = { url, href: url, startIdx: m.index, endIdx: m.index + url.length }
  }

  // 2) www. domains (www.example.com)
  for (const m of text.matchAll(WWW_REGEX)) {
    const url = m[0]
    const candidate = { url, href: 'https://' + url, startIdx: m.index, endIdx: m.index + url.length }
    // Only use if it starts after or at the same position as current best
    if (!best || candidate.startIdx >= best.startIdx) {
      // Make sure this isn't part of a protocol URL already matched
      const before = text.slice(Math.max(0, m.index - 8), m.index)
      if (!PROTOCOL_BEFORE_REGEX.test(before)) {
        best = candidate
      }
    }
  }

  // 3) Bare domains (example.com, sub.example.io/path)
  for (const m of text.matchAll(DOMAIN_REGEX)) {
    const url = m[0]
    const tld = extractTLD(url)

    // Only auto-link if the TLD is a known one (avoids false positives)
    if (!COMMON_TLDS.has(tld)) continue

    const candidate = { url, href: 'https://' + url, startIdx: m.index, endIdx: m.index + url.length }

    if (!best || candidate.startIdx >= best.startIdx) {
      // Make sure this isn't part of a www. or protocol URL already matched
      const before = text.slice(Math.max(0, m.index - 12), m.index)
      if (!PROTOCOL_OR_WWW_BEFORE_REGEX.test(before) && !/www\.$/.test(before)) {
        best = candidate
      }
    }
  }

  return best
}
