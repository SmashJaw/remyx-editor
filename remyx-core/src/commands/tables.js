export function registerTableCommands(engine) {
  engine.commands.register('insertTable', {
    execute(eng, { rows = 3, cols = 3 } = {}) {
      let html = '<table class="rmx-table"><thead><tr>'
      for (let c = 0; c < cols; c++) {
        html += '<th><br></th>'
      }
      html += '</tr></thead><tbody>'
      for (let r = 1; r < rows; r++) {
        html += '<tr>'
        for (let c = 0; c < cols; c++) {
          html += '<td><br></td>'
        }
        html += '</tr>'
      }
      html += '</tbody></table><p><br></p>'
      eng.selection.insertHTML(html)
    },
    meta: { icon: 'table', tooltip: 'Insert Table' },
  })

  engine.commands.register('toggleHeaderRow', {
    execute(eng) {
      const table = eng.selection.getClosestElement('table')
      if (!table) return
      const thead = table.querySelector('thead')
      if (thead) {
        // Remove thead — move row to start of tbody, convert th → td
        const headerRow = thead.querySelector('tr')
        if (!headerRow) return
        const newRow = document.createElement('tr')
        for (const th of Array.from(headerRow.cells)) {
          const td = document.createElement('td')
          td.innerHTML = th.innerHTML
          if (th.colSpan > 1) td.colSpan = th.colSpan
          if (th.rowSpan > 1) td.rowSpan = th.rowSpan
          newRow.appendChild(td)
        }
        let tbody = table.querySelector('tbody')
        if (!tbody) {
          tbody = document.createElement('tbody')
          table.appendChild(tbody)
        }
        tbody.insertBefore(newRow, tbody.firstChild)
        thead.remove()
      } else {
        // Create thead from first row of tbody
        let tbody = table.querySelector('tbody')
        if (!tbody) return
        const firstRow = tbody.querySelector('tr')
        if (!firstRow) return
        const newThead = document.createElement('thead')
        const newRow = document.createElement('tr')
        for (const td of Array.from(firstRow.cells)) {
          const th = document.createElement('th')
          th.innerHTML = td.innerHTML
          if (td.colSpan > 1) th.colSpan = td.colSpan
          if (td.rowSpan > 1) th.rowSpan = td.rowSpan
          newRow.appendChild(th)
        }
        newThead.appendChild(newRow)
        table.insertBefore(newThead, table.firstChild)
        firstRow.remove()
      }
    },
    meta: { tooltip: 'Toggle Header Row' },
  })

  engine.commands.register('alignCell', {
    execute(eng, { direction = 'left' } = {}) {
      const td = eng.selection.getClosestElement('td') || eng.selection.getClosestElement('th')
      if (!td) return
      if (!['left', 'center', 'right'].includes(direction)) return
      td.style.textAlign = direction
    },
    meta: { tooltip: 'Align Cell Content' },
  })

  engine.commands.register('addRowBefore', {
    execute(eng) {
      const td = eng.selection.getClosestElement('td') || eng.selection.getClosestElement('th')
      if (!td) return
      const tr = td.parentElement
      const newRow = createEmptyRow(getColumnCount(tr))
      tr.parentElement.insertBefore(newRow, tr)
    },
    meta: { tooltip: 'Insert Row Before' },
  })

  engine.commands.register('addRowAfter', {
    execute(eng) {
      const td = eng.selection.getClosestElement('td') || eng.selection.getClosestElement('th')
      if (!td) return
      const tr = td.parentElement
      const newRow = createEmptyRow(getColumnCount(tr))
      tr.parentElement.insertBefore(newRow, tr.nextSibling)
    },
    meta: { tooltip: 'Insert Row After' },
  })

  engine.commands.register('addColBefore', {
    execute(eng) {
      const td = eng.selection.getClosestElement('td') || eng.selection.getClosestElement('th')
      if (!td) return
      const colIndex = getCellIndex(td)
      const table = eng.selection.getClosestElement('table')
      if (!table) return
      table.querySelectorAll('tr').forEach((row) => {
        const cell = document.createElement(row.parentElement.tagName === 'THEAD' ? 'th' : 'td')
        cell.innerHTML = '<br>'
        const refCell = row.cells[colIndex]
        row.insertBefore(cell, refCell)
      })
    },
    meta: { tooltip: 'Insert Column Before' },
  })

  engine.commands.register('addColAfter', {
    execute(eng) {
      const td = eng.selection.getClosestElement('td') || eng.selection.getClosestElement('th')
      if (!td) return
      const colIndex = getCellIndex(td)
      const table = eng.selection.getClosestElement('table')
      if (!table) return
      table.querySelectorAll('tr').forEach((row) => {
        const cell = document.createElement(row.parentElement.tagName === 'THEAD' ? 'th' : 'td')
        cell.innerHTML = '<br>'
        const refCell = row.cells[colIndex]
        row.insertBefore(cell, refCell ? refCell.nextSibling : null)
      })
    },
    meta: { tooltip: 'Insert Column After' },
  })

  engine.commands.register('deleteRow', {
    execute(eng) {
      const td = eng.selection.getClosestElement('td') || eng.selection.getClosestElement('th')
      if (!td) return
      const tr = td.parentElement
      const tbody = tr.parentElement
      if (tbody.rows.length <= 1) {
        // If last row, remove the entire table
        const table = eng.selection.getClosestElement('table')
        if (table) {
          const p = document.createElement('p')
          p.innerHTML = '<br>'
          table.parentElement.replaceChild(p, table)
        }
      } else {
        tr.remove()
      }
    },
    meta: { tooltip: 'Delete Row' },
  })

  engine.commands.register('deleteCol', {
    execute(eng) {
      const td = eng.selection.getClosestElement('td') || eng.selection.getClosestElement('th')
      if (!td) return
      const colIndex = getCellIndex(td)
      const table = eng.selection.getClosestElement('table')
      if (!table) return

      const firstRow = table.querySelector('tr')
      if (firstRow && firstRow.cells.length <= 1) {
        // If last column, remove the entire table
        const p = document.createElement('p')
        p.innerHTML = '<br>'
        table.parentElement.replaceChild(p, table)
      } else {
        table.querySelectorAll('tr').forEach((row) => {
          if (row.cells[colIndex]) {
            row.cells[colIndex].remove()
          }
        })
      }
    },
    meta: { tooltip: 'Delete Column' },
  })

  engine.commands.register('deleteTable', {
    execute(eng) {
      const table = eng.selection.getClosestElement('table')
      if (!table) return
      const p = document.createElement('p')
      p.innerHTML = '<br>'
      table.parentElement.replaceChild(p, table)
    },
    meta: { tooltip: 'Delete Table' },
  })

  engine.commands.register('mergeCells', {
    execute(eng, { cells }) {
      if (!cells || cells.length < 2) return

      const firstCell = cells[0]
      const rows = new Set()
      const cols = new Set()

      cells.forEach((cell) => {
        rows.add(cell.parentElement.rowIndex)
        cols.add(getCellIndex(cell))
      })

      const rowSpan = rows.size
      const colSpan = cols.size

      // Collect content from all cells, then apply once to avoid repeated innerHTML concat
      const fragments = []
      cells.slice(1).forEach((cell) => {
        if (cell.textContent.trim()) {
          fragments.push(cell.innerHTML)
        }
        cell.remove()
      })
      if (fragments.length > 0) {
        firstCell.innerHTML += '<br>' + fragments.join('<br>')
      }

      if (rowSpan > 1) firstCell.rowSpan = rowSpan
      if (colSpan > 1) firstCell.colSpan = colSpan
    },
    meta: { tooltip: 'Merge Cells' },
  })

  engine.commands.register('sortTable', {
    execute(eng, { columnIndex, direction, dataType, keys, comparator } = {}) {
      const table = eng.selection.getClosestElement('table')
      if (!table) return
      const tbody = table.querySelector('tbody')
      if (!tbody) return
      const rows = Array.from(tbody.querySelectorAll('tr'))
      if (rows.length === 0) return

      // Support multi-column sort via keys array, or single-column via columnIndex/direction
      const sortKeys = keys || [{ columnIndex, direction: direction || 'asc', dataType }]

      // Build sort comparator
      const getCell = (row, idx) => {
        const cells = row.querySelectorAll('td, th')
        return cells[idx]?.textContent?.trim() || ''
      }

      const customComparator = comparator || eng.options?.tableSortComparator

      const chainedCompare = (a, b) => {
        for (const key of sortKeys) {
          const valA = getCell(a, key.columnIndex)
          const valB = getCell(b, key.columnIndex)
          const type = key.dataType || detectSortDataType(rows, key.columnIndex)
          let result = 0

          if (customComparator) {
            result = customComparator(valA, valB, type, key.columnIndex)
          } else if (type === 'numeric') {
            const numA = parseFloat(valA) || 0
            const numB = parseFloat(valB) || 0
            result = numA - numB
          } else if (type === 'date') {
            const dateA = new Date(valA).getTime() || 0
            const dateB = new Date(valB).getTime() || 0
            result = dateA - dateB
          } else {
            result = valA.localeCompare(valB, undefined, { sensitivity: 'base' })
          }

          if (key.direction === 'desc') result = -result
          if (result !== 0) return result
        }
        return 0
      }

      rows.sort(chainedCompare)
      rows.forEach(row => tbody.appendChild(row))

      // Update sort indicators on thead
      const thead = table.querySelector('thead')
      if (thead) {
        const ths = thead.querySelectorAll('th')
        ths.forEach(th => {
          th.removeAttribute('data-sort-dir')
          th.removeAttribute('data-sort-priority')
        })
        sortKeys.forEach((key, idx) => {
          if (ths[key.columnIndex]) {
            ths[key.columnIndex].setAttribute('data-sort-dir', key.direction || 'asc')
            if (sortKeys.length > 1) {
              ths[key.columnIndex].setAttribute('data-sort-priority', String(idx + 1))
            }
          }
        })
      }
    },
    meta: { tooltip: 'Sort Table' },
  })

  engine.commands.register('filterTable', {
    execute(eng, { columnIndex, filterValue } = {}) {
      const table = eng.selection.getClosestElement('table')
      if (!table) return
      const thead = table.querySelector('thead')
      const tbody = table.querySelector('tbody')
      if (!tbody) return

      // Store filter value on the header cell
      if (thead) {
        const ths = thead.querySelectorAll('th')
        if (ths[columnIndex]) {
          if (filterValue) {
            ths[columnIndex].setAttribute('data-filter-value', filterValue)
          } else {
            ths[columnIndex].removeAttribute('data-filter-value')
          }
        }
      }

      // Collect all active filters
      const filters = []
      if (thead) {
        thead.querySelectorAll('th').forEach((th, idx) => {
          const val = th.getAttribute('data-filter-value')
          if (val) filters.push({ columnIndex: idx, value: val.toLowerCase() })
        })
      }

      // Apply filters to rows
      const rows = tbody.querySelectorAll('tr')
      rows.forEach(row => {
        const cells = row.querySelectorAll('td, th')
        const hidden = filters.some(f => {
          const cellText = (cells[f.columnIndex]?.textContent || '').toLowerCase()
          return !cellText.includes(f.value)
        })
        if (hidden) {
          row.classList.add('rmx-row-hidden')
        } else {
          row.classList.remove('rmx-row-hidden')
        }
      })
    },
    meta: { tooltip: 'Filter Table' },
  })

  engine.commands.register('clearTableFilters', {
    execute(eng) {
      const table = eng.selection.getClosestElement('table')
      if (!table) return
      const thead = table.querySelector('thead')
      if (thead) {
        thead.querySelectorAll('th').forEach(th => {
          th.removeAttribute('data-filter-value')
        })
      }
      const tbody = table.querySelector('tbody')
      if (tbody) {
        tbody.querySelectorAll('tr.rmx-row-hidden').forEach(row => {
          row.classList.remove('rmx-row-hidden')
        })
      }
    },
    meta: { tooltip: 'Clear Table Filters' },
  })

  engine.commands.register('formatCell', {
    execute(eng, { format, options = {} } = {}) {
      const td = eng.selection.getClosestElement('td') || eng.selection.getClosestElement('th')
      if (!td || !format) return

      const rawValue = td.getAttribute('data-raw-value') || td.textContent.trim()
      td.setAttribute('data-raw-value', rawValue)
      td.setAttribute('data-cell-format', format)

      const num = parseFloat(rawValue)

      if (format === 'number' && !isNaN(num)) {
        td.textContent = new Intl.NumberFormat(undefined, {
          minimumFractionDigits: options.decimals ?? 2,
          maximumFractionDigits: options.decimals ?? 2,
        }).format(num)
      } else if (format === 'currency' && !isNaN(num)) {
        td.textContent = new Intl.NumberFormat(undefined, {
          style: 'currency',
          currency: options.currency || 'USD',
          minimumFractionDigits: options.decimals ?? 2,
          maximumFractionDigits: options.decimals ?? 2,
        }).format(num)
      } else if (format === 'percentage' && !isNaN(num)) {
        const decimals = options.decimals ?? 1
        td.textContent = (num * 100).toFixed(decimals) + '%'
      } else if (format === 'date') {
        const date = new Date(rawValue)
        if (!isNaN(date.getTime())) {
          td.textContent = new Intl.DateTimeFormat(undefined, {
            dateStyle: options.dateStyle || 'short',
          }).format(date)
        }
      }
    },
    meta: { tooltip: 'Format Cell' },
  })

  engine.commands.register('evaluateFormulas', {
    execute(eng) {
      const table = eng.selection.getClosestElement('table')
      if (!table) return
      evaluateTableFormulas(table)
    },
    meta: { tooltip: 'Evaluate Formulas' },
  })

  engine.commands.register('splitCell', {
    execute(eng) {
      const td = eng.selection.getClosestElement('td') || eng.selection.getClosestElement('th')
      if (!td) return
      const colspan = td.colSpan || 1
      const rowspan = td.rowSpan || 1
      if (colspan <= 1 && rowspan <= 1) return

      td.colSpan = 1
      td.rowSpan = 1

      // Add missing cells in the same row
      const tr = td.parentElement
      const cellTag = tr.closest('thead') ? 'th' : td.tagName.toLowerCase()
      for (let c = 1; c < colspan; c++) {
        const newCell = document.createElement(cellTag)
        newCell.innerHTML = '<br>'
        tr.insertBefore(newCell, td.nextSibling)
      }

      // Add missing cells in subsequent rows
      if (rowspan > 1) {
        // Compute the visual column index once from the original row
        const targetColIndex = getCellIndex(td)
        let currentRow = tr.nextElementSibling
        for (let r = 1; r < rowspan; r++) {
          if (!currentRow) break
          const rowCellTag = currentRow.closest('thead') ? 'th' : 'td'
          // Find the correct insertion point in this row by walking its cells
          let insertRef = null
          let colAccum = 0
          for (const cell of currentRow.cells) {
            if (colAccum >= targetColIndex) {
              insertRef = cell
              break
            }
            colAccum += cell.colSpan || 1
          }
          for (let c = 0; c < colspan; c++) {
            const newCell = document.createElement(rowCellTag)
            newCell.innerHTML = '<br>'
            currentRow.insertBefore(newCell, insertRef)
          }
          currentRow = currentRow.nextElementSibling
        }
      }
    },
    meta: { tooltip: 'Split Cell' },
  })
}

