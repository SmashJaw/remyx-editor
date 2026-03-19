/**
 * Table column filtering.
 * Injects filter buttons into header cells and manages filter dropdowns.
 */

const FILTER_DEBOUNCE_MS = 200

/**
 * Attach filter UI to a table's header cells.
 * Returns a cleanup function.
 */
export function attachFilterUI(table, engine) {
  const filterBtns = []
  let activeDropdown = null
  let debounceTimer = null

  function createFilterButtons() {
    removeFilterButtons()
    const thead = table.querySelector('thead')
    if (!thead) return

    const ths = thead.querySelectorAll('th')
    ths.forEach((th, idx) => {
      const btn = document.createElement('span')
      btn.className = 'rmx-filter-btn'
      btn.textContent = '\u25BD' // small down triangle
      btn.title = 'Filter column'
      btn.setAttribute('data-col-index', String(idx))
      btn.addEventListener('mousedown', (e) => {
        e.preventDefault()
        e.stopPropagation()
        toggleFilterDropdown(th, idx)
      })
      th.style.position = 'relative'
      th.appendChild(btn)
      filterBtns.push(btn)

      // Mark active filters
      if (th.getAttribute('data-filter-value')) {
        btn.classList.add('rmx-filter-active')
      }
    })
  }

  function toggleFilterDropdown(th, colIndex) {
    if (activeDropdown && activeDropdown.parentElement === th) {
      closeDropdown()
      return
    }
    closeDropdown()

    const dropdown = document.createElement('div')
    dropdown.className = 'rmx-filter-dropdown'
    dropdown.addEventListener('mousedown', e => e.stopPropagation())

    const input = document.createElement('input')
    input.type = 'text'
    input.className = 'rmx-filter-input'
    input.placeholder = 'Filter...'
    input.value = th.getAttribute('data-filter-value') || ''

    input.addEventListener('input', () => {
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        applyFilter(colIndex, input.value)
      }, FILTER_DEBOUNCE_MS)
    })

    const clearBtn = document.createElement('button')
    clearBtn.className = 'rmx-filter-clear-btn'
    clearBtn.textContent = 'Clear'
    clearBtn.type = 'button'
    clearBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      input.value = ''
      applyFilter(colIndex, '')
      closeDropdown()
    })

    dropdown.appendChild(input)
    dropdown.appendChild(clearBtn)
    th.appendChild(dropdown)
    activeDropdown = dropdown

    // Focus the input after appending
    setTimeout(() => input.focus(), 0)

    // Close on click outside
    const closeOnOutsideClick = (e) => {
      if (!dropdown.contains(e.target) && e.target !== th.querySelector('.rmx-filter-btn')) {
        closeDropdown()
        document.removeEventListener('mousedown', closeOnOutsideClick)
      }
    }
    setTimeout(() => document.addEventListener('mousedown', closeOnOutsideClick), 0)
  }

  function applyFilter(columnIndex, filterValue) {
    const thead = table.querySelector('thead')
    const tbody = table.querySelector('tbody')
    if (!tbody) return

    // Store filter value on header
    if (thead) {
      const ths = thead.querySelectorAll('th')
      if (ths[columnIndex]) {
        if (filterValue) {
          ths[columnIndex].setAttribute('data-filter-value', filterValue)
          const btn = ths[columnIndex].querySelector('.rmx-filter-btn')
          if (btn) btn.classList.add('rmx-filter-active')
        } else {
          ths[columnIndex].removeAttribute('data-filter-value')
          const btn = ths[columnIndex].querySelector('.rmx-filter-btn')
          if (btn) btn.classList.remove('rmx-filter-active')
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

    // Apply filters
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

    if (engine?.eventBus) {
      engine.eventBus.emit('table:filter-change', { table, filters })
    }
  }

  function closeDropdown() {
    if (activeDropdown) {
      activeDropdown.remove()
      activeDropdown = null
    }
  }

  function removeFilterButtons() {
    filterBtns.forEach(btn => btn.remove())
    filterBtns.length = 0
    closeDropdown()
  }

  createFilterButtons()

  return {
    update: createFilterButtons,
    destroy: () => {
      clearTimeout(debounceTimer)
      removeFilterButtons()
    },
  }
}
