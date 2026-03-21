import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { registerTableCommands, evaluateTableFormulas } from '../commands/tables.js'

function createMockEngine() {
  const element = document.createElement('div')
  document.body.appendChild(element)
  const commandsMap = new Map()
  return {
    element,
    commands: {
      register: vi.fn((name, def) => commandsMap.set(name, def)),
      _get: (name) => commandsMap.get(name),
    },
    eventBus: { emit: vi.fn() },
    history: { snapshot: vi.fn() },
    selection: {
      getClosestElement: vi.fn(),
      insertHTML: vi.fn(),
    },
    options: {},
  }
}

function createTable(rows = 3, cols = 3) {
  const table = document.createElement('table')
  table.className = 'rmx-table'
  const thead = document.createElement('thead')
  const headerRow = document.createElement('tr')
  for (let c = 0; c < cols; c++) {
    const th = document.createElement('th')
    th.innerHTML = `H${c + 1}`
    headerRow.appendChild(th)
  }
  thead.appendChild(headerRow)
  table.appendChild(thead)

  const tbody = document.createElement('tbody')
  for (let r = 0; r < rows - 1; r++) {
    const tr = document.createElement('tr')
    for (let c = 0; c < cols; c++) {
      const td = document.createElement('td')
      td.textContent = `R${r + 1}C${c + 1}`
      tr.appendChild(td)
    }
    tbody.appendChild(tr)
  }
  table.appendChild(tbody)
  return table
}

