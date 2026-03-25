import { readAsArrayBuffer, escapeHtml } from './shared.js'

/**
 * Convert a PDF file to HTML using pdfjs-dist (lazy-loaded).
 * Extracts text content from each page and wraps in paragraphs.
 */
export default async function convertPdf(file) {
  const pdfjsLib = await import('pdfjs-dist')

  // Configure worker — use bundled worker or CDN fallback
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    try {
      const workerModule = await import('pdfjs-dist/build/pdf.worker.mjs')
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerModule.default || workerModule
    } catch {
      // Fallback: disable worker (runs on main thread)
      pdfjsLib.GlobalWorkerOptions.workerSrc = ''
    }
  }

  const buffer = await readAsArrayBuffer(file)
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise

  const pages = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()

    // Group text items into lines by Y position
    const lines = []
    let currentLine = []
    let lastY = null

    for (const item of textContent.items) {
      if (item.str === undefined) continue
      const y = Math.round(item.transform[5])

      if (lastY !== null && Math.abs(y - lastY) > 2) {
        if (currentLine.length > 0) {
          lines.push(currentLine.join(''))
        }
        currentLine = []
      }
      currentLine.push(item.str)
      lastY = y
    }
    if (currentLine.length > 0) {
      lines.push(currentLine.join(''))
    }

    // Group consecutive non-empty lines into paragraphs
    const paragraphs = []
    let currentPara = []
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed === '') {
        if (currentPara.length > 0) {
          paragraphs.push(currentPara.join(' '))
          currentPara = []
        }
      } else {
        currentPara.push(trimmed)
      }
    }
    if (currentPara.length > 0) {
      paragraphs.push(currentPara.join(' '))
    }

    if (paragraphs.length > 0) {
      if (pdf.numPages > 1) {
        pages.push(`<h3>Page ${i}</h3>`)
      }
      pages.push(paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join('\n'))
    }
  }

  return pages.join('\n')
}
