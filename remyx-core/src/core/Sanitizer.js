import { ALLOWED_TAGS, ALLOWED_STYLES } from '../constants/schema.js'
import { djb2Hash } from '../utils/hash.js'

// Pre-compiled regex (avoid recompilation on every href check during sanitization)
const JS_PROTOCOL_REGEX = /^\s*javascript\s*:/i

// CSS value injection patterns (expression(), @import, behavior:, javascript:)
const CSS_INJECTION_REGEX = /expression\s*\(|@import|behavior\s*:|javascript\s*:/i

// Tags whose children should be removed entirely (not just unwrapped)
const DANGEROUS_REMOVE_TAGS = new Set([
  'script', 'style', 'svg', 'math', 'form', 'object', 'embed', 'applet', 'template',
])

/**
 * Default iframe src domain allowlist.
 * Only iframes whose src matches one of these hostnames (or their subdomains)
 * are permitted. All others are removed during sanitization.
 */
const DEFAULT_IFRAME_ALLOWED_DOMAINS = [
  'www.youtube.com',
  'youtube.com',
  'www.youtube-nocookie.com',
  'player.vimeo.com',
  'www.dailymotion.com',
  'geo.dailymotion.com',
]

/**
 * Check whether an iframe src URL is on an allowed domain.
 * Returns true if the URL's hostname matches or is a subdomain of an allowed domain.
 */
function isAllowedIframeDomain(src, allowedDomains) {
  if (!src) return false
  try {
    const url = new URL(src)
    // Only allow https (and protocol-relative URLs which the browser resolves)
    if (url.protocol !== 'https:') return false
    const hostname = url.hostname.toLowerCase()
    return allowedDomains.some(domain => {
      const d = domain.toLowerCase()
      return hostname === d || hostname.endsWith('.' + d)
    })
  } catch {
    return false
  }
}

/**
 * @typedef {Object} SanitizerOptions
 * @property {Object} [allowedTags] - Map of allowed tag names to arrays of allowed attribute names
 * @property {string[]} [allowedStyles] - List of allowed CSS property names
 * @property {string[]} [iframeAllowedDomains] - List of allowed iframe src hostnames
 */

/**
 * Sanitizes HTML content by removing disallowed tags, attributes, and styles.
 * Prevents XSS through event handler attributes, javascript: URLs, CSS injection,
 * and iframe src domain restrictions.
 */
// LRU cache max size for sanitize results
const SANITIZE_CACHE_MAX = 50

export class Sanitizer {
  /**
   * Creates a new Sanitizer instance.
   * @param {SanitizerOptions} [options={}] - Sanitizer configuration
   */
  constructor(options = {}) {
    this.allowedTags = options.allowedTags || ALLOWED_TAGS
    this.allowedStyles = options.allowedStyles || ALLOWED_STYLES
    this.iframeAllowedDomains = options.iframeAllowedDomains || DEFAULT_IFRAME_ALLOWED_DOMAINS
    this._cache = new Map()
    // Task 250: Hoist DOMParser as a class property for reuse
    this._parser = new DOMParser()
  }

  /**
   * Sanitizes an HTML string by parsing it and removing disallowed elements,
   * attributes, event handlers, javascript: URLs, and dangerous CSS values.
   * Dangerous tags (script, style, svg, etc.) are removed with all children;
   * other disallowed tags are unwrapped (children preserved).
   * Results are cached in a simple LRU cache (max 50 entries).
   * @param {string} html - The HTML string to sanitize
   * @returns {string} The sanitized HTML string, or empty string if input is falsy
   */
  sanitize(html) {
    if (!html) return ''

    // Item 3: Use hash for fast lookup but verify with full string comparison on hit
    const cacheKey = djb2Hash(html)

    // Check LRU cache — verify full string to avoid hash collisions
    if (this._cache.has(cacheKey)) {
      const cached = this._cache.get(cacheKey)
      if (cached.input === html) {
        // Move to end (most recently used)
        this._cache.delete(cacheKey)
        this._cache.set(cacheKey, cached)
        return cached.output
      }
      // Hash collision — fall through to recompute
    }

    // Task 250: Use hoisted DOMParser instance
    const doc = this._parser.parseFromString(`<body>${html}</body>`, 'text/html')
    this._cleanNode(doc.body)
    const result = doc.body.innerHTML

    // Store in cache with both hash and original string, evict oldest if over limit
    if (this._cache.size >= SANITIZE_CACHE_MAX) {
      const firstKey = this._cache.keys().next().value
      this._cache.delete(firstKey)
    }
    this._cache.set(cacheKey, { input: html, output: result })

    return result
  }

  /**
   * Recursively cleans a DOM node by removing disallowed children, attributes,
   * and sanitizing styles and href values.
   * @private
   * @param {Node} node - The DOM node to clean
   * @returns {void}
   */
  _cleanNode(node) {
    // Task 271: Reverse iteration to avoid Array.from() allocation
    for (let i = node.childNodes.length - 1; i >= 0; i--) {
      const child = node.childNodes[i]
      if (child.nodeType === Node.TEXT_NODE) continue
      if (child.nodeType === Node.COMMENT_NODE) {
        node.removeChild(child)
        continue
      }
      if (child.nodeType !== Node.ELEMENT_NODE) {
        node.removeChild(child)
        continue
      }

      const tagName = child.tagName.toLowerCase()
      const allowedAttrs = this.allowedTags[tagName]

      if (!allowedAttrs) {
        if (DANGEROUS_REMOVE_TAGS.has(tagName)) {
          // Remove entirely including children — these tags can contain harmful structures
          node.removeChild(child)
        } else {
          // Unwrap: keep children but remove the tag
          while (child.firstChild) {
            node.insertBefore(child.firstChild, child)
          }
          node.removeChild(child)
        }
        continue
      }

      // Remove disallowed attributes + explicitly block on* event handlers
      const attrs = Array.from(child.attributes)
      for (const attr of attrs) {
        // Defense-in-depth: block all event handler attributes regardless of allowlist
        if (attr.name.startsWith('on')) {
          child.removeAttribute(attr.name)
          continue
        }
        if (attr.name === 'style') {
          if (allowedAttrs.includes('style')) {
            this._cleanStyles(child)
          } else {
            child.removeAttribute('style')
          }
        } else if (!allowedAttrs.includes(attr.name)) {
          child.removeAttribute(attr.name)
        }
      }

      // Sanitize href to prevent javascript: URLs
      if (child.hasAttribute('href')) {
        const href = child.getAttribute('href')
        if (href && JS_PROTOCOL_REGEX.test(href)) {
          child.setAttribute('href', '#')
        }
      }

      // Restrict <input> to type="checkbox" only (prevent phishing via hidden/password/submit inputs)
      if (tagName === 'input') {
        const inputType = (child.getAttribute('type') || '').toLowerCase()
        if (inputType !== 'checkbox') {
          node.removeChild(child)
          continue
        }
      }

      // Restrict <iframe> src to allowed domains only (YouTube, Vimeo, Dailymotion by default)
      if (tagName === 'iframe') {
        const src = child.getAttribute('src')
        if (!isAllowedIframeDomain(src, this.iframeAllowedDomains)) {
          node.removeChild(child)
          continue
        }
      }

      this._cleanNode(child)
    }
  }

  /**
   * Cleans inline styles on an element, keeping only allowed CSS properties
   * and blocking CSS injection vectors.
   * @private
   * @param {HTMLElement} element - The element whose styles should be cleaned
   * @returns {void}
   */
  _cleanStyles(element) {
    const style = element.style
    const cleanedStyles = []

    for (const prop of this.allowedStyles) {
      const value = style.getPropertyValue(prop)
      if (value) {
        // Block CSS value injection vectors (expression(), @import, behavior:, javascript:)
        if (CSS_INJECTION_REGEX.test(value)) continue
        cleanedStyles.push(`${prop}: ${value}`)
      }
    }

    if (cleanedStyles.length > 0) {
      element.setAttribute('style', cleanedStyles.join('; '))
    } else {
      element.removeAttribute('style')
    }
  }
}
