/** Item 11: Shared block-level tags set used by walkUpToBlock and closestBlock */
const BLOCK_LEVEL_TAGS = new Set(['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'DIV', 'BLOCKQUOTE', 'PRE', 'LI', 'TD', 'TH'])

/**
 * Item 11: Walk up the DOM from `node` to `boundary`, returning the first
 * block-level ancestor element. Shared helper for dom.js and Selection.js.
 * @param {Node} node - Starting node
 * @param {Node} boundary - Stop walking at this element (exclusive)
 * @returns {HTMLElement|null}
 */
export function walkUpToBlock(node, boundary) {
  let el = node.nodeType === Node.TEXT_NODE ? node.parentElement : node
  while (el && el !== boundary) {
    if (BLOCK_LEVEL_TAGS.has(el.tagName)) return el
    el = el.parentElement
  }
  return null
}

export function closestBlock(node, root) {
  return walkUpToBlock(node, root)
}

export function closestTag(node, tagName, root) {
  const tag = tagName.toUpperCase()
  let el = node.nodeType === Node.TEXT_NODE ? node.parentElement : node
  while (el && el !== root) {
    if (el.tagName === tag) return el
    el = el.parentElement
  }
  return null
}

export function wrapInTag(range, tagName, attrs = {}) {
  const el = document.createElement(tagName)
  Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value))
  try {
    range.surroundContents(el)
  } catch {
    const fragment = range.extractContents()
    el.appendChild(fragment)
    range.insertNode(el)
  }
  return el
}

export function unwrapTag(element) {
  const parent = element.parentNode
  while (element.firstChild) {
    parent.insertBefore(element.firstChild, element)
  }
  parent.removeChild(element)
}

/** Length of the random suffix in generated IDs */
const GENERATED_ID_LENGTH = 9

/**
 * Generates a non-cryptographic random ID for internal DOM element tracking.
 * WARNING: Uses Math.random() which is NOT cryptographically secure.
 * Do NOT use these IDs for security tokens, session IDs, or any
 * security-critical purpose. Use crypto.getRandomValues() instead.
 * @returns {string} A prefixed random ID like 'rmx-abc123def'
 */
export function generateId() {
  return 'rmx-' + Math.random().toString(36).slice(2, 2 + GENERATED_ID_LENGTH)
}

export function isBlockEmpty(block) {
  if (!block) return true
  const text = block.textContent.trim()
  return text === '' && !block.querySelector('img, iframe, hr, input')
}
