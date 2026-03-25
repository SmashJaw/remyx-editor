import { readAsArrayBuffer } from './shared.js'

/**
 * Convert a DOCX file to HTML using mammoth (lazy-loaded).
 */
export default async function convertDocx(file) {
  const mammoth = await import('mammoth')
  const buffer = await readAsArrayBuffer(file)
  const result = await mammoth.convertToHtml({ arrayBuffer: buffer })
  return result.value
}
