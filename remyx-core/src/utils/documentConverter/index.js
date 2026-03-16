import { getExtension } from './shared.js'
import { cleanPastedHTML } from '../pasteClean.js'

/**
 * Supported document formats with their MIME types and extensions.
 */
const FORMAT_MAP = {
  // DOCX
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  // PDF
  'application/pdf': 'pdf',
  // Markdown
  'text/markdown': 'markdown',
  'text/x-markdown': 'markdown',
  // HTML
  'text/html': 'html',
  // Plain text
  'text/plain': 'text',
  // CSV
  'text/csv': 'csv',
  'application/csv': 'csv',
  // RTF
  'text/rtf': 'rtf',
  'application/rtf': 'rtf',
}

const EXTENSION_MAP = {
  '.docx': 'docx',
  '.pdf': 'pdf',
  '.md': 'markdown',
  '.markdown': 'markdown',
  '.html': 'html',
  '.htm': 'html',
  '.txt': 'text',
  '.csv': 'csv',
  '.tsv': 'csv',
  '.rtf': 'rtf',
}

/**
 * Detect the format of a file by MIME type and extension.
 */
function detectFormat(file) {
  // Try MIME type first
  if (file.type && FORMAT_MAP[file.type]) {
    return FORMAT_MAP[file.type]
  }
  // Fall back to extension
  const ext = getExtension(file.name || '')
  return EXTENSION_MAP[ext] || null
}

/**
 * Check if a file can be converted/imported.
 */
export function isImportableFile(file) {
  return detectFormat(file) !== null
}

/**
 * Get the accept string for file inputs (supported extensions).
 */
export function getSupportedExtensions() {
  return Object.keys(EXTENSION_MAP).join(',')
}

/**
 * Get a human-readable list of supported format names.
 */
export function getSupportedFormatNames() {
  return ['PDF', 'DOCX', 'Markdown', 'HTML', 'TXT', 'CSV', 'TSV', 'RTF']
}

/**
 * Convert a document file to HTML.
 * Each format converter is dynamically imported for tree-shaking.
 *
 * @param {File} file - The file to convert
 * @returns {Promise<string>} The converted HTML content
 * @throws {Error} If the format is unsupported or conversion fails
 */
export async function convertDocument(file) {
  const format = detectFormat(file)

  if (!format) {
    throw new Error(`Unsupported file format: ${file.name}`)
  }

  const converters = {
    docx: () => import('./convertDocx.js'),
    pdf: () => import('./convertPdf.js'),
    markdown: () => import('./convertMarkdown.js'),
    html: () => import('./convertHtml.js'),
    text: () => import('./convertText.js'),
    csv: () => import('./convertCsv.js'),
    rtf: () => import('./convertRtf.js'),
  }

  const mod = await converters[format]()
  const raw = await mod.default(file)
  // Pre-clean imported HTML to strip script/style/object tags
  return typeof raw === 'string' ? cleanPastedHTML(raw) : raw
}
