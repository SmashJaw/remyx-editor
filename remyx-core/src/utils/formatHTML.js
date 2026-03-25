import { escapeHTMLAttr } from './escapeHTML.js'

/**
 * Lightweight HTML formatter / prettifier.
 * Produces indented, readable HTML similar to VS Code's formatting.
 * Zero dependencies — uses the browser's DOMParser for correctness.
 */

// Block-level elements that get their own line
const BLOCK_ELEMENTS = new Set([
  'html', 'head', 'body',
  'div', 'section', 'article', 'aside', 'nav', 'header', 'footer', 'main',
  'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
  'blockquote', 'pre', 'figure', 'figcaption',
  'form', 'fieldset', 'legend',
  'details', 'summary',
  'hr', 'br',
  'iframe', 'video', 'audio', 'canvas',
])

// Void elements (self-closing, no end tag)
const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
])

// Elements whose content should not be reformatted (preserve whitespace)
const PREFORMATTED = new Set(['pre', 'code', 'script', 'style', 'textarea'])

// Inline elements that should stay on the same line as their parent text
const INLINE_ELEMENTS = new Set([
  'a', 'abbr', 'b', 'bdi', 'bdo', 'cite', 'code', 'data', 'del', 'dfn',
  'em', 'i', 'ins', 'kbd', 'mark', 'q', 's', 'samp', 'small', 'span',
  'strong', 'sub', 'sup', 'time', 'u', 'var', 'wbr', 'label', 'input',
])

/**
 * Format raw HTML into a prettified, indented string.
 *
 * @param {string} html - The raw HTML string
 * @param {number} [indentSize=2] - Number of spaces per indent level
 * @returns {string} Formatted HTML
 */
export function formatHTML(html) {
  if (!html || !html.trim()) return ''

  const indent = '  ' // 2 spaces

  // Parse the HTML into a DOM tree
  const parser = new DOMParser()
  const doc = parser.parseFromString(`<body>${html}</body>`, 'text/html')
  const body = doc.body

  const lines = []
  formatNode(body, 0, lines, indent)

  return lines.join('\n').trim()
}

/**
 * Recursively format a DOM node and its children.
 */
function formatNode(node, level, lines, indent) {
  const children = Array.from(node.childNodes)

  for (const child of children) {
    if (child.nodeType === Node.COMMENT_NODE) {
      lines.push(`${indent.repeat(Math.max(0, level))}<!--${child.textContent}-->`)
      continue
    }

    if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent
      // Skip pure-whitespace text nodes between block elements
      if (!text.trim()) continue
      const trimmed = text.replace(/\s+/g, ' ').trim()
      if (trimmed) {
        lines.push(`${indent.repeat(Math.max(0, level))}${trimmed}`)
      }
      continue
    }

    if (child.nodeType !== Node.ELEMENT_NODE) continue

    const tag = child.tagName.toLowerCase()

    // Preformatted elements — output as-is, no reformatting
    if (PREFORMATTED.has(tag)) {
      lines.push(`${indent.repeat(Math.max(0, level))}${child.outerHTML}`)
      continue
    }

    const isVoid = VOID_ELEMENTS.has(tag)
    const currentIndent = indent.repeat(Math.max(0, level))

    // Build the opening tag with attributes
    const openTag = buildOpenTag(child, tag)

    if (isVoid) {
      // Self-closing element
      lines.push(`${currentIndent}${openTag}`)
      continue
    }

    // Check if this element only contains inline content (text + inline elements)
    const hasOnlyInlineContent = isInlineContent(child)

    if (hasOnlyInlineContent) {
      // Render the entire element on one line
      const innerContent = serializeInlineContent(child)
      lines.push(`${currentIndent}${openTag}${innerContent}</${tag}>`)
    } else {
      // Block element with block children — indent children
      lines.push(`${currentIndent}${openTag}`)
      formatNode(child, level + 1, lines, indent)
      lines.push(`${currentIndent}</${tag}>`)
    }
  }
}

/**
 * Build an opening tag string from a DOM element, including attributes.
 */
function buildOpenTag(el, tag) {
  const attrs = Array.from(el.attributes)
  if (attrs.length === 0) return `<${tag}>`

  const attrStr = attrs.map(a => {
    if (a.value === '') return a.name
    return `${a.name}="${escapeHTMLAttr(a.value)}"`
  }).join(' ')

  return `<${tag} ${attrStr}>`
}

/**
 * Check if an element only contains inline content
 * (text nodes and inline elements, no block-level children).
 */
function isInlineContent(el) {
  for (const child of el.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) continue
    if (child.nodeType === Node.ELEMENT_NODE) {
      const tag = child.tagName.toLowerCase()
      if (BLOCK_ELEMENTS.has(tag)) return false
      // Recursively check inline children
      if (!isInlineContent(child)) return false
    }
  }
  return true
}

/**
 * Serialize inline content (text + inline tags) into a single string,
 * preserving inner tags but collapsing whitespace.
 */
function serializeInlineContent(el) {
  let result = ''
  for (const child of el.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      result += child.textContent.replace(/\s+/g, ' ')
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const tag = child.tagName.toLowerCase()
      const openTag = buildOpenTag(child, tag)
      if (VOID_ELEMENTS.has(tag)) {
        result += openTag
      } else {
        result += `${openTag}${serializeInlineContent(child)}</${tag}>`
      }
    }
  }
  return result
}

