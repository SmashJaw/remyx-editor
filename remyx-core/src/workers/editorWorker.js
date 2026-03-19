/**
 * Web Worker module for offloading expensive editor operations.
 *
 * Handles HTML sanitization, Markdown parsing, and document conversion
 * dispatch off the main thread to keep the editor responsive.
 *
 * Message protocol:
 *   Request:  { id, type, data }
 *   Response: { id, result } | { id, error }
 */

/* eslint-env worker */

/**
 * Minimal HTML sanitizer for use inside the worker.
 * Strips script tags, event handlers, and dangerous attributes.
 * For full sanitization the main-thread Sanitizer should be used;
 * this provides a fast first pass.
 *
 * @param {string} html - Raw HTML string
 * @returns {string} Sanitized HTML string
 */
function sanitizeHTML(html) {
  // Remove <script> blocks (including content)
  let result = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  // Remove event-handler attributes (onclick, onload, onerror, etc.)
  result = result.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
  // Remove javascript: URLs
  result = result.replace(/href\s*=\s*["']?\s*javascript:[^"'>\s]*/gi, 'href="#"')
  // Remove <iframe>, <object>, <embed> tags
  result = result.replace(/<(iframe|object|embed)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
  result = result.replace(/<(iframe|object|embed)\b[^>]*\/?>/gi, '')
  return result
}

/**
 * Simple Markdown-to-HTML converter for use inside the worker.
 * Handles common constructs: headings, bold, italic, code, links,
 * unordered/ordered lists, blockquotes, and paragraphs.
 *
 * @param {string} md - Markdown source
 * @returns {string} HTML string
 */
function parseMarkdown(md) {
  const lines = md.split('\n')
  const out = []
  let inList = null // 'ul' | 'ol' | null

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]

    // Close open list if the current line is not a list item
    if (inList && !/^\s*[-*]\s/.test(line) && !/^\s*\d+\.\s/.test(line)) {
      out.push(`</${inList}>`)
      inList = null
    }

    // Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/)
    if (headingMatch) {
      const level = headingMatch[1].length
      out.push(`<h${level}>${inlineMarkdown(headingMatch[2])}</h${level}>`)
      continue
    }

    // Blockquote
    if (/^>\s?/.test(line)) {
      out.push(`<blockquote>${inlineMarkdown(line.replace(/^>\s?/, ''))}</blockquote>`)
      continue
    }

    // Unordered list
    const ulMatch = line.match(/^\s*[-*]\s+(.*)$/)
    if (ulMatch) {
      if (inList !== 'ul') {
        if (inList) out.push(`</${inList}>`)
        out.push('<ul>')
        inList = 'ul'
      }
      out.push(`<li>${inlineMarkdown(ulMatch[1])}</li>`)
      continue
    }

    // Ordered list
    const olMatch = line.match(/^\s*\d+\.\s+(.*)$/)
    if (olMatch) {
      if (inList !== 'ol') {
        if (inList) out.push(`</${inList}>`)
        out.push('<ol>')
        inList = 'ol'
      }
      out.push(`<li>${inlineMarkdown(olMatch[1])}</li>`)
      continue
    }

    // Blank line
    if (line.trim() === '') {
      continue
    }

    // Paragraph
    out.push(`<p>${inlineMarkdown(line)}</p>`)
  }

  if (inList) out.push(`</${inList}>`)
  return out.join('\n')
}

/**
 * Convert inline Markdown syntax to HTML.
 * @param {string} text
 * @returns {string}
 */
function inlineMarkdown(text) {
  // Code (backtick)
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>')
  // Bold
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  text = text.replace(/__(.+?)__/g, '<strong>$1</strong>')
  // Italic
  text = text.replace(/\*(.+?)\*/g, '<em>$1</em>')
  text = text.replace(/_(.+?)_/g, '<em>$1</em>')
  // Links
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
  return text
}

/**
 * Dispatch handler for document conversion.
 * Currently acts as a pass-through that validates the request;
 * heavy conversion logic runs on the main thread with access to
 * the full documentConverter utilities.
 *
 * @param {{ format: string, content: string }} data
 * @returns {{ format: string, html: string }}
 */
function dispatchConversion(data) {
  const { format, content } = data
  // For formats we can handle in the worker, do so here.
  // Otherwise return a marker telling the main thread to handle it.
  if (format === 'markdown' || format === 'md') {
    return { format, html: parseMarkdown(content) }
  }
  return { format, html: null, fallback: true }
}

// --- Message handler ---
self.onmessage = function (e) {
  const { id, type, data } = e.data
  try {
    let result
    switch (type) {
      case 'sanitize':
        result = sanitizeHTML(data)
        break
      case 'markdown':
        result = parseMarkdown(data)
        break
      case 'convert':
        result = dispatchConversion(data)
        break
      default:
        throw new Error(`Unknown task type: ${type}`)
    }
    self.postMessage({ id, result })
  } catch (err) {
    self.postMessage({ id, error: err.message })
  }
}
