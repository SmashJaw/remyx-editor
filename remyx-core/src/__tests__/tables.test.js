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
        register: jest.fn((name, def) => { commands[name] = def }),
        execute: jest.fn((name, ...args) => commands[name]?.execute(mockEngine, ...args)),
      },
      keyboard: { register: jest.fn() },
      eventBus: { emit: jest.fn(), on: jest.fn() },
      history: { snapshot: jest.fn() },
      selection: {
        getSelection: jest.fn().mockReturnValue(window.getSelection()),
        getRange: jest.fn(),
        save: jest.fn(),
        restore: jest.fn(),
        insertHTML: jest.fn(),
        insertNode: jest.fn(),
        wrapWith: jest.fn(),
        unwrap: jest.fn(),
        getClosestElement: jest.fn(),
      },
      sanitizer: { sanitize: jest.fn(html => html) },
      getHTML: jest.fn().mockReturnValue('<p>test</p>'),
      setHTML: jest.fn(),
      options: { baseHeadingLevel: 0 },
      isMarkdownMode: false,
      isSourceMode: false,
    }

    registerTableCommands(mockEngine)
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should register all 10 table commands', () => {
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
  })

  it('should insert a 3x3 table by default', () => {
    commands.insertTable.execute(mockEngine)
    const html = mockEngine.selection.insertHTML.mock.calls[0][0]
    expect(html).toContain('<table class="rmx-table">')
    expect(html).toContain('<tbody>')
    // Count td elements - should be 9 (3x3)
    const tdCount = (html.match(/<td>/g) || []).length
    expect(tdCount).toBe(9)
  })

  it('should insert table with custom dimensions', () => {
    commands.insertTable.execute(mockEngine, { rows: 2, cols: 4 })
    const html = mockEngine.selection.insertHTML.mock.calls[0][0]
    const tdCount = (html.match(/<td>/g) || []).length
    expect(tdCount).toBe(8) // 2x4
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

  // Helper function
  function createTestTable() {
    const table = document.createElement('table')
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