function getColumnCount(tr) {
  let count = 0
  for (const cell of tr.cells) {
    count += cell.colSpan || 1
  }
  return count
}

function getCellIndex(cell) {
  let index = 0
  let prev = cell.previousElementSibling
  while (prev) {
    index += prev.colSpan || 1
    prev = prev.previousElementSibling
  }
  return index
}

function createEmptyRow(colCount) {
  const tr = document.createElement('tr')
  for (let i = 0; i < colCount; i++) {
    const td = document.createElement('td')
    td.innerHTML = '<br>'
    tr.appendChild(td)
  }
  return tr
}

/**
 * Detect the data type of a column by sampling its values.
 */
function detectSortDataType(rows, columnIndex) {
  let numericCount = 0
  let dateCount = 0
  let total = 0

  for (const row of rows) {
    const cells = row.querySelectorAll('td, th')
    const text = (cells[columnIndex]?.textContent || '').trim()
    if (!text) continue
    total++
    if (!isNaN(parseFloat(text)) && isFinite(text)) numericCount++
    else if (!isNaN(new Date(text).getTime()) && text.length > 4) dateCount++
  }

  if (total === 0) return 'alphabetical'
  if (numericCount / total > 0.7) return 'numeric'
  if (dateCount / total > 0.7) return 'date'
  return 'alphabetical'
}

