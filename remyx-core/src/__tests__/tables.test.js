import { vi } from 'vitest'
import { registerTableCommands } from '../commands/tables.js'

describe('registerTableCommands', () => {
  let commands
  let mockEngine

  beforeEach(() => {
    commands = {}
    const element = document.createElement('div')
    element.setAttribute('contenteditable', 'true')
    document.body.appendChild(element)

    mockEngine = {
      element,
      commands: {
        register: vi.fn((name, def) => { commands[name] = def }),
        execute: vi.fn((name, ...args) => commands[name]?.execute(mockEngine, ...args)),
      },
      keyboard: { register: vi.fn() },
      eventBus: { emit: vi.fn(), on: vi.fn() },
      history: { snapshot: vi.fn() },
      selection: {
        getSelection: vi.fn().mockReturnValue(window.getSelection()),
        getRange: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        insertHTML: vi.fn(),
        insertNode: vi.fn(),
        wrapWith: vi.fn(),
        unwrap: vi.fn(),
        getClosestElement: vi.fn(),
      },
      sanitizer: { sanitize: vi.fn(html => html) },
      getHTML: vi.fn().mockReturnValue('<p>test</p>'),
      setHTML: vi.fn(),
      options: { baseHeadingLevel: 0 },
      isMarkdownMode: false,
      isSourceMode: false,
    }

    registerTableCommands(mockEngine)
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should register all table commands', () => {
    expect(commands.insertTable).toBeDefined()
    expect(commands.addRowBefore).toBeDefined()
    expect(commands.addRowAfter).toBeDefined()
    expect(commands.addColBefore).toBeDefined()
    expect(commands.addColAfter).toBeDefined()
    expect(commands.deleteRow).toBeDefined()
    expect(commands.deleteCol).toBeDefined()
    expect(commands.deleteTable).toBeDefined()
    expect(commands.mergeCells).toBeDefined()
    expect(commands.splitCell).toBeDefined()
    expect(commands.toggleHeaderRow).toBeDefined()
    expect(commands.sortTable).toBeDefined()
    expect(commands.filterTable).toBeDefined()
    expect(commands.clearTableFilters).toBeDefined()
    expect(commands.formatCell).toBeDefined()
    expect(commands.evaluateFormulas).toBeDefined()
  })

  it('should insert a 3x3 table with thead by default', () => {
    commands.insertTable.execute(mockEngine)
    const html = mockEngine.selection.insertHTML.mock.calls[0][0]
    expect(html).toContain('<table class="rmx-table">')
    expect(html).toContain('<thead>')
    expect(html).toContain('<tbody>')
    // Header row has 3 th cells
    const thCount = (html.match(/<th>/g) || []).length
    expect(thCount).toBe(3)
    // Body has 2 rows x 3 cols = 6 td cells
    const tdCount = (html.match(/<td>/g) || []).length
    expect(tdCount).toBe(6)
  })

  it('should insert table with custom dimensions', () => {
    commands.insertTable.execute(mockEngine, { rows: 2, cols: 4 })
    const html = mockEngine.selection.insertHTML.mock.calls[0][0]
    // 1 header row with 4 th + 1 body row with 4 td
    const thCount = (html.match(/<th>/g) || []).length
    expect(thCount).toBe(4)
    const tdCount = (html.match(/<td>/g) || []).length
    expect(tdCount).toBe(4)
  })

  it('should add row before current row', () => {
    const table = createTestTable()
    const td = table.querySelector('td')
    const tbody = table.querySelector('tbody')

    mockEngine.selection.getClosestElement.mockImplementation((tag) => {
      if (tag === 'td') return td
      if (tag === 'table') return table
      return null
    })

    const initialRows = tbody.rows.length
    commands.addRowBefore.execute(mockEngine)
    expect(tbody.rows.length).toBe(initialRows + 1)
    // New row should be the first row
    expect(tbody.rows[0]).not.toBe(td.parentElement)
  })

  it('should add row after current row', () => {
    const table = createTestTable()
    const firstTd = table.querySelector('td')
    const tbody = table.querySelector('tbody')

    mockEngine.selection.getClosestElement.mockImplementation((tag) => {
      if (tag === 'td') return firstTd
      if (tag === 'table') return table
      return null
    })

    const initialRows = tbody.rows.length
    commands.addRowAfter.execute(mockEngine)
    expect(tbody.rows.length).toBe(initialRows + 1)
  })

  it('should add column before current column', () => {
    const table = createTestTable()
    const td = table.querySelector('td')

    mockEngine.selection.getClosestElement.mockImplementation((tag) => {
      if (tag === 'td') return td
      if (tag === 'table') return table
      return null
    })

    const initialCols = table.querySelector('tr').cells.length
    commands.addColBefore.execute(mockEngine)
    expect(table.querySelector('tr').cells.length).toBe(initialCols + 1)
  })

  it('should add column after current column', () => {
    const table = createTestTable()
    const td = table.querySelector('td')

    mockEngine.selection.getClosestElement.mockImplementation((tag) => {
      if (tag === 'td') return td
      if (tag === 'table') return table
      return null
    })

    const initialCols = table.querySelector('tr').cells.length
    commands.addColAfter.execute(mockEngine)
    expect(table.querySelector('tr').cells.length).toBe(initialCols + 1)
  })

  it('should delete a row when more than one row exists', () => {
    const table = createTestTable()
    const td = table.querySelector('td')
    const tbody = table.querySelector('tbody')

    mockEngine.selection.getClosestElement.mockImplementation((tag) => {
      if (tag === 'td') return td
      if (tag === 'table') return table
      return null
    })

    commands.deleteRow.execute(mockEngine)
    expect(tbody.rows.length).toBe(1) // was 2, now 1
  })

  it('should replace table with paragraph when deleting last row', () => {
    const table = document.createElement('table')
    const tbody = document.createElement('tbody')
    const tr = document.createElement('tr')
    const td = document.createElement('td')
    td.innerHTML = '<br>'
    tr.appendChild(td)
    tbody.appendChild(tr)
    table.appendChild(tbody)
    mockEngine.element.appendChild(table)

    mockEngine.selection.getClosestElement.mockImplementation((tag) => {
      if (tag === 'td') return td
      if (tag === 'table') return table
      return null
    })

    commands.deleteRow.execute(mockEngine)
    expect(mockEngine.element.querySelector('table')).toBeNull()
    expect(mockEngine.element.querySelector('p')).not.toBeNull()
  })

  it('should delete a column', () => {
    const table = createTestTable()
    const td = table.querySelector('td')

    mockEngine.selection.getClosestElement.mockImplementation((tag) => {
      if (tag === 'td') return td
      if (tag === 'table') return table
      return null
    })

    commands.deleteCol.execute(mockEngine)
    expect(table.querySelector('tr').cells.length).toBe(1) // was 2, now 1
  })

  it('should delete entire table', () => {
    const table = createTestTable()

    mockEngine.selection.getClosestElement.mockImplementation((tag) => {
      if (tag === 'table') return table
      return null
    })

    commands.deleteTable.execute(mockEngine)
    expect(mockEngine.element.querySelector('table')).toBeNull()
    expect(mockEngine.element.querySelector('p')).not.toBeNull()
  })

  it('should merge cells', () => {
    const table = createTestTable()
    const cells = Array.from(table.querySelectorAll('td'))
    const cell1 = cells[0]
    const cell2 = cells[1]
    cell1.textContent = 'A'
    cell2.textContent = 'B'

    commands.mergeCells.execute(mockEngine, { cells: [cell1, cell2] })
    expect(cell1.innerHTML).toContain('A')
    expect(cell1.innerHTML).toContain('B')
    expect(cell1.colSpan).toBe(2)
  })

  it('should not merge with fewer than 2 cells', () => {
    const td = document.createElement('td')
    td.textContent = 'A'
    commands.mergeCells.execute(mockEngine, { cells: [td] })
    expect(td.colSpan).toBe(1)
  })

  it('should not merge with no cells', () => {
    expect(() => commands.mergeCells.execute(mockEngine, { cells: undefined })).not.toThrow()
  })

  it('should split cell with colspan', () => {
    const table = createTestTable()
    const td = table.querySelector('td')
    td.colSpan = 2

    mockEngine.selection.getClosestElement.mockImplementation((tag) => {
      if (tag === 'td') return td
      return null
    })

    commands.splitCell.execute(mockEngine)
    expect(td.colSpan).toBe(1)
    // Should have added a new cell next to td
    expect(td.parentElement.cells.length).toBe(3) // was 2, +1 from split
  })

  it('should not split cell with no spanning', () => {
    const table = createTestTable()
    const td = table.querySelector('td')

    mockEngine.selection.getClosestElement.mockImplementation((tag) => {
      if (tag === 'td') return td
      return null
    })

    const initialCells = td.parentElement.cells.length
    commands.splitCell.execute(mockEngine)
    expect(td.parentElement.cells.length).toBe(initialCells)
  })

  it('should have correct meta for insertTable', () => {
    expect(commands.insertTable.meta).toEqual({ icon: 'table', tooltip: 'Insert Table' })
  })

  it('should replace table with paragraph when deleting last column', () => {
    const table = document.createElement('table')
    const tbody = document.createElement('tbody')
    for (let r = 0; r < 2; r++) {
      const tr = document.createElement('tr')
      const td = document.createElement('td')
      td.innerHTML = '<br>'
      tr.appendChild(td)
      tbody.appendChild(tr)
    }
    table.appendChild(tbody)
    mockEngine.element.appendChild(table)

    const td = table.querySelector('td')

    mockEngine.selection.getClosestElement.mockImplementation((tag) => {
      if (tag === 'td') return td
      if (tag === 'table') return table
      return null
    })

    commands.deleteCol.execute(mockEngine)
    expect(mockEngine.element.querySelector('table')).toBeNull()
    expect(mockEngine.element.querySelector('p')).not.toBeNull()
  })

  it('should split cell with rowspan > 1 and add cells to subsequent rows', () => {
    // Create a 3x2 table
    const table = document.createElement('table')
    const tbody = document.createElement('tbody')
    for (let r = 0; r < 3; r++) {
      const tr = document.createElement('tr')
      for (let c = 0; c < 2; c++) {
        const td = document.createElement('td')
        td.innerHTML = '<br>'
        tr.appendChild(td)
      }
      tbody.appendChild(tr)
    }
    table.appendChild(tbody)
    mockEngine.element.appendChild(table)

    // Set the first cell to span 3 rows
    const td = tbody.rows[0].cells[0]
    td.rowSpan = 3

    mockEngine.selection.getClosestElement.mockImplementation((tag) => {
      if (tag === 'td') return td
      return null
    })

    commands.splitCell.execute(mockEngine)

    // rowSpan should be reset to 1
    expect(td.rowSpan).toBe(1)
    // Each subsequent row (row 1 and row 2) should have gained 1 new cell
    expect(tbody.rows[1].cells.length).toBe(3)
    expect(tbody.rows[2].cells.length).toBe(3)
  })

  it('should split cell with both colspan and rowspan', () => {
    // Create a 3x3 table
    const table = document.createElement('table')
    const tbody = document.createElement('tbody')
    for (let r = 0; r < 3; r++) {
      const tr = document.createElement('tr')
      for (let c = 0; c < 3; c++) {
        const td = document.createElement('td')
        td.innerHTML = '<br>'
        tr.appendChild(td)
      }
      tbody.appendChild(tr)
    }
    table.appendChild(tbody)
    mockEngine.element.appendChild(table)

    // Set first cell to span 2 cols and 2 rows
    const td = tbody.rows[0].cells[0]
    td.colSpan = 2
    td.rowSpan = 2

    mockEngine.selection.getClosestElement.mockImplementation((tag) => {
      if (tag === 'td') return td
      return null
    })

    commands.splitCell.execute(mockEngine)

    expect(td.colSpan).toBe(1)
    expect(td.rowSpan).toBe(1)
    // Row 0 should have gained 1 cell from colspan split (3 original + 1 = 4)
    expect(tbody.rows[0].cells.length).toBe(4)
    // Row 1 should have gained 2 cells from rowspan split (colspan=2 worth of cells)
    expect(tbody.rows[1].cells.length).toBe(5)
  })

  it('should merge cells where some are empty', () => {
    const table = createTestTable()
    const cells = Array.from(table.querySelectorAll('td'))
    const cell1 = cells[0]
    const cell2 = cells[1]
    cell1.textContent = 'Hello'
    cell2.textContent = '' // empty cell

    commands.mergeCells.execute(mockEngine, { cells: [cell1, cell2] })
    // Empty cell content should not be appended
    expect(cell1.innerHTML).toBe('Hello')
    expect(cell1.colSpan).toBe(2)
  })

  it('should split cell that has rowspan but only one column', () => {
    // Create a 2x1 table
    const table = document.createElement('table')
    const tbody = document.createElement('tbody')
    for (let r = 0; r < 2; r++) {
      const tr = document.createElement('tr')
      const td = document.createElement('td')
      td.innerHTML = '<br>'
      tr.appendChild(td)
      tbody.appendChild(tr)
    }
    table.appendChild(tbody)
    mockEngine.element.appendChild(table)

    const td = tbody.rows[0].cells[0]
    td.rowSpan = 2

    mockEngine.selection.getClosestElement.mockImplementation((tag) => {
      if (tag === 'td') return td
      return null
    })

    commands.splitCell.execute(mockEngine)
    expect(td.rowSpan).toBe(1)
    // Second row should have gained a new cell
    expect(tbody.rows[1].cells.length).toBe(2)
  })

  // ── toggleHeaderRow tests ──

  it('should create thead from first tbody row', () => {
    const table = createTestTable()
    const firstRow = table.querySelector('tbody tr')
    firstRow.cells[0].textContent = 'Header1'
    firstRow.cells[1].textContent = 'Header2'

    mockEngine.selection.getClosestElement.mockImplementation((tag) => {
      if (tag === 'table') return table
      return null
    })

    commands.toggleHeaderRow.execute(mockEngine)

    expect(table.querySelector('thead')).not.toBeNull()
    const ths = table.querySelectorAll('thead th')
    expect(ths.length).toBe(2)
    expect(ths[0].textContent).toBe('Header1')
    expect(ths[1].textContent).toBe('Header2')
    expect(table.querySelector('tbody').rows.length).toBe(1) // one row left in tbody
  })

  it('should remove thead and convert back to tbody', () => {
    const table = createTestTableWithHead()

    mockEngine.selection.getClosestElement.mockImplementation((tag) => {
      if (tag === 'table') return table
      return null
    })

    commands.toggleHeaderRow.execute(mockEngine)

    expect(table.querySelector('thead')).toBeNull()
    expect(table.querySelector('tbody').rows.length).toBe(3) // header row moved back
    expect(table.querySelector('tbody tr td')).not.toBeNull() // converted to td
  })

  // ── sortTable tests ──

  it('should sort table rows alphabetically ascending', () => {
    const table = createTestTableWithHead()
    const tbody = table.querySelector('tbody')
    tbody.rows[0].cells[0].textContent = 'Banana'
    tbody.rows[1].cells[0].textContent = 'Apple'

    mockEngine.selection.getClosestElement.mockImplementation((tag) => {
      if (tag === 'table') return table
      return null
    })

    commands.sortTable.execute(mockEngine, { columnIndex: 0, direction: 'asc' })

    expect(tbody.rows[0].cells[0].textContent).toBe('Apple')
    expect(tbody.rows[1].cells[0].textContent).toBe('Banana')
  })

  it('should sort table rows descending', () => {
    const table = createTestTableWithHead()
    const tbody = table.querySelector('tbody')
    tbody.rows[0].cells[0].textContent = 'Apple'
    tbody.rows[1].cells[0].textContent = 'Banana'

    mockEngine.selection.getClosestElement.mockImplementation((tag) => {
      if (tag === 'table') return table
      return null
    })

    commands.sortTable.execute(mockEngine, { columnIndex: 0, direction: 'desc' })

    expect(tbody.rows[0].cells[0].textContent).toBe('Banana')
    expect(tbody.rows[1].cells[0].textContent).toBe('Apple')
  })

  it('should sort numerically when dataType is numeric', () => {
    const table = createTestTableWithHead()
    const tbody = table.querySelector('tbody')
    tbody.rows[0].cells[0].textContent = '10'
    tbody.rows[1].cells[0].textContent = '2'

    mockEngine.selection.getClosestElement.mockImplementation((tag) => {
      if (tag === 'table') return table
      return null
    })

    commands.sortTable.execute(mockEngine, { columnIndex: 0, direction: 'asc', dataType: 'numeric' })

    expect(tbody.rows[0].cells[0].textContent).toBe('2')
    expect(tbody.rows[1].cells[0].textContent).toBe('10')
  })

  it('should set data-sort-dir attribute on sorted header', () => {
    const table = createTestTableWithHead()

    mockEngine.selection.getClosestElement.mockImplementation((tag) => {
      if (tag === 'table') return table
      return null
    })

    commands.sortTable.execute(mockEngine, { columnIndex: 0, direction: 'asc' })

    const ths = table.querySelectorAll('thead th')
    expect(ths[0].getAttribute('data-sort-dir')).toBe('asc')
    expect(ths[1].getAttribute('data-sort-dir')).toBeNull()
  })

  it('should support multi-column sort via keys', () => {
    const table = createTestTableWithHead()
    const tbody = table.querySelector('tbody')
    tbody.rows[0].cells[0].textContent = 'A'
    tbody.rows[0].cells[1].textContent = '2'
    tbody.rows[1].cells[0].textContent = 'A'
    tbody.rows[1].cells[1].textContent = '1'

    mockEngine.selection.getClosestElement.mockImplementation((tag) => {
      if (tag === 'table') return table
      return null
    })

    commands.sortTable.execute(mockEngine, {
      keys: [
        { columnIndex: 0, direction: 'asc' },
        { columnIndex: 1, direction: 'asc', dataType: 'numeric' },
      ],
    })

    // Both rows have 'A' in col 0, so sorted by col 1 numerically
    expect(tbody.rows[0].cells[1].textContent).toBe('1')
    expect(tbody.rows[1].cells[1].textContent).toBe('2')
  })

  // ── filterTable tests ──

  it('should hide rows that do not match filter', () => {
    const table = createTestTableWithHead()
    const tbody = table.querySelector('tbody')
    tbody.rows[0].cells[0].textContent = 'Apple'
    tbody.rows[1].cells[0].textContent = 'Banana'

    mockEngine.selection.getClosestElement.mockImplementation((tag) => {
      if (tag === 'table') return table
      return null
    })

    commands.filterTable.execute(mockEngine, { columnIndex: 0, filterValue: 'Apple' })

    expect(tbody.rows[0].classList.contains('rmx-row-hidden')).toBe(false)
    expect(tbody.rows[1].classList.contains('rmx-row-hidden')).toBe(true)
  })

  it('should clear all filters', () => {
    const table = createTestTableWithHead()
    const tbody = table.querySelector('tbody')
    tbody.rows[0].cells[0].textContent = 'Apple'
    tbody.rows[1].cells[0].textContent = 'Banana'
    tbody.rows[1].classList.add('rmx-row-hidden')

    const ths = table.querySelectorAll('thead th')
    ths[0].setAttribute('data-filter-value', 'Apple')

    mockEngine.selection.getClosestElement.mockImplementation((tag) => {
      if (tag === 'table') return table
      return null
    })

    commands.clearTableFilters.execute(mockEngine)

    expect(ths[0].getAttribute('data-filter-value')).toBeNull()
    expect(tbody.rows[1].classList.contains('rmx-row-hidden')).toBe(false)
  })

  // ── formatCell tests ──

  it('should format cell as number', () => {
    const table = createTestTable()
    const td = table.querySelector('td')
    td.textContent = '1234.5'

    mockEngine.selection.getClosestElement.mockImplementation((tag) => {
      if (tag === 'td') return td
      return null
    })

    commands.formatCell.execute(mockEngine, { format: 'number' })

    expect(td.getAttribute('data-cell-format')).toBe('number')
    expect(td.getAttribute('data-raw-value')).toBe('1234.5')
    // Formatted output should contain the number (locale-dependent)
    expect(td.textContent).toContain('1')
  })

  it('should format cell as percentage', () => {
    const table = createTestTable()
    const td = table.querySelector('td')
    td.textContent = '0.75'

    mockEngine.selection.getClosestElement.mockImplementation((tag) => {
      if (tag === 'td') return td
      return null
    })

    commands.formatCell.execute(mockEngine, { format: 'percentage' })

    expect(td.getAttribute('data-cell-format')).toBe('percentage')
    expect(td.textContent).toBe('75.0%')
  })

  // ── evaluateFormulas tests ──

  it('should evaluate SUM formula', () => {
    const table = createTestTableWithHead()
    const tbody = table.querySelector('tbody')
    tbody.rows[0].cells[0].textContent = '10'
    tbody.rows[1].cells[0].textContent = '20'

    // Add a third row with a formula
    const tr = document.createElement('tr')
    const td = document.createElement('td')
    td.setAttribute('data-formula', 'SUM(A2:A3)')
    td.textContent = ''
    tr.appendChild(td)
    const td2 = document.createElement('td')
    td2.innerHTML = '<br>'
    tr.appendChild(td2)
    tbody.appendChild(tr)

    mockEngine.selection.getClosestElement.mockImplementation((tag) => {
      if (tag === 'table') return table
      return null
    })

    commands.evaluateFormulas.execute(mockEngine)

    expect(td.textContent).toBe('30')
  })

  it('should evaluate AVERAGE formula', () => {
    const table = createTestTableWithHead()
    const tbody = table.querySelector('tbody')
    tbody.rows[0].cells[0].textContent = '10'
    tbody.rows[1].cells[0].textContent = '20'

    const tr = document.createElement('tr')
    const td = document.createElement('td')
    td.setAttribute('data-formula', 'AVERAGE(A2:A3)')
    tr.appendChild(td)
    const td2 = document.createElement('td')
    td2.innerHTML = '<br>'
    tr.appendChild(td2)
    tbody.appendChild(tr)

    mockEngine.selection.getClosestElement.mockImplementation((tag) => {
      if (tag === 'table') return table
      return null
    })

    commands.evaluateFormulas.execute(mockEngine)

    expect(td.textContent).toBe('15')
  })

  it('should evaluate cell reference arithmetic', () => {
    const table = createTestTableWithHead()
    const tbody = table.querySelector('tbody')
    tbody.rows[0].cells[0].textContent = '5'
    tbody.rows[0].cells[1].textContent = '3'

    const tr = document.createElement('tr')
    const td = document.createElement('td')
    td.setAttribute('data-formula', 'A2+B2')
    tr.appendChild(td)
    const td2 = document.createElement('td')
    td2.innerHTML = '<br>'
    tr.appendChild(td2)
    tbody.appendChild(tr)

    mockEngine.selection.getClosestElement.mockImplementation((tag) => {
      if (tag === 'table') return table
      return null
    })

    commands.evaluateFormulas.execute(mockEngine)

    expect(td.textContent).toBe('8')
  })

  it('should handle MIN and MAX formulas', () => {
    const table = createTestTableWithHead()
    const tbody = table.querySelector('tbody')
    tbody.rows[0].cells[0].textContent = '5'
    tbody.rows[1].cells[0].textContent = '15'

    const tr = document.createElement('tr')
    const tdMin = document.createElement('td')
    tdMin.setAttribute('data-formula', 'MIN(A2:A3)')
    tr.appendChild(tdMin)
    const tdMax = document.createElement('td')
    tdMax.setAttribute('data-formula', 'MAX(A2:A3)')
    tr.appendChild(tdMax)
    tbody.appendChild(tr)

    mockEngine.selection.getClosestElement.mockImplementation((tag) => {
      if (tag === 'table') return table
      return null
    })

    commands.evaluateFormulas.execute(mockEngine)

    expect(tdMin.textContent).toBe('5')
    expect(tdMax.textContent).toBe('15')
  })

  // Helper functions
  function createTestTable() {
    const table = document.createElement('table')
    table.className = 'rmx-table'
    const tbody = document.createElement('tbody')
    for (let r = 0; r < 2; r++) {
      const tr = document.createElement('tr')
      for (let c = 0; c < 2; c++) {
        const td = document.createElement('td')
        td.innerHTML = '<br>'
        tr.appendChild(td)
      }
      tbody.appendChild(tr)
    }
    table.appendChild(tbody)
    mockEngine.element.appendChild(table)
    return table
  }

  function createTestTableWithHead() {
    const table = document.createElement('table')
    table.className = 'rmx-table'
    const thead = document.createElement('thead')
    const headerRow = document.createElement('tr')
    for (let c = 0; c < 2; c++) {
      const th = document.createElement('th')
      th.textContent = 'Col' + (c + 1)
      headerRow.appendChild(th)
    }
    thead.appendChild(headerRow)
    table.appendChild(thead)

    const tbody = document.createElement('tbody')
    for (let r = 0; r < 2; r++) {
      const tr = document.createElement('tr')
      for (let c = 0; c < 2; c++) {
        const td = document.createElement('td')
        td.innerHTML = '<br>'
        tr.appendChild(td)
      }
      tbody.appendChild(tr)
    }
    table.appendChild(tbody)
    mockEngine.element.appendChild(table)
    return table
  }
})
