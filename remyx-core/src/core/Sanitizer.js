import { ALLOWED_TAGS, ALLOWED_STYLES } from '../constants/schema.js'

// Pre-compiled regex (avoid recompilation on every href check during sanitization)
const JS_PROTOCOL_REGEX = /^\s*javascript\s*:/i

// CSS value injection patterns (expression(), @import, behavior:, javascript:)
const CSS_INJECTION_REGEX = /expression\s*\(|@import|behavior\s*:|javascript\s*:/i

// Tags whose children should be removed entirely (not just unwrapped)
const DANGEROUS_REMOVE_TAGS = new Set([
  'script', 'style', 'svg', 'math', 'form', 'object', 'embed', 'applet', 'template',
])

export class Sanitizer {
  constructor(options = {}) {
    this.allowedTags = options.allowedTags || ALLOWED_TAGS
    this.allowedStyles = options.allowedStyles || ALLOWED_STYLES
  }

  sanitize(html) {
    if (!html) return ''
    const parser = new DOMParser()
    const doc = parser.parseFromString(`<body>${html}</body>`, 'text/html')
    this._cleanNode(doc.body)
    return doc.body.innerHTML
  }

  _cleanNode(node) {
    const children = Array.from(node.childNodes)
    for (const child of children) {
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

      this._cleanNode(child)
    }
  }

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
