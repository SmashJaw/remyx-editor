import { htmlToMarkdown } from './markdownConverter.js'
import { Sanitizer } from '../core/Sanitizer.js'

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function exportAsMarkdown(html, filename = 'document.md') {
  const md = htmlToMarkdown(html)
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
  triggerDownload(blob, filename)
}

export function exportAsPDF(html, title = 'Document') {
  const iframe = document.createElement('iframe')
  iframe.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:0;height:0;'
  document.body.appendChild(iframe)

  // Re-sanitize HTML and escape title to prevent XSS in export iframe
  const sanitizer = new Sanitizer()
  const safeHtml = sanitizer.sanitize(html)
  const safeTitle = title.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

  const doc = iframe.contentDocument || iframe.contentWindow.document
  doc.open()
  doc.write(`<!DOCTYPE html>
<html>
<head>
  <title>${safeTitle}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1, h2, h3, h4, h5, h6 { margin-top: 1.2em; margin-bottom: 0.4em; }
    img { max-width: 100%; height: auto; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
    pre { background: #f5f5f5; padding: 12px; border-radius: 4px; overflow-x: auto; }
    code { font-family: 'SFMono-Regular', Consolas, monospace; font-size: 0.9em; }
    blockquote { border-left: 3px solid #ccc; margin-left: 0; padding-left: 16px; color: #555; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>${safeHtml}</body>
</html>`)
  doc.close()

  iframe.contentWindow.onafterprint = () => {
    document.body.removeChild(iframe)
  }

  // Fallback cleanup if onafterprint doesn't fire
  const fallback = setTimeout(() => {
    if (iframe.parentNode) document.body.removeChild(iframe)
  }, 60000)

  iframe.onload = () => {
    iframe.contentWindow.focus()
    iframe.contentWindow.print()
    clearTimeout(fallback)
    // Re-set fallback after print
    setTimeout(() => {
      if (iframe.parentNode) document.body.removeChild(iframe)
    }, 1000)
  }
}

export function exportAsDocx(html, filename = 'document.doc') {
  const wordHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><style>
body { font-family: Calibri, sans-serif; line-height: 1.5; color: #1a1a1a; }
h1, h2, h3, h4, h5, h6 { margin-top: 1em; margin-bottom: 0.4em; }
table { border-collapse: collapse; width: 100%; }
th, td { border: 1px solid #999; padding: 6px 10px; }
pre { background: #f5f5f5; padding: 10px; font-family: Consolas, monospace; font-size: 0.9em; }
code { font-family: Consolas, monospace; font-size: 0.9em; }
blockquote { border-left: 3px solid #ccc; margin-left: 0; padding-left: 14px; color: #555; }
img { max-width: 100%; }
</style></head>
<body>${html}</body></html>`
  const blob = new Blob(['\ufeff', wordHtml], { type: 'application/msword' })
  triggerDownload(blob, filename)
}