// ── Formula Engine ──

const FORMULA_FUNCTIONS = {
  SUM: (args) => args.flat().reduce((a, b) => a + (parseFloat(b) || 0), 0),
  AVERAGE: (args) => {
    const flat = args.flat().map(v => parseFloat(v)).filter(v => !isNaN(v))
    return flat.length ? flat.reduce((a, b) => a + b, 0) / flat.length : 0
  },
  COUNT: (args) => args.flat().filter(v => v !== '' && v != null).length,
  MIN: (args) => Math.min(...args.flat().map(v => parseFloat(v)).filter(v => !isNaN(v))),
  MAX: (args) => Math.max(...args.flat().map(v => parseFloat(v)).filter(v => !isNaN(v))),
  IF: (args) => args[0] ? args[1] : (args[2] ?? ''),
  CONCAT: (args) => args.flat().join(''),
}

/**
 * Parse a cell reference like "A1" into { col, row } (0-indexed).
 */
function parseCellRef(ref) {
  const match = ref.match(/^([A-Z]+)(\d+)$/)
  if (!match) return null
  let col = 0
  for (let i = 0; i < match[1].length; i++) {
    col = col * 26 + (match[1].charCodeAt(i) - 64)
  }
  return { col: col - 1, row: parseInt(match[2], 10) - 1 }
}

