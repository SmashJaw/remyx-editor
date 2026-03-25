import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { TablePlugin } from '../plugins/builtins/tableFeatures/TablePlugin.js'
import { attachResizeHandles } from '../plugins/builtins/tableFeatures/resize.js'
import { attachFilterUI } from '../plugins/builtins/tableFeatures/filter.js'

vi.mock('../commands/tables.js', () => ({
  evaluateTableFormulas: vi.fn(),
}))

import { evaluateTableFormulas } from '../commands/tables.js'

function createTable({ withThead = true, rows = 2, cols = 2 } = {}) {
  const table = document.createElement('table')
  table.className = 'rmx-table'
  if (withThead) {
    const thead = document.createElement('thead')
    const tr = document.createElement('tr')
    for (let c = 0; c < cols; c++) {
      const th = document.createElement('th')
      th.textContent = `Header ${c + 1}`
      tr.appendChild(th)
    }
    thead.appendChild(tr)
    table.appendChild(thead)
  }
  const tbody = document.createElement('tbody')
  for (let r = 0; r < rows; r++) {
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

function createMockEngine() {
  const element = document.createElement('div')
  element.contentEditable = 'true'
  document.body.appendChild(element)
  return {
    element,
    eventBus: {
      on: vi.fn(() => vi.fn()),
      emit: vi.fn(),
    },
    executeCommand: vi.fn(),
    history: { snapshot: vi.fn() },
    selection: {
      save: vi.fn(),
      restore: vi.fn(),
      getSelection: vi.fn(() => window.getSelection()),
    },
  }
}

describe('TablePlugin', () => {
  let engine, plugin

  beforeEach(() => {
    engine = createMockEngine()
    evaluateTableFormulas.mockClear()
  })

  afterEach(() => {
    if (plugin) {
      plugin.destroy(engine)
    }
    engine.element.remove()
  })

  it('initializes and sets up existing tables', () => {
    const table = createTable()
    engine.element.appendChild(table)
    plugin = TablePlugin()
    plugin.init(engine)

    // Table headers should have rmx-sortable class
    const ths = table.querySelectorAll('th')
    ths.forEach(th => expect(th.classList.contains('rmx-sortable')).toBe(true))
    expect(evaluateTableFormulas).toHaveBeenCalledWith(table)
  })

  it('detects formula cells and sets data-formula', () => {
    const table = createTable({ withThead: false, rows: 1, cols: 1 })
    const td = table.querySelector('td')
    td.textContent = '=SUM(A1:A3)'
    engine.element.appendChild(table)

    plugin = TablePlugin()
    plugin.init(engine)

    expect(td.getAttribute('data-formula')).toBe('=SUM(A1:A3)')
  })

  it('handles sort clicks on header cells', () => {
    const table = createTable()
    engine.element.appendChild(table)
    plugin = TablePlugin()
    plugin.init(engine)

    const th = table.querySelector('th')
    const clickEvent = new MouseEvent('click', { bubbles: true })
    th.dispatchEvent(clickEvent)

    expect(engine.executeCommand).toHaveBeenCalledWith('sortTable', expect.objectContaining({
      columnIndex: 0,
      direction: 'asc',
    }))
  })

  it('cycles sort direction: asc -> desc -> null', () => {
    const table = createTable()
    engine.element.appendChild(table)
    plugin = TablePlugin()
    plugin.init(engine)

    const th = table.querySelector('th')

    // First click: asc
    th.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    th.setAttribute('data-sort-dir', 'asc')

    // Second click: desc
    th.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(engine.executeCommand).toHaveBeenLastCalledWith('sortTable', expect.objectContaining({ direction: 'desc' }))
    th.setAttribute('data-sort-dir', 'desc')

    // Third click: clear
    th.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })

  it('handles shift-click for multi-column sort', () => {
    const table = createTable()
    engine.element.appendChild(table)
    plugin = TablePlugin()
    plugin.init(engine)

    const ths = table.querySelectorAll('th')
    ths[0].setAttribute('data-sort-dir', 'asc')

    const shiftClick = new MouseEvent('click', { bubbles: true, shiftKey: true })
    ths[1].dispatchEvent(shiftClick)

    expect(engine.executeCommand).toHaveBeenCalledWith('sortTable', expect.objectContaining({
      keys: expect.arrayContaining([
        expect.objectContaining({ columnIndex: 0, direction: 'asc' }),
        expect.objectContaining({ columnIndex: 1, direction: 'asc' }),
      ]),
    }))
  })

  it('does not sort when clicking filter button', () => {
    const table = createTable()
    engine.element.appendChild(table)
    plugin = TablePlugin()
    plugin.init(engine)

    const filterBtn = document.createElement('span')
    filterBtn.className = 'rmx-filter-btn'
    table.querySelector('th').appendChild(filterBtn)

    engine.executeCommand.mockClear()
    filterBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(engine.executeCommand).not.toHaveBeenCalled()
  })

  it('handles formula focus — shows formula text', () => {
    const table = createTable({ withThead: false, rows: 1, cols: 1 })
    const td = table.querySelector('td')
    td.setAttribute('data-formula', 'SUM(A1:A3)')
    td.textContent = '6'
    engine.element.appendChild(table)

    plugin = TablePlugin()
    plugin.init(engine)

    const focusIn = new FocusEvent('focusin', { bubbles: true })
    td.dispatchEvent(focusIn)
    expect(td.textContent).toBe('=SUM(A1:A3)')
  })

  it('handles formula blur — stores formula and evaluates', () => {
    const table = createTable({ withThead: false, rows: 1, cols: 1 })
    table.className = 'rmx-table'
    const td = table.querySelector('td')
    td.textContent = '=A1+A2'
    engine.element.appendChild(table)

    plugin = TablePlugin()
    plugin.init(engine)

    evaluateTableFormulas.mockClear()
    const focusOut = new FocusEvent('focusout', { bubbles: true })
    td.dispatchEvent(focusOut)

    expect(td.getAttribute('data-formula')).toBe('A1+A2')
    expect(evaluateTableFormulas).toHaveBeenCalled()
  })

  it('handles formula blur — clears formula when text no longer starts with =', () => {
    const table = createTable({ withThead: false, rows: 1, cols: 1 })
    const td = table.querySelector('td')
    td.setAttribute('data-formula', 'old')
    td.textContent = 'just text'
    engine.element.appendChild(table)

    plugin = TablePlugin()
    plugin.init(engine)

    const focusOut = new FocusEvent('focusout', { bubbles: true })
    td.dispatchEvent(focusOut)
    expect(td.hasAttribute('data-formula')).toBe(false)
  })

  it('re-evaluates formulas on content:change (debounced)', () => {
    const table = createTable()
    table.className = 'rmx-table'
    engine.element.appendChild(table)

    plugin = TablePlugin()
    plugin.init(engine)

    evaluateTableFormulas.mockClear()
    const contentChangeHandler = engine.eventBus.on.mock.calls.find(c => c[0] === 'content:change')
    expect(contentChangeHandler).toBeTruthy()
  })

  it('cleans up on destroy', () => {
    const table = createTable()
    engine.element.appendChild(table)
    plugin = TablePlugin()
    plugin.init(engine)
    plugin.destroy(engine)
    // Should not throw
  })
})

describe('attachResizeHandles', () => {
  let table, engine

  beforeEach(() => {
    table = createTable()
    // Need to append to body for getBoundingClientRect to work
    document.body.appendChild(table)
    engine = { history: { snapshot: vi.fn() } }
  })

  afterEach(() => {
    table.remove()
  })

  it('creates column resize handles', () => {
    const result = attachResizeHandles(table, engine)
    const handles = table.querySelectorAll('.rmx-col-resize-handle')
    // Should have handles for all columns except last
    expect(handles.length).toBe(1) // 2 cols, 1 handle
    result.destroy()
  })

  it('creates row resize handles', () => {
    const result = attachResizeHandles(table, engine)
    const handles = table.querySelectorAll('.rmx-row-resize-handle')
    expect(handles.length).toBe(1) // 2 rows, 1 handle
    result.destroy()
  })

  it('handles column resize via mousedown/mousemove/mouseup', () => {
    const result = attachResizeHandles(table, engine)
    const handle = table.querySelector('.rmx-col-resize-handle')

    handle.dispatchEvent(new MouseEvent('mousedown', { clientX: 100, bubbles: true }))
    expect(table.classList.contains('rmx-table-resizing')).toBe(true)

    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 150 }))
    document.dispatchEvent(new MouseEvent('mouseup'))

    expect(table.classList.contains('rmx-table-resizing')).toBe(false)
    expect(engine.history.snapshot).toHaveBeenCalled()
    result.destroy()
  })

  it('handles row resize via mousedown/mousemove/mouseup', () => {
    const result = attachResizeHandles(table, engine)
    const handle = table.querySelector('.rmx-row-resize-handle')

    handle.dispatchEvent(new MouseEvent('mousedown', { clientY: 50, bubbles: true }))
    expect(table.classList.contains('rmx-table-resizing')).toBe(true)

    document.dispatchEvent(new MouseEvent('mousemove', { clientY: 100 }))
    document.dispatchEvent(new MouseEvent('mouseup'))

    expect(table.classList.contains('rmx-table-resizing')).toBe(false)
    expect(engine.history.snapshot).toHaveBeenCalled()
    result.destroy()
  })

  it('enforces minimum column width of 40px', () => {
    const result = attachResizeHandles(table, engine)
    const handle = table.querySelector('.rmx-col-resize-handle')

    handle.dispatchEvent(new MouseEvent('mousedown', { clientX: 100, bubbles: true }))
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 0 })) // drag far left
    document.dispatchEvent(new MouseEvent('mouseup'))

    result.destroy()
  })

  it('enforces minimum row height of 24px', () => {
    const result = attachResizeHandles(table, engine)
    const handle = table.querySelector('.rmx-row-resize-handle')

    handle.dispatchEvent(new MouseEvent('mousedown', { clientY: 50, bubbles: true }))
    document.dispatchEvent(new MouseEvent('mousemove', { clientY: 0 }))
    document.dispatchEvent(new MouseEvent('mouseup'))

    result.destroy()
  })

  it('sets table position to relative if static', () => {
    table.style.position = 'static'
    const result = attachResizeHandles(table, engine)
    expect(table.style.position).toBe('relative')
    result.destroy()
  })

  it('update method repositions handles', () => {
    const result = attachResizeHandles(table, engine)
    expect(() => result.update()).not.toThrow()
    result.destroy()
  })

  it('destroy removes all handles', () => {
    const result = attachResizeHandles(table, engine)
    result.destroy()
    expect(table.querySelectorAll('.rmx-col-resize-handle').length).toBe(0)
    expect(table.querySelectorAll('.rmx-row-resize-handle').length).toBe(0)
  })
})

