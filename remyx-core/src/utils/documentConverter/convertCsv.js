import { readAsText, escapeHtml, getExtension } from './shared.js'

/**
 * Parse CSV text into rows, handling quoted fields.
 */
function parseCsvRows(text, delimiter = ',') {
  const rows = []
  let current = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++ // skip escaped quote
        } else {
          inQuotes = false
        }
      } else {
        field += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === delimiter) {
      current.push(field.trim())
      field = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      current.push(field.trim())
      if (current.some((c) => c !== '')) {
        rows.push(current)
      }
      current = []
      field = ''
    } else {
      field += ch
    }
  }

  // Last field/row
  current.push(field.trim())
  if (current.some((c) => c !== '')) {
    rows.push(current)
  }

  return rows
}

/**
 * Convert a CSV/TSV file to an HTML table.
 */
export default async function convertCsv(file) {
  const text = await readAsText(file)
  const ext = getExtension(file.name || '')
  const delimiter = ext === '.tsv' ? '\t' : ','

  const rows = parseCsvRows(text, delimiter)
  if (rows.length === 0) return '<p></p>'

  const headerRow = rows[0]
  const bodyRows = rows.slice(1)

  let html = '<table>\n<thead>\n<tr>'
  for (const cell of headerRow) {
    html += `<th>${escapeHtml(cell)}</th>`
  }
  html += '</tr>\n</thead>\n<tbody>\n'

  for (const row of bodyRows) {
    html += '<tr>'
    for (let i = 0; i < headerRow.length; i++) {
      html += `<td>${escapeHtml(row[i] || '')}</td>`
    }
    html += '</tr>\n'
  }

  html += '</tbody>\n</table>'
  return html
}
