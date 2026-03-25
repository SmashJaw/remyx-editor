/**
 * Lightweight Markdown tokenizer for syntax highlighting.
 * Operates line-by-line since Markdown is line-oriented.
 * Returns an array of { text, className } tokens.
 */
export function highlightMarkdown(code) {
  const lines = code.split('\n')
  const tokens = []
  let inCodeBlock = false

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx]

    // Add newline between lines (not before the first)
    if (lineIdx > 0) {
      tokens.push({ text: '\n', className: null })
    }

    // Code fence toggle: ```
    if (/^```/.test(line.trimStart())) {
      tokens.push({ text: line, className: 'rmx-syn-code-fence' })
      inCodeBlock = !inCodeBlock
      continue
    }

    // Inside code block — all code
    if (inCodeBlock) {
      tokens.push({ text: line, className: 'rmx-syn-code' })
      continue
    }

    // Heading: # ... ######
    if (/^#{1,6}\s/.test(line)) {
      tokens.push({ text: line, className: 'rmx-syn-heading' })
      continue
    }

    // Horizontal rule: ---, ***, ___
    if (/^(\s*)([-*_])\2{2,}\s*$/.test(line)) {
      tokens.push({ text: line, className: 'rmx-syn-hr' })
      continue
    }

    // Blockquote: > text
    if (/^>\s?/.test(line)) {
      const markerMatch = line.match(/^(>\s?)/)
      tokens.push({ text: markerMatch[0], className: 'rmx-syn-blockquote' })
      highlightInline(line.slice(markerMatch[0].length), tokens)
      continue
    }

    // Unordered list: - item, * item, + item
    const ulMatch = line.match(/^(\s*[-*+]\s+)/)
    if (ulMatch) {
      tokens.push({ text: ulMatch[0], className: 'rmx-syn-list-marker' })
      highlightInline(line.slice(ulMatch[0].length), tokens)
      continue
    }

    // Ordered list: 1. item, 2) item
    const olMatch = line.match(/^(\s*\d+[.)]\s+)/)
    if (olMatch) {
      tokens.push({ text: olMatch[0], className: 'rmx-syn-list-marker' })
      highlightInline(line.slice(olMatch[0].length), tokens)
      continue
    }

    // Table separator: |---|---|
    if (/^\|[\s:|-]+\|$/.test(line.trim())) {
      tokens.push({ text: line, className: 'rmx-syn-hr' })
      continue
    }

    // Regular line — process inline formatting
    highlightInline(line, tokens)
  }

  return tokens
}

/**
 * Tokenize inline Markdown formatting within a line.
 * Handles: bold, italic, inline code, links, images.
 */
function highlightInline(text, tokens) {
  let i = 0
  const len = text.length
  let plainStart = 0

  while (i < len) {
    // Inline code: `code`
    if (text[i] === '`') {
      if (i > plainStart) {
        tokens.push({ text: text.slice(plainStart, i), className: null })
      }
      const end = text.indexOf('`', i + 1)
      if (end !== -1) {
        tokens.push({ text: text.slice(i, end + 1), className: 'rmx-syn-code' })
        i = end + 1
        plainStart = i
        continue
      }
    }

    // Image: ![alt](url)
    if (text[i] === '!' && text[i + 1] === '[') {
      const closeBracket = text.indexOf(']', i + 2)
      if (closeBracket !== -1 && text[closeBracket + 1] === '(') {
        const closeParen = text.indexOf(')', closeBracket + 2)
        if (closeParen !== -1) {
          if (i > plainStart) {
            tokens.push({ text: text.slice(plainStart, i), className: null })
          }
          tokens.push({ text: text.slice(i, closeParen + 1), className: 'rmx-syn-image' })
          i = closeParen + 1
          plainStart = i
          continue
        }
      }
    }

    // Link: [text](url)
    if (text[i] === '[') {
      const closeBracket = text.indexOf(']', i + 1)
      if (closeBracket !== -1 && text[closeBracket + 1] === '(') {
        const closeParen = text.indexOf(')', closeBracket + 2)
        if (closeParen !== -1) {
          if (i > plainStart) {
            tokens.push({ text: text.slice(plainStart, i), className: null })
          }
          // [text]
          tokens.push({ text: text.slice(i, closeBracket + 1), className: 'rmx-syn-link' })
          // (url)
          tokens.push({ text: text.slice(closeBracket + 1, closeParen + 1), className: 'rmx-syn-url' })
          i = closeParen + 1
          plainStart = i
          continue
        }
      }
    }

    // Bold: **text** or __text__
    if ((text[i] === '*' && text[i + 1] === '*') || (text[i] === '_' && text[i + 1] === '_')) {
      const marker = text.slice(i, i + 2)
      const end = text.indexOf(marker, i + 2)
      if (end !== -1) {
        if (i > plainStart) {
          tokens.push({ text: text.slice(plainStart, i), className: null })
        }
        tokens.push({ text: text.slice(i, end + 2), className: 'rmx-syn-bold' })
        i = end + 2
        plainStart = i
        continue
      }
    }

    // Italic: *text* or _text_ (single, not preceded/followed by same)
    if ((text[i] === '*' || text[i] === '_') && text[i + 1] !== text[i]) {
      const marker = text[i]
      const end = text.indexOf(marker, i + 1)
      if (end !== -1 && end > i + 1) {
        if (i > plainStart) {
          tokens.push({ text: text.slice(plainStart, i), className: null })
        }
        tokens.push({ text: text.slice(i, end + 1), className: 'rmx-syn-italic' })
        i = end + 1
        plainStart = i
        continue
      }
    }

    i++
  }

  // Remaining plain text
  if (plainStart < len) {
    tokens.push({ text: text.slice(plainStart), className: null })
  }
}