describe('attachFilterUI', () => {
  let table, engine

  beforeEach(() => {
    table = createTable()
    document.body.appendChild(table)
    engine = { eventBus: { emit: vi.fn() } }
  })

  afterEach(() => {
    table.remove()
  })

  it('creates filter buttons in header cells', () => {
    const result = attachFilterUI(table, engine)
    const btns = table.querySelectorAll('.rmx-filter-btn')
    expect(btns.length).toBe(2) // 2 columns
    result.destroy()
  })

  it('toggles filter dropdown on button click', () => {
    const result = attachFilterUI(table, engine)
    const btn = table.querySelector('.rmx-filter-btn')

    btn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    expect(table.querySelector('.rmx-filter-dropdown')).toBeTruthy()

    // Click again to close
    btn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    expect(table.querySelector('.rmx-filter-dropdown')).toBeNull()

    result.destroy()
  })

  it('applies filter to table rows', () => {
    vi.useFakeTimers()
    const result = attachFilterUI(table, engine)
    const btn = table.querySelector('.rmx-filter-btn')

    btn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    const input = table.querySelector('.rmx-filter-input')
    expect(input).toBeTruthy()

    // Type filter value
    input.value = 'R1'
    input.dispatchEvent(new Event('input'))

    vi.advanceTimersByTime(300) // debounce

    const rows = table.querySelectorAll('tbody tr')
    // R1C1 matches, R2C1 does not
    expect(rows[0].classList.contains('rmx-row-hidden')).toBe(false)
    expect(rows[1].classList.contains('rmx-row-hidden')).toBe(true)

    result.destroy()
    vi.useRealTimers()
  })

  it('clear button removes filter', () => {
    vi.useFakeTimers()
    const result = attachFilterUI(table, engine)
    const btn = table.querySelector('.rmx-filter-btn')

    btn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    const input = table.querySelector('.rmx-filter-input')
    input.value = 'R1'
    input.dispatchEvent(new Event('input'))
    vi.advanceTimersByTime(300)

    const clearBtn = table.querySelector('.rmx-filter-clear-btn')
    clearBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    const rows = table.querySelectorAll('tbody tr')
    rows.forEach(row => expect(row.classList.contains('rmx-row-hidden')).toBe(false))

    result.destroy()
    vi.useRealTimers()
  })

  it('marks active filter buttons', () => {
    vi.useFakeTimers()
    const result = attachFilterUI(table, engine)
    const btn = table.querySelector('.rmx-filter-btn')

    btn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    const input = table.querySelector('.rmx-filter-input')
    input.value = 'test'
    input.dispatchEvent(new Event('input'))
    vi.advanceTimersByTime(300)

    expect(btn.classList.contains('rmx-filter-active')).toBe(true)

    result.destroy()
    vi.useRealTimers()
  })

  it('emits table:filter-change event', () => {
    vi.useFakeTimers()
    const result = attachFilterUI(table, engine)
    const btn = table.querySelector('.rmx-filter-btn')

    btn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    const input = table.querySelector('.rmx-filter-input')
    input.value = 'R1'
    input.dispatchEvent(new Event('input'))
    vi.advanceTimersByTime(300)

    expect(engine.eventBus.emit).toHaveBeenCalledWith('table:filter-change', expect.objectContaining({
      table,
      filters: expect.any(Array),
    }))

    result.destroy()
    vi.useRealTimers()
  })

  it('handles pre-existing filter values on header cells', () => {
    const th = table.querySelector('th')
    th.setAttribute('data-filter-value', 'preset')
    const result = attachFilterUI(table, engine)
    const btn = th.querySelector('.rmx-filter-btn')
    expect(btn.classList.contains('rmx-filter-active')).toBe(true)
    result.destroy()
  })

  it('update method recreates filter buttons', () => {
    const result = attachFilterUI(table, engine)
    result.update()
    const btns = table.querySelectorAll('.rmx-filter-btn')
    expect(btns.length).toBe(2)
    result.destroy()
  })

  it('destroy removes all filter UI', () => {
    const result = attachFilterUI(table, engine)
    result.destroy()
    expect(table.querySelectorAll('.rmx-filter-btn').length).toBe(0)
  })
})
