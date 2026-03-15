/**
 * Lightweight HTML tokenizer for syntax highlighting.
 * Returns an array of { text, className } tokens.
 */
export function highlightHTML(code) {
  const tokens = []
  let i = 0
  const len = code.length

  while (i < len) {
    // Comment: <!-- ... -->
    if (code[i] === '<' && code.startsWith('!--', i + 1)) {
      const end = code.indexOf('-->', i + 4)
      const commentEnd = end === -1 ? len : end + 3
      tokens.push({ text: code.slice(i, commentEnd), className: 'rmx-syn-comment' })
      i = commentEnd
      continue
    }

    // Doctype: <!DOCTYPE ...>
    if (code[i] === '<' && code.startsWith('!', i + 1) && /^<![a-zA-Z]/.test(code.slice(i, i + 3))) {
      const end = code.indexOf('>', i)
      const doctypeEnd = end === -1 ? len : end + 1
      tokens.push({ text: code.slice(i, doctypeEnd), className: 'rmx-syn-doctype' })
      i = doctypeEnd
      continue
    }

    // Tag: < ... >
    if (code[i] === '<' && (code[i + 1] === '/' || /[a-zA-Z]/.test(code[i + 1] || ''))) {
      i = parseTag(code, i, tokens)
      continue
    }

    // Entity: &...;
    if (code[i] === '&') {
      const semi = code.indexOf(';', i + 1)
      if (semi !== -1 && semi - i < 12 && /^&[#a-zA-Z0-9]+;$/.test(code.slice(i, semi + 1))) {
        tokens.push({ text: code.slice(i, semi + 1), className: 'rmx-syn-entity' })
        i = semi + 1
        continue
      }
    }

    // Plain text until next < or &
    let textEnd = i + 1
    while (textEnd < len && code[textEnd] !== '<' && code[textEnd] !== '&') {
      textEnd++
    }
    tokens.push({ text: code.slice(i, textEnd), className: null })
    i = textEnd
  }

  return tokens
}

/**
 * Parse an HTML tag starting at position i, pushing tokens.
 * Returns the new position after the tag.
 */
function parseTag(code, i, tokens) {
  const len = code.length

  // Opening: < or </
  if (code[i + 1] === '/') {
    tokens.push({ text: '</', className: 'rmx-syn-tag' })
    i += 2
  } else {
    tokens.push({ text: '<', className: 'rmx-syn-tag' })
    i += 1
  }

  // Tag name
  let nameStart = i
  while (i < len && /[a-zA-Z0-9:-]/.test(code[i])) i++
  if (i > nameStart) {
    tokens.push({ text: code.slice(nameStart, i), className: 'rmx-syn-tag' })
  }

  // Attributes and closing
  while (i < len) {
    // Skip whitespace
    if (/\s/.test(code[i])) {
      let wsStart = i
      while (i < len && /\s/.test(code[i])) i++
      tokens.push({ text: code.slice(wsStart, i), className: null })
      continue
    }

    // Self-close or close: />, >
    if (code[i] === '/' && code[i + 1] === '>') {
      tokens.push({ text: '/>', className: 'rmx-syn-tag' })
      return i + 2
    }
    if (code[i] === '>') {
      tokens.push({ text: '>', className: 'rmx-syn-tag' })
      return i + 1
    }

    // Attribute name
    let attrStart = i
    while (i < len && /[^\s=/>]/.test(code[i])) i++
    if (i > attrStart) {
      tokens.push({ text: code.slice(attrStart, i), className: 'rmx-syn-attr-name' })
    }

    // Skip whitespace around =
    while (i < len && /\s/.test(code[i])) {
      tokens.push({ text: code[i], className: null })
      i++
    }

    // = sign
    if (i < len && code[i] === '=') {
      tokens.push({ text: '=', className: null })
      i++

      // Skip whitespace after =
      while (i < len && /\s/.test(code[i])) {
        tokens.push({ text: code[i], className: null })
        i++
      }

      // Attribute value
      if (i < len && (code[i] === '"' || code[i] === "'")) {
        const quote = code[i]
        const valEnd = code.indexOf(quote, i + 1)
        const end = valEnd === -1 ? len : valEnd + 1
        tokens.push({ text: code.slice(i, end), className: 'rmx-syn-attr-value' })
        i = end
      } else {
        // Unquoted value
        let valStart = i
        while (i < len && /[^\s>]/.test(code[i])) i++
        if (i > valStart) {
          tokens.push({ text: code.slice(valStart, i), className: 'rmx-syn-attr-value' })
        }
      }
    }
  }

  return i
}
