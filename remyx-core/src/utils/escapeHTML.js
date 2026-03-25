/**
 * Escapes HTML special characters in a string to prevent XSS.
 * Shared utility to avoid duplicating the pattern across modules (Task 261).
 * @param {string} str - The string to escape
 * @returns {string} The escaped string
 */
export function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * Escapes HTML special characters including double quotes.
 * Used in contexts where attribute values need escaping.
 * @param {string} str - The string to escape
 * @returns {string} The escaped string
 */
export function escapeHTMLAttr(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