/**
 * Expand a range like "A1:B3" into an array of { col, row } refs.
 */
function expandRange(rangeStr) {
  const parts = rangeStr.split(':')
  if (parts.length !== 2) return null
  const start = parseCellRef(parts[0])
  const end = parseCellRef(parts[1])
  if (!start || !end) return null
  const refs = []
  for (let r = start.row; r <= end.row; r++) {
    for (let c = start.col; c <= end.col; c++) {
      refs.push({ col: c, row: r })
    }
  }
  return refs
}

/**
 * Get cell value from table by col/row indices.
 * Row 0 = first row of thead (if exists) or first row of tbody.
 */
function getTableCellValue(table, col, row) {
  const allRows = table.querySelectorAll('thead tr, tbody tr')
  const tr = allRows[row]
  if (!tr) return ''
  const cells = tr.querySelectorAll('td, th')
  if (!cells[col]) return ''
  // Use raw value if available, otherwise text content
  return cells[col].getAttribute('data-raw-value') || cells[col].textContent.trim()
}

/**
 * Tokenize a formula string into tokens.
 */
function tokenizeFormula(formula) {
  const tokens = []
  let i = 0
  while (i < formula.length) {
    const ch = formula[i]
    if (/\s/.test(ch)) { i++; continue }
    if ('+-*/(),'.includes(ch)) {
      tokens.push({ type: 'op', value: ch })
      i++
      continue
    }
    if (ch === '>' || ch === '<' || ch === '=') {
      if (formula[i + 1] === '=') {
        tokens.push({ type: 'op', value: ch + '=' })
        i += 2
      } else {
        tokens.push({ type: 'op', value: ch })
        i++
      }
      continue
    }
    if (/\d/.test(ch) || (ch === '.' && /\d/.test(formula[i + 1]))) {
      let num = ''
      while (i < formula.length && (/\d/.test(formula[i]) || formula[i] === '.')) {
        num += formula[i++]
      }
      tokens.push({ type: 'number', value: parseFloat(num) })
      continue
    }
    if (ch === '"') {
      let str = ''
      i++
      while (i < formula.length && formula[i] !== '"') str += formula[i++]
      i++ // skip closing quote
      tokens.push({ type: 'string', value: str })
      continue
    }
    if (/[A-Z]/i.test(ch)) {
      let ident = ''
      while (i < formula.length && /[A-Z0-9]/i.test(formula[i])) {
        ident += formula[i++]
      }
      // Check if it's a range (e.g., A1:B3)
      if (formula[i] === ':') {
        i++ // skip colon
        let end = ''
        while (i < formula.length && /[A-Z0-9]/i.test(formula[i])) {
          end += formula[i++]
        }
        tokens.push({ type: 'range', value: ident.toUpperCase() + ':' + end.toUpperCase() })
      } else if (/^[A-Z]+\d+$/i.test(ident)) {
        tokens.push({ type: 'cellref', value: ident.toUpperCase() })
      } else {
        tokens.push({ type: 'func', value: ident.toUpperCase() })
      }
      continue
    }
    i++ // skip unknown
  }
  return tokens
}

