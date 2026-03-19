/**
 * Column and row resize handles for tables.
 * Attaches invisible drag handles at column borders and row borders.
 */

const HANDLE_WIDTH = 6

/**
 * Attach resize handles to a table element.
 * Returns a cleanup function.
 */
export function attachResizeHandles(table, engine) {
  const handles = []
  let activeHandle = null
  let startX = 0
  let startY = 0
  let startWidth = 0
  let startHeight = 0
  let targetCol = -1
  let targetRow = null

  function createColumnHandles() {
    removeHandles()
    const thead = table.querySelector('thead')
    const headerRow = thead?.querySelector('tr') || table.querySelector('tr')
    if (!headerRow) return

    const cells = headerRow.querySelectorAll('th, td')
    cells.forEach((cell, idx) => {
      if (idx === cells.length - 1) return // skip last column (resize from left border of next)

      const handle = document.createElement('div')
      handle.className = 'rmx-col-resize-handle'
      handle.setAttribute('data-col-index', String(idx))
      handle.addEventListener('mousedown', onColMouseDown)
      table.appendChild(handle)
      handles.push(handle)
    })

    // Row resize handles
    const rows = table.querySelectorAll('tbody tr')
    rows.forEach((row, idx) => {
      if (idx === rows.length - 1) return
      const handle = document.createElement('div')
      handle.className = 'rmx-row-resize-handle'
      handle.setAttribute('data-row-index', String(idx))
      handle.addEventListener('mousedown', onRowMouseDown)
      table.appendChild(handle)
      handles.push(handle)
    })

    positionHandles()
  }

  function positionHandles() {
    const tableRect = table.getBoundingClientRect()
    const thead = table.querySelector('thead')
    const headerRow = thead?.querySelector('tr') || table.querySelector('tr')
    if (!headerRow) return

    const cells = headerRow.querySelectorAll('th, td')
    handles.forEach(handle => {
      if (handle.classList.contains('rmx-col-resize-handle')) {
        const idx = parseInt(handle.getAttribute('data-col-index'))
        const cell = cells[idx]
        if (!cell) return
        const cellRect = cell.getBoundingClientRect()
        handle.style.position = 'absolute'
        handle.style.top = '0'
        handle.style.left = (cellRect.right - tableRect.left - HANDLE_WIDTH / 2) + 'px'
        handle.style.width = HANDLE_WIDTH + 'px'
        handle.style.height = table.offsetHeight + 'px'
      } else if (handle.classList.contains('rmx-row-resize-handle')) {
        const idx = parseInt(handle.getAttribute('data-row-index'))
        const rows = table.querySelectorAll('tbody tr')
        const row = rows[idx]
        if (!row) return
        const rowRect = row.getBoundingClientRect()
        handle.style.position = 'absolute'
        handle.style.left = '0'
        handle.style.top = (rowRect.bottom - tableRect.top - HANDLE_WIDTH / 2) + 'px'
        handle.style.width = table.offsetWidth + 'px'
        handle.style.height = HANDLE_WIDTH + 'px'
      }
    })
  }

  function onColMouseDown(e) {
    e.preventDefault()
    e.stopPropagation()
    targetCol = parseInt(e.target.getAttribute('data-col-index'))
    const thead = table.querySelector('thead')
    const headerRow = thead?.querySelector('tr') || table.querySelector('tr')
    const cell = headerRow?.querySelectorAll('th, td')[targetCol]
    if (!cell) return
    startX = e.clientX
    startWidth = cell.offsetWidth
    activeHandle = e.target
    table.classList.add('rmx-table-resizing')
    document.addEventListener('mousemove', onColMouseMove)
    document.addEventListener('mouseup', onColMouseUp)
  }

  function onColMouseMove(e) {
    if (targetCol < 0) return
    const delta = e.clientX - startX
    const newWidth = Math.max(40, startWidth + delta)
    // Apply width to all cells in this column
    const rows = table.querySelectorAll('tr')
    rows.forEach(row => {
      const cell = row.cells[targetCol]
      if (cell && cell.colSpan <= 1) {
        cell.style.width = newWidth + 'px'
      }
    })
  }

  function onColMouseUp() {
    document.removeEventListener('mousemove', onColMouseMove)
    document.removeEventListener('mouseup', onColMouseUp)
    table.classList.remove('rmx-table-resizing')
    targetCol = -1
    activeHandle = null
    if (engine?.history) engine.history.snapshot()
    positionHandles()
  }

  function onRowMouseDown(e) {
    e.preventDefault()
    e.stopPropagation()
    const idx = parseInt(e.target.getAttribute('data-row-index'))
    const rows = table.querySelectorAll('tbody tr')
    targetRow = rows[idx]
    if (!targetRow) return
    startY = e.clientY
    startHeight = targetRow.offsetHeight
    table.classList.add('rmx-table-resizing')
    document.addEventListener('mousemove', onRowMouseMove)
    document.addEventListener('mouseup', onRowMouseUp)
  }

  function onRowMouseMove(e) {
    if (!targetRow) return
    const delta = e.clientY - startY
    const newHeight = Math.max(24, startHeight + delta)
    targetRow.style.height = newHeight + 'px'
  }

  function onRowMouseUp() {
    document.removeEventListener('mousemove', onRowMouseMove)
    document.removeEventListener('mouseup', onRowMouseUp)
    table.classList.remove('rmx-table-resizing')
    targetRow = null
    if (engine?.history) engine.history.snapshot()
    positionHandles()
  }

  function removeHandles() {
    handles.forEach(h => h.remove())
    handles.length = 0
  }

  // Make table position relative for absolute handle positioning
  if (getComputedStyle(table).position === 'static') {
    table.style.position = 'relative'
  }

  createColumnHandles()

  return {
    update: positionHandles,
    destroy: () => {
      removeHandles()
      document.removeEventListener('mousemove', onColMouseMove)
      document.removeEventListener('mouseup', onColMouseUp)
      document.removeEventListener('mousemove', onRowMouseMove)
      document.removeEventListener('mouseup', onRowMouseUp)
    },
  }
}
