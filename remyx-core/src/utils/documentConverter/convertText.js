import { readAsText, escapeHtml } from './shared.js'

/**
 * Convert a plain text file to HTML paragraphs.
 */
export default async function convertText(file) {
  const text = await readAsText(file)
  return text
    .split(/\n\n+/)
    .map((para) => {
      const escaped = escapeHtml(para.trim())
      if (!escaped) return ''
      return `<p>${escaped.replace(/\n/g, '<br>')}</p>`
    })
    .filter(Boolean)
    .join('\n')
}
