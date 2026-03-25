import { createPlugin } from '@remyxjs/core'
import { attachResizeHandles } from './resize.js'
import { attachFilterUI } from './filter.js'
import { evaluateTableFormulas } from '@remyxjs/core'

const FORMULA_DEBOUNCE_MS = 200

/**
 * TablePlugin — Enhanced table features including:
 * - Column/row resize handles
 * - Click-to-sort on header cells (single + multi-column with Shift)
 * - Filter UI on header cells
 * - Formula evaluation (cells starting with '=')
 * - Freeze header row (via CSS sticky, enabled by default for thead)
 *
 * Follows the SyntaxHighlightPlugin pattern: MutationObserver for
 * auto-detection, event-driven lifecycle, createPlugin API.
 */
export function TablePlugin() {
  let observer = null
  let tableMap = new Map() // table element -> { resize, filter } cleanup objects
  let formulaTimer = null
  let sortClickHandler = null
  let formulaFocusHandler = null
  let formulaBlurHandler = null
  let unsubContentChange = null

  function setupTable(table, engine) {
    if (tableMap.has(table)) return
    const entry = {}

    // Resize handles
    entry.resize = attachResizeHandles(table, engine)

    // Filter UI (only if table has thead)
    if (table.querySelector('thead')) {
      entry.filter = attachFilterUI(table, engine)
    }

    // Mark header cells as sortable
    const thead = table.querySelector('thead')
    if (thead) {
      thead.querySelectorAll('th').forEach(th => {
        th.classList.add('rmx-sortable')
      })
    }

    // Detect cells with formula text (starting with =) but no data-formula attribute
    // and convert them to formula cells
    table.querySelectorAll('td, th').forEach(cell => {
      const text = cell.textContent.trim()
      if (text.startsWith('=') && !cell.hasAttribute('data-formula')) {
        cell.setAttribute('data-formula', text)
      }
    })

    // Evaluate any existing formulas
    evaluateTableFormulas(table)

    tableMap.set(table, entry)
  }

  function teardownTable(table) {
    const entry = tableMap.get(table)
    if (!entry) return
    entry.resize?.destroy()
    entry.filter?.destroy()
    tableMap.delete(table)
  }

  function setupAllTables(engine) {
    const tables = engine.element.querySelectorAll('table.rmx-table')
    tables.forEach(table => setupTable(table, engine))
  }

  return createPlugin({
    name: 'tableFeatures',
    requiresFullAccess: true,

    init(engine) {
      // Setup existing tables
      setupAllTables(engine)

      // Watch for new tables or table mutations
      observer = new MutationObserver((mutations) => {
        let needsSetup = false
        for (const mutation of mutations) {
          if (mutation.type === 'childList') {
            for (const node of mutation.addedNodes) {
              if (node.nodeType === Node.ELEMENT_NODE) {
                if (node.matches?.('table.rmx-table') || node.querySelector?.('table.rmx-table')) {
                  needsSetup = true
                  break
                }
              }
            }
            for (const node of mutation.removedNodes) {
              if (node.nodeType === Node.ELEMENT_NODE && node.matches?.('table.rmx-table')) {
                teardownTable(node)
              }
            }
          }
          if (needsSetup) break
        }
        if (needsSetup) {
          setupAllTables(engine)
        }
      })

      observer.observe(engine.element, {
        childList: true,
        subtree: true,
      })

      // Sort click handler (delegated)
      sortClickHandler = (e) => {
        const th = e.target.closest('th')
        if (!th) return
        const thead = th.closest('thead')
        if (!thead) return
        const table = thead.closest('table.rmx-table')
        if (!table || !engine.element.contains(table)) return

        // Don't sort if clicking filter button
        if (e.target.closest('.rmx-filter-btn') || e.target.closest('.rmx-filter-dropdown')) return

        const ths = Array.from(thead.querySelectorAll('th'))
        const columnIndex = ths.indexOf(th)
        if (columnIndex < 0) return

        const currentDir = th.getAttribute('data-sort-dir')
        let newDir
        if (!currentDir) newDir = 'asc'
        else if (currentDir === 'asc') newDir = 'desc'
        else newDir = null // remove sort

        if (e.shiftKey) {
          // Multi-column sort: build keys from existing sorted columns + this one
          const existingKeys = []
          ths.forEach((t, idx) => {
            const dir = t.getAttribute('data-sort-dir')
            if (dir && idx !== columnIndex) {
              existingKeys.push({ columnIndex: idx, direction: dir })
            }
          })
          if (newDir) {
            existingKeys.push({ columnIndex, direction: newDir })
          }
          if (existingKeys.length > 0) {
            engine.executeCommand('sortTable', { keys: existingKeys })
          } else {
            // Clear all sort indicators
            ths.forEach(t => {
              t.removeAttribute('data-sort-dir')
              t.removeAttribute('data-sort-priority')
            })
          }
        } else {
          if (newDir) {
            engine.executeCommand('sortTable', { columnIndex, direction: newDir })
          } else {
            // Clear sort
            ths.forEach(t => {
              t.removeAttribute('data-sort-dir')
              t.removeAttribute('data-sort-priority')
            })
          }
        }
      }
      engine.element.addEventListener('click', sortClickHandler)

      // Formula handlers
      formulaFocusHandler = (e) => {
        const cell = e.target.closest('td, th')
        if (!cell || !engine.element.contains(cell)) return
        const formula = cell.getAttribute('data-formula')
        if (formula) {
          // Show formula text on focus
          cell.textContent = '=' + formula
        }
      }

      formulaBlurHandler = (e) => {
        const cell = e.target.closest('td, th')
        if (!cell || !engine.element.contains(cell)) return
        const text = cell.textContent.trim()

        if (text.startsWith('=') && text.length > 1) {
          // Store formula and evaluate
          const formula = text.slice(1)
          cell.setAttribute('data-formula', formula)
          const table = cell.closest('table.rmx-table')
          if (table) {
            evaluateTableFormulas(table)
          }
        } else if (cell.hasAttribute('data-formula') && !text.startsWith('=')) {
          // User cleared the formula
          cell.removeAttribute('data-formula')
        }
      }

      engine.element.addEventListener('focusin', formulaFocusHandler, true)
      engine.element.addEventListener('focusout', formulaBlurHandler, true)

      // Re-evaluate formulas on content change (debounced)
      unsubContentChange = engine.eventBus.on('content:change', () => {
        clearTimeout(formulaTimer)
        formulaTimer = setTimeout(() => {
          const tables = engine.element.querySelectorAll('table.rmx-table')
          tables.forEach(table => evaluateTableFormulas(table))
        }, FORMULA_DEBOUNCE_MS)
      })
    },

    destroy(engine) {
      clearTimeout(formulaTimer)
      formulaTimer = null

      // Item 4: Remove content:change listener
      unsubContentChange?.()
      unsubContentChange = null

      if (observer) {
        observer.disconnect()
        observer = null
      }

      if (sortClickHandler) {
        engine.element.removeEventListener('click', sortClickHandler)
        sortClickHandler = null
      }

      if (formulaFocusHandler) {
        engine.element.removeEventListener('focusin', formulaFocusHandler, true)
        formulaFocusHandler = null
      }

      if (formulaBlurHandler) {
        engine.element.removeEventListener('focusout', formulaBlurHandler, true)
        formulaBlurHandler = null
      }

      for (const table of tableMap.keys()) {
        teardownTable(table)
      }
      tableMap.clear()
    },
  })
}
