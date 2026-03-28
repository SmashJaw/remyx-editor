/**
 * RTL (right-to-left) language support utilities.
 *
 * Provides automatic text direction detection and helpers for
 * bidirectional content within the editor.
 */

// Unicode ranges for RTL scripts
const RTL_REGEX = /[\u0591-\u07FF\u200F\u202B\u202E\uFB1D-\uFDFD\uFE70-\uFEFC]/
const RTL_REGEX_GLOBAL = /[\u0591-\u07FF\u200F\u202B\u202E\uFB1D-\uFDFD\uFE70-\uFEFC]/g

// Unicode ranges for LTR scripts (Latin, CJK, etc.)
const LTR_REGEX = /[A-Za-z\u00C0-\u00FF\u0100-\u024F\u0400-\u04FF\u1100-\u11FF\u3040-\u309F\u30A0-\u30FF\u3400-\u4DBF\u4E00-\u9FFF]/
const LTR_REGEX_GLOBAL = /[A-Za-z\u00C0-\u00FF\u0100-\u024F\u0400-\u04FF\u1100-\u11FF\u3040-\u309F\u30A0-\u30FF\u3400-\u4DBF\u4E00-\u9FFF]/g

/**
 * Detect the dominant text direction of a string.
 *
 * Counts RTL vs LTR character occurrences and returns the direction
 * of whichever has more characters. Returns 'auto' if the string
 * contains no directional characters (e.g., numbers only).
 *
 * Uses a counting loop instead of match() to avoid allocating
 * temporary arrays for every call — important since this runs on
 * every input event for each block element.
 *
 * @param {string} text - The text to analyze
 * @returns {'ltr' | 'rtl' | 'auto'} The detected text direction
 */
export function detectTextDirection(text) {
  if (!text || typeof text !== 'string') return 'auto'

  let rtlCount = 0
  let ltrCount = 0
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (RTL_REGEX.test(ch)) rtlCount++
    else if (LTR_REGEX.test(ch)) ltrCount++
    // Early exit: once we find a strong direction character, for short texts
    // we can decide quickly. For first-strong-char detection (common use case),
    // this avoids scanning the rest of the string.
    // However, we need the full count for mixed-direction blocks, so no early exit.
  }

  if (rtlCount === 0 && ltrCount === 0) return 'auto'
  return rtlCount > ltrCount ? 'rtl' : 'ltr'
}

/**
 * Apply the `dir` attribute to a block element based on its text content.
 *
 * This function is designed to be called on each block-level element
 * (paragraph, heading, list item, etc.) to set the appropriate
 * text direction.
 *
 * @param {HTMLElement} element - The block element to update
 */
export function applyAutoDirection(element) {
  if (!element || !element.textContent) return
  const dir = detectTextDirection(element.textContent)
  if (dir === 'auto') {
    element.removeAttribute('dir')
  } else {
    element.setAttribute('dir', dir)
  }
}

/**
 * Apply auto-direction to all block-level elements in a container.
 *
 * @param {HTMLElement} container - The container element (typically the editor root)
 */
export function applyAutoDirectionAll(container) {
  if (!container) return
  const blocks = container.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, blockquote, td, th')
  for (const block of blocks) {
    applyAutoDirection(block)
  }
}

/**
 * Apply auto-direction to just the block containing the current selection.
 * Much cheaper than applyAutoDirectionAll — use this on frequent events like
 * input/keydown where only the active block's direction may have changed.
 *
 * @param {HTMLElement} container - The editor root element
 */
export function applyAutoDirectionAtCaret(container) {
  if (!container) return
  const sel = window.getSelection?.()
  if (!sel || sel.rangeCount === 0) return
  let node = sel.anchorNode
  if (!node || !container.contains(node)) return
  // Walk up to find the nearest block-level element
  if (node.nodeType === Node.TEXT_NODE) node = node.parentElement
  const BLOCK_SELECTOR = 'p, h1, h2, h3, h4, h5, h6, li, blockquote, td, th'
  const block = node?.closest?.(BLOCK_SELECTOR)
  if (block && container.contains(block)) {
    applyAutoDirection(block)
  }
}

/**
 * Detect the direction of a single character.
 *
 * @param {string} char - A single character to test
 * @returns {'ltr' | 'rtl' | 'neutral'} The character's directionality
 */
export function getCharDirection(char) {
  if (!char || typeof char !== 'string') return 'neutral'
  // Use codePointAt to correctly handle surrogate pairs (emoji, etc.)
  // then test the single code-point string against regex
  const cp = char.codePointAt(0)
  if (cp === undefined) return 'neutral'
  const c = String.fromCodePoint(cp)
  if (RTL_REGEX.test(c)) return 'rtl'
  if (LTR_REGEX.test(c)) return 'ltr'
  return 'neutral'
}

/**
 * Detect whether a position in a string is at a BiDi boundary —
 * i.e. the characters immediately before and after the offset have
 * different strong directionality (ignoring neutral characters).
 *
 * @param {string} text - The text to analyze
 * @param {number} offset - The character offset (boundary is between offset-1 and offset)
 * @returns {boolean} True if this is a BiDi boundary
 */
export function isBiDiBoundary(text, offset) {
  if (!text || offset <= 0 || offset >= text.length) return false

  // Walk backward from offset-1 to find the nearest strong-direction character
  let leftDir = null
  for (let i = offset - 1; i >= 0; i--) {
    const dir = getCharDirection(text[i])
    if (dir !== 'neutral') {
      leftDir = dir
      break
    }
  }

  // Walk forward from offset to find the nearest strong-direction character
  let rightDir = null
  for (let i = offset; i < text.length; i++) {
    const dir = getCharDirection(text[i])
    if (dir !== 'neutral') {
      rightDir = dir
      break
    }
  }

  if (!leftDir || !rightDir) return false
  return leftDir !== rightDir
}

/**
 * RTL-aware CSS logical property mappings.
 * Use these constants to reference CSS logical properties in JavaScript
 * for consistent layout in both LTR and RTL contexts.
 */
export const LOGICAL_PROPERTIES = {
  marginStart: 'margin-inline-start',
  marginEnd: 'margin-inline-end',
  paddingStart: 'padding-inline-start',
  paddingEnd: 'padding-inline-end',
  borderStart: 'border-inline-start',
  borderEnd: 'border-inline-end',
  insetStart: 'inset-inline-start',
  insetEnd: 'inset-inline-end',
}