/**
 * Recursive-descent parser and evaluator for formulas.
 */
function evaluateFormula(formulaStr, table, evalStack = new Set()) {
  // Strip leading '=' that marks a cell as a formula
  const cleanFormula = formulaStr.startsWith('=') ? formulaStr.slice(1) : formulaStr
  const tokens = tokenizeFormula(cleanFormula)
  let pos = 0

  const peek = () => tokens[pos] || null
  const next = () => tokens[pos++]

  function parseExpression() {
    let left = parseTerm()
    while (peek() && (peek().value === '+' || peek().value === '-')) {
      const op = next().value
      const right = parseTerm()
      left = op === '+' ? left + right : left - right
    }
    return left
  }

  function parseTerm() {
    let left = parseComparison()
    while (peek() && (peek().value === '*' || peek().value === '/')) {
      const op = next().value
      const right = parseComparison()
      left = op === '*' ? left * right : (right !== 0 ? left / right : NaN)
    }
    return left
  }

  function parseComparison() {
    let left = parseFactor()
    if (peek() && ['>', '<', '>=', '<=', '=='].includes(peek().value)) {
      const op = next().value
      const right = parseFactor()
      if (op === '>') return left > right ? 1 : 0
      if (op === '<') return left < right ? 1 : 0
      if (op === '>=') return left >= right ? 1 : 0
      if (op === '<=') return left <= right ? 1 : 0
      if (op === '==') return left === right ? 1 : 0
    }
    return left
  }

  function parseFactor() {
    const token = peek()
    if (!token) return 0

    if (token.type === 'number') {
      next()
      return token.value
    }
    if (token.type === 'string') {
      next()
      return token.value
    }
    if (token.type === 'cellref') {
      next()
      const ref = parseCellRef(token.value)
      if (!ref) return 0
      const cellKey = token.value
      if (evalStack.has(cellKey)) return '#CIRC!'
      evalStack.add(cellKey)
      const raw = getTableCellValue(table, ref.col, ref.row)
      // If the cell itself has a formula, evaluate it
      const allRows = table.querySelectorAll('thead tr, tbody tr')
      const cell = allRows[ref.row]?.querySelectorAll('td, th')[ref.col]
      const cellFormula = cell?.getAttribute('data-formula')
      let val
      if (cellFormula) {
        val = evaluateFormula(cellFormula, table, evalStack)
      } else {
        val = parseFloat(raw)
        if (isNaN(val)) val = raw
      }
      evalStack.delete(cellKey)
      return val
    }
    if (token.type === 'range') {
      next()
      const refs = expandRange(token.value)
      if (!refs) return []
      return refs.map(r => {
        const raw = getTableCellValue(table, r.col, r.row)
        const num = parseFloat(raw)
        return isNaN(num) ? raw : num
      })
    }
    if (token.type === 'func') {
      const funcName = next().value
      const fn = FORMULA_FUNCTIONS[funcName]
      if (!fn) return '#NAME!'
      // Expect '('
      if (peek()?.value === '(') next()
      const args = []
      while (peek() && peek().value !== ')') {
        if (peek().value === ',') { next(); continue }
        const arg = peek()?.type === 'range' ? parseFactor() : parseExpression()
        args.push(arg)
      }
      if (peek()?.value === ')') next()
      return fn(args)
    }
    if (token.value === '(') {
      next()
      const val = parseExpression()
      if (peek()?.value === ')') next()
      return val
    }
    if (token.value === '-') {
      next()
      return -parseFactor()
    }

    next() // skip unknown
    return 0
  }

  return parseExpression()
}

/**
 * Evaluate all formula cells in a table.
 */
export function evaluateTableFormulas(table) {
  const cells = table.querySelectorAll('td[data-formula], th[data-formula]')
  for (const cell of cells) {
    const formula = cell.getAttribute('data-formula')
    if (!formula) continue
    const result = evaluateFormula(formula, table)
    if (typeof result === 'string' && result.startsWith('#')) {
      cell.textContent = result
    } else if (typeof result === 'number') {
      // Round to 10 decimal places to avoid floating point display artifacts
      cell.textContent = String(Math.round(result * 1e10) / 1e10)
    } else {
      cell.textContent = result
    }
  }
}
