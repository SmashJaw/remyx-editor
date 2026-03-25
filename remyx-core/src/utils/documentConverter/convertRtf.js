import { readAsText, escapeHtml } from './shared.js'

/**
 * Convert an RTF file to HTML with basic formatting.
 * Strips RTF control words and extracts plain text, wrapping in paragraphs.
 */
export default async function convertRtf(file) {
  const text = await readAsText(file)

  // Remove RTF header/footer
  let content = text
    .replace(/^\{\\rtf[\s\S]*?(?=\\pard|[^\\{])/i, '')
    .replace(/\}$/g, '')

  // Remove font tables, color tables, stylesheet blocks
  content = content.replace(/\{\\fonttbl[\s\S]*?\}/g, '')
  content = content.replace(/\{\\colortbl[\s\S]*?\}/g, '')
  content = content.replace(/\{\\stylesheet[\s\S]*?\}/g, '')
  content = content.replace(/\{\\info[\s\S]*?\}/g, '')

  // Remove remaining group blocks
  content = content.replace(/\{[^{}]*\}/g, '')

  // Convert paragraph markers
  content = content.replace(/\\par\b/g, '\n\n')
  content = content.replace(/\\line\b/g, '\n')

  // Strip all remaining control words
  content = content.replace(/\\[a-z]+\d*\s?/gi, '')
  content = content.replace(/[{}]/g, '')

  // Convert Unicode escapes like \\u8217?
  content = content.replace(/\\u(\d+)\?/g, (_, code) => String.fromCharCode(parseInt(code)))

  // Clean up and wrap in paragraphs
  const paragraphs = content
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)

  if (paragraphs.length === 0) return '<p></p>'
  return paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join('\n')
}