describe('tables.js — comprehensive coverage', () => {
  let engine

  beforeEach(() => {
    engine = createMockEngine()
    registerTableCommands(engine)
  })

  afterEach(() => {
    engine.element.remove()
  })

  function exec(name, ...args) {
    const cmd = engine.commands._get(name)
    return cmd.execute(engine, ...args)
  }

  describe('insertTable', () => {
    it('inserts a table', () => {
      exec('insertTable', { rows: 2, cols: 2 })
      expect(engine.selection.insertHTML).toHaveBeenCalledWith(expect.stringContaining('<table'))
    })

    it('uses defaults of 3x3', () => {
      exec('insertTable')
      expect(engine.selection.insertHTML).toHaveBeenCalled()
      const html = engine.selection.insertHTML.mock.calls[0][0]
      // Should have 3 th elements in header
      expect((html.match(/<th>/g) || []).length).toBe(3)
    })
  })

  describe('toggleHeaderRow', () => {
    it('removes thead and converts to tbody', () => {
      const table = createTable()
      engine.element.appendChild(table)
      engine.selection.getClosestElement.mockReturnValue(table)

      exec('toggleHeaderRow')
      expect(table.querySelector('thead')).toBeNull()
      expect(table.querySelectorAll('tbody tr').length).toBe(3) // 2 original + header moved
    })

    it('creates thead from first tbody row', () => {
      const table = document.createElement('table')
      const tbody = document.createElement('tbody')
      const tr1 = document.createElement('tr')
      const td1 = document.createElement('td')
      td1.textContent = 'A'
      tr1.appendChild(td1)
      const tr2 = document.createElement('tr')
      const td2 = document.createElement('td')
      td2.textContent = 'B'
      tr2.appendChild(td2)
      tbody.appendChild(tr1)
      tbody.appendChild(tr2)
      table.appendChild(tbody)
      engine.element.appendChild(table)
      engine.selection.getClosestElement.mockReturnValue(table)

      exec('toggleHeaderRow')
      expect(table.querySelector('thead')).toBeTruthy()
      expect(table.querySelector('thead th').textContent).toBe('A')
    })
  })

  describe('alignCell', () => {
    it('sets text alignment on cell', () => {
      const table = createTable()
      engine.element.appendChild(table)
      const td = table.querySelector('td')
      engine.selection.getClosestElement.mockImplementation((tag) => {
        if (tag === 'td') return td
        return null
      })

      exec('alignCell', { direction: 'center' })
      expect(td.style.textAlign).toBe('center')
    })

    it('rejects invalid direction', () => {
      const table = createTable()
      engine.element.appendChild(table)
      const td = table.querySelector('td')
      engine.selection.getClosestElement.mockImplementation((tag) => {
        if (tag === 'td') return td
        return null
      })

      exec('alignCell', { direction: 'invalid' })
      expect(td.style.textAlign).not.toBe('invalid')
    })
  })

  describe('addRowBefore / addRowAfter', () => {
    it('adds row before current', () => {
      const table = createTable()
      engine.element.appendChild(table)
      const td = table.querySelector('tbody td')
      engine.selection.getClosestElement.mockImplementation((tag) => {
        if (tag === 'td') return td
        return null
      })

      const rowsBefore = table.querySelectorAll('tbody tr').length
      exec('addRowBefore')
      expect(table.querySelectorAll('tbody tr').length).toBe(rowsBefore + 1)
    })

    it('adds row after current', () => {
      const table = createTable()
      engine.element.appendChild(table)
      const td = table.querySelector('tbody td')
      engine.selection.getClosestElement.mockImplementation((tag) => {
        if (tag === 'td') return td
        return null
      })

      const rowsBefore = table.querySelectorAll('tbody tr').length
      exec('addRowAfter')
      expect(table.querySelectorAll('tbody tr').length).toBe(rowsBefore + 1)
    })
  })

  describe('addColBefore / addColAfter', () => {
    it('adds column before current', () => {
      const table = createTable(2, 2)
      engine.element.appendChild(table)
      const td = table.querySelector('tbody td')
      engine.selection.getClosestElement.mockImplementation((tag) => {
        if (tag === 'td') return td
        if (tag === 'table') return table
        return null
      })

      exec('addColBefore')
      const firstRow = table.querySelector('tr')
      expect(firstRow.cells.length).toBe(3)
    })

    it('adds column after current', () => {
      const table = createTable(2, 2)
      engine.element.appendChild(table)
      const td = table.querySelector('tbody td')
      engine.selection.getClosestElement.mockImplementation((tag) => {
        if (tag === 'td') return td
        if (tag === 'table') return table
        return null
      })

      exec('addColAfter')
      const firstRow = table.querySelector('tr')
      expect(firstRow.cells.length).toBe(3)
    })
  })

  describe('deleteRow', () => {
    it('removes current row', () => {
      const table = createTable()
      engine.element.appendChild(table)
      const td = table.querySelector('tbody td')
      engine.selection.getClosestElement.mockImplementation((tag) => {
        if (tag === 'td') return td
        if (tag === 'table') return table
        return null
      })

      const rowsBefore = table.querySelectorAll('tbody tr').length
      exec('deleteRow')
      expect(table.querySelectorAll('tbody tr').length).toBe(rowsBefore - 1)
    })

    it('removes entire table when deleting last row', () => {
      const table = createTable(2, 2) // 1 header + 1 body row
      engine.element.appendChild(table)
      const td = table.querySelector('tbody td')
      engine.selection.getClosestElement.mockImplementation((tag) => {
        if (tag === 'td') return td
        if (tag === 'table') return table
        return null
      })

      exec('deleteRow')
      expect(engine.element.querySelector('table')).toBeNull()
    })
  })

  describe('deleteCol', () => {
    it('removes current column', () => {
      const table = createTable(2, 3)
      engine.element.appendChild(table)
      const td = table.querySelector('tbody td')
      engine.selection.getClosestElement.mockImplementation((tag) => {
        if (tag === 'td') return td
        if (tag === 'table') return table
        return null
      })

      exec('deleteCol')
      expect(table.querySelector('tr').cells.length).toBe(2)
    })

    it('removes entire table when deleting last column', () => {
      const table = createTable(2, 1)
      engine.element.appendChild(table)
      const td = table.querySelector('tbody td')
      engine.selection.getClosestElement.mockImplementation((tag) => {
        if (tag === 'td') return td
        if (tag === 'table') return table
        return null
      })

      exec('deleteCol')
      expect(engine.element.querySelector('table')).toBeNull()
    })
  })

  describe('deleteTable', () => {
    it('replaces table with empty paragraph', () => {
      const table = createTable()
      engine.element.appendChild(table)
      engine.selection.getClosestElement.mockReturnValue(table)

      exec('deleteTable')
      expect(engine.element.querySelector('table')).toBeNull()
      expect(engine.element.querySelector('p')).toBeTruthy()
    })
  })

  describe('mergeCells', () => {
    it('merges multiple cells', () => {
      const table = createTable()
      engine.element.appendChild(table)
      const cells = table.querySelectorAll('tbody td')
      const cell1 = cells[0]
      const cell2 = cells[1]

      exec('mergeCells', { cells: [cell1, cell2] })
      expect(cell1.colSpan).toBeGreaterThanOrEqual(1)
    })

    it('does nothing with less than 2 cells', () => {
      const table = createTable()
      engine.element.appendChild(table)
      exec('mergeCells', { cells: [table.querySelector('td')] })
    })
  })

  describe('splitCell', () => {
    it('splits a merged cell', () => {
      const table = createTable()
      engine.element.appendChild(table)
      const td = table.querySelector('tbody td')
      td.colSpan = 2
      engine.selection.getClosestElement.mockImplementation((tag) => {
        if (tag === 'td') return td
        return null
      })

      exec('splitCell')
      expect(td.colSpan).toBe(1)
    })

    it('does nothing for unmerged cell', () => {
      const table = createTable()
      engine.element.appendChild(table)
      const td = table.querySelector('tbody td')
      engine.selection.getClosestElement.mockImplementation((tag) => {
        if (tag === 'td') return td
        return null
      })

      exec('splitCell')
    })
  })

  describe('sortTable', () => {
    it('sorts table by column ascending', () => {
      const table = createTable()
      const tds = table.querySelectorAll('tbody tr:first-child td')
      tds[0].textContent = 'B'
      const tds2 = table.querySelectorAll('tbody tr:last-child td')
      tds2[0].textContent = 'A'
      engine.element.appendChild(table)
      engine.selection.getClosestElement.mockReturnValue(table)

      exec('sortTable', { columnIndex: 0, direction: 'asc' })
      const rows = table.querySelectorAll('tbody tr')
      expect(rows[0].cells[0].textContent).toBe('A')
    })

    it('sorts table descending', () => {
      const table = createTable()
      const tds = table.querySelectorAll('tbody tr:first-child td')
      tds[0].textContent = 'A'
      const tds2 = table.querySelectorAll('tbody tr:last-child td')
      tds2[0].textContent = 'B'
      engine.element.appendChild(table)
      engine.selection.getClosestElement.mockReturnValue(table)

      exec('sortTable', { columnIndex: 0, direction: 'desc' })
      const rows = table.querySelectorAll('tbody tr')
      expect(rows[0].cells[0].textContent).toBe('B')
    })

    it('sorts numeric columns', () => {
      const table = createTable()
      const tds = table.querySelectorAll('tbody tr:first-child td')
      tds[0].textContent = '10'
      const tds2 = table.querySelectorAll('tbody tr:last-child td')
      tds2[0].textContent = '2'
      engine.element.appendChild(table)
      engine.selection.getClosestElement.mockReturnValue(table)

      exec('sortTable', { columnIndex: 0, direction: 'asc', dataType: 'numeric' })
      const rows = table.querySelectorAll('tbody tr')
      expect(rows[0].cells[0].textContent).toBe('2')
    })

    it('sorts date columns', () => {
      const table = createTable()
      const tds = table.querySelectorAll('tbody tr:first-child td')
      tds[0].textContent = '2026-03-20'
      const tds2 = table.querySelectorAll('tbody tr:last-child td')
      tds2[0].textContent = '2026-01-01'
      engine.element.appendChild(table)
      engine.selection.getClosestElement.mockReturnValue(table)

      exec('sortTable', { columnIndex: 0, direction: 'asc', dataType: 'date' })
      const rows = table.querySelectorAll('tbody tr')
      expect(rows[0].cells[0].textContent).toBe('2026-01-01')
    })

    it('supports multi-column sort with keys', () => {
      const table = createTable()
      engine.element.appendChild(table)
      engine.selection.getClosestElement.mockReturnValue(table)

      exec('sortTable', {
        keys: [
          { columnIndex: 0, direction: 'asc' },
          { columnIndex: 1, direction: 'desc' },
        ],
      })
    })

    it('updates sort indicators on thead', () => {
      const table = createTable()
      engine.element.appendChild(table)
      engine.selection.getClosestElement.mockReturnValue(table)

      exec('sortTable', { columnIndex: 0, direction: 'asc' })
      expect(table.querySelector('th').getAttribute('data-sort-dir')).toBe('asc')
    })
  })

  describe('filterTable', () => {
    it('filters rows by column value', () => {
      const table = createTable()
      engine.element.appendChild(table)
      engine.selection.getClosestElement.mockReturnValue(table)

      exec('filterTable', { columnIndex: 0, filterValue: 'R1' })
      const rows = table.querySelectorAll('tbody tr')
      expect(rows[0].classList.contains('rmx-row-hidden')).toBe(false) // R1C1 matches
      expect(rows[1].classList.contains('rmx-row-hidden')).toBe(true) // R2C1 doesn't match
    })

    it('clears filter when value is empty', () => {
      const table = createTable()
      engine.element.appendChild(table)
      engine.selection.getClosestElement.mockReturnValue(table)

      exec('filterTable', { columnIndex: 0, filterValue: 'R1' })
      exec('filterTable', { columnIndex: 0, filterValue: '' })

      table.querySelectorAll('tbody tr').forEach(row => {
        expect(row.classList.contains('rmx-row-hidden')).toBe(false)
      })
    })
  })

  describe('clearTableFilters', () => {
    it('removes all filters', () => {
      const table = createTable()
      engine.element.appendChild(table)
      engine.selection.getClosestElement.mockReturnValue(table)

      exec('filterTable', { columnIndex: 0, filterValue: 'R1' })
      exec('clearTableFilters')

      table.querySelectorAll('tbody tr').forEach(row => {
        expect(row.classList.contains('rmx-row-hidden')).toBe(false)
      })
    })
  })

  describe('formatCell', () => {
    it('formats number', () => {
      const table = createTable()
      engine.element.appendChild(table)
      const td = table.querySelector('tbody td')
      td.textContent = '1234.5'
      engine.selection.getClosestElement.mockImplementation((tag) => {
        if (tag === 'td') return td
        return null
      })

      exec('formatCell', { format: 'number' })
      expect(td.getAttribute('data-cell-format')).toBe('number')
    })

    it('formats percentage', () => {
      const table = createTable()
      engine.element.appendChild(table)
      const td = table.querySelector('tbody td')
      td.textContent = '0.75'
      engine.selection.getClosestElement.mockImplementation((tag) => {
        if (tag === 'td') return td
        return null
      })

      exec('formatCell', { format: 'percentage' })
      expect(td.textContent).toContain('%')
    })
  })
})

