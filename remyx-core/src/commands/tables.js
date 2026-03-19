export function registerTableCommands(engine) {
  engine.commands.register('insertTable', {
    execute(eng, { rows = 3, cols = 3 } = {}) {
      let html = '<table class="rmx-table"><tbody>'
      for (let r = 0; r < rows; r++) {
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