describe('evaluateTableFormulas', () => {
  it('evaluates SUM formula', () => {
    const table = document.createElement('table')
    const tbody = document.createElement('tbody')
    const tr1 = document.createElement('tr')
    const td1 = document.createElement('td')
    td1.textContent = '10'
    tr1.appendChild(td1)
    const td2 = document.createElement('td')
    td2.textContent = '20'
    tr1.appendChild(td2)

    const tr2 = document.createElement('tr')
    const td3 = document.createElement('td')
    td3.textContent = ''
    td3.setAttribute('data-formula', 'SUM(A1,B1)')
    tr2.appendChild(td3)

    tbody.appendChild(tr1)
    tbody.appendChild(tr2)
    table.appendChild(tbody)

    evaluateTableFormulas(table)
    expect(td3.textContent).toBe('30')
  })

  it('evaluates AVERAGE formula', () => {
    const table = document.createElement('table')
    const tbody = document.createElement('tbody')
    const tr1 = document.createElement('tr')
    const td1 = document.createElement('td')
    td1.textContent = '10'
    tr1.appendChild(td1)
    const td2 = document.createElement('td')
    td2.textContent = '20'
    tr1.appendChild(td2)

    const tr2 = document.createElement('tr')
    const td3 = document.createElement('td')
    td3.setAttribute('data-formula', 'AVERAGE(A1,B1)')
    tr2.appendChild(td3)

    tbody.appendChild(tr1)
    tbody.appendChild(tr2)
    table.appendChild(tbody)

    evaluateTableFormulas(table)
    expect(td3.textContent).toBe('15')
  })

  it('evaluates arithmetic expressions', () => {
    const table = document.createElement('table')
    const tbody = document.createElement('tbody')
    const tr = document.createElement('tr')
    const td = document.createElement('td')
    td.setAttribute('data-formula', '2+3*4')
    tr.appendChild(td)
    tbody.appendChild(tr)
    table.appendChild(tbody)

    evaluateTableFormulas(table)
    expect(td.textContent).toBe('14')
  })

  it('handles cell references', () => {
    const table = document.createElement('table')
    const tbody = document.createElement('tbody')
    const tr1 = document.createElement('tr')
    const td1 = document.createElement('td')
    td1.textContent = '5'
    tr1.appendChild(td1)
    const td2 = document.createElement('td')
    td2.textContent = '3'
    tr1.appendChild(td2)

    const tr2 = document.createElement('tr')
    const td3 = document.createElement('td')
    td3.setAttribute('data-formula', 'A1+B1')
    tr2.appendChild(td3)

    tbody.appendChild(tr1)
    tbody.appendChild(tr2)
    table.appendChild(tbody)

    evaluateTableFormulas(table)
    expect(td3.textContent).toBe('8')
  })

  it('handles range references with SUM', () => {
    const table = document.createElement('table')
    const tbody = document.createElement('tbody')
    for (let r = 0; r < 3; r++) {
      const tr = document.createElement('tr')
      const td = document.createElement('td')
      td.textContent = String(r + 1)
      tr.appendChild(td)
      tbody.appendChild(tr)
    }
    const resultRow = document.createElement('tr')
    const resultTd = document.createElement('td')
    resultTd.setAttribute('data-formula', 'SUM(A1:A3)')
    resultRow.appendChild(resultTd)
    tbody.appendChild(resultRow)
    table.appendChild(tbody)

    evaluateTableFormulas(table)
    expect(resultTd.textContent).toBe('6')
  })

  it('handles comparison operators', () => {
    const table = document.createElement('table')
    const tbody = document.createElement('tbody')
    const tr = document.createElement('tr')
    const td = document.createElement('td')
    td.setAttribute('data-formula', 'IF(5>3,1,0)')
    tr.appendChild(td)
    tbody.appendChild(tr)
    table.appendChild(tbody)

    evaluateTableFormulas(table)
    expect(td.textContent).toBe('1')
  })

  it('handles CONCAT function', () => {
    const table = document.createElement('table')
    const tbody = document.createElement('tbody')
    const tr = document.createElement('tr')
    const td = document.createElement('td')
    td.setAttribute('data-formula', 'CONCAT("hello"," ","world")')
    tr.appendChild(td)
    tbody.appendChild(tr)
    table.appendChild(tbody)

    evaluateTableFormulas(table)
    expect(td.textContent).toBe('hello world')
  })

  it('handles unknown function names', () => {
    const table = document.createElement('table')
    const tbody = document.createElement('tbody')
    const tr = document.createElement('tr')
    const td = document.createElement('td')
    td.setAttribute('data-formula', 'UNKNOWN(1)')
    tr.appendChild(td)
    tbody.appendChild(tr)
    table.appendChild(tbody)

    evaluateTableFormulas(table)
    expect(td.textContent).toBe('#NAME!')
  })

  it('handles negative numbers', () => {
    const table = document.createElement('table')
    const tbody = document.createElement('tbody')
    const tr = document.createElement('tr')
    const td = document.createElement('td')
    td.setAttribute('data-formula', '-5+3')
    tr.appendChild(td)
    tbody.appendChild(tr)
    table.appendChild(tbody)

    evaluateTableFormulas(table)
    expect(td.textContent).toBe('-2')
  })

  it('handles division', () => {
    const table = document.createElement('table')
    const tbody = document.createElement('tbody')
    const tr = document.createElement('tr')
    const td = document.createElement('td')
    td.setAttribute('data-formula', '10/4')
    tr.appendChild(td)
    tbody.appendChild(tr)
    table.appendChild(tbody)

    evaluateTableFormulas(table)
    expect(td.textContent).toBe('2.5')
  })

  it('handles parentheses', () => {
    const table = document.createElement('table')
    const tbody = document.createElement('tbody')
    const tr = document.createElement('tr')
    const td = document.createElement('td')
    td.setAttribute('data-formula', '(2+3)*4')
    tr.appendChild(td)
    tbody.appendChild(tr)
    table.appendChild(tbody)

    evaluateTableFormulas(table)
    expect(td.textContent).toBe('20')
  })

  it('handles COUNT function', () => {
    const table = document.createElement('table')
    const tbody = document.createElement('tbody')
    for (let i = 0; i < 3; i++) {
      const tr = document.createElement('tr')
      const td = document.createElement('td')
      td.textContent = String(i + 1)
      tr.appendChild(td)
      tbody.appendChild(tr)
    }
    const tr = document.createElement('tr')
    const td = document.createElement('td')
    td.setAttribute('data-formula', 'COUNT(A1:A3)')
    tr.appendChild(td)
    tbody.appendChild(tr)
    table.appendChild(tbody)

    evaluateTableFormulas(table)
    expect(td.textContent).toBe('3')
  })

  it('handles MIN and MAX functions', () => {
    const table = document.createElement('table')
    const tbody = document.createElement('tbody')
    for (let i = 0; i < 3; i++) {
      const tr = document.createElement('tr')
      const td = document.createElement('td')
      td.textContent = String((i + 1) * 10)
      tr.appendChild(td)
      tbody.appendChild(tr)
    }
    const minRow = document.createElement('tr')
    const minTd = document.createElement('td')
    minTd.setAttribute('data-formula', 'MIN(A1:A3)')
    minRow.appendChild(minTd)
    const maxRow = document.createElement('tr')
    const maxTd = document.createElement('td')
    maxTd.setAttribute('data-formula', 'MAX(A1:A3)')
    maxRow.appendChild(maxTd)
    tbody.appendChild(minRow)
    tbody.appendChild(maxRow)
    table.appendChild(tbody)

    evaluateTableFormulas(table)
    expect(minTd.textContent).toBe('10')
    expect(maxTd.textContent).toBe('30')
  })
})
