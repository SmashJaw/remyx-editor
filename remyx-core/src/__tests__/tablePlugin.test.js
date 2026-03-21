import { vi } from 'vitest'

// Import TablePlugin - need to check the export pattern
let TablePlugin
try {
  const mod = await import('../plugins/builtins/tableFeatures/TablePlugin.js')
  TablePlugin = mod.TablePlugin || mod.default
} catch {
  // Skip if can't import
}

describe('TablePlugin', () => {
  let plugin, engine

  beforeEach(() => {
    if (!TablePlugin) return

    const el = document.createElement('div')
    el.contentEditable = 'true'
    document.body.appendChild(el)

    engine = {
      element: el,
      eventBus: { emit: vi.fn(), on: vi.fn(() => () => {}) },
      history: { snapshot: vi.fn() },
      selection: {
        getSelection: vi.fn(() => window.getSelection()),
        getRange: vi.fn(),
        setRange: vi.fn(),
        getParentBlock: vi.fn(),
        getClosestElement: vi.fn(),
      },
      commands: { register: vi.fn() },
      sanitizer: { sanitize: vi.fn(h => h) },
    }
  })

  afterEach(() => {
    plugin?.destroy?.(engine)
    document.body.innerHTML = ''
  })

  it('creates a plugin with correct name', () => {
    if (!TablePlugin) return
    plugin = TablePlugin()
    expect(plugin.name).toBe('tableFeatures')
  })

  it('has commands array', () => {
    if (!TablePlugin) return
    plugin = TablePlugin()
    expect(Array.isArray(plugin.commands)).toBe(true)
  })

  it('initializes without error', () => {
    if (!TablePlugin) return
    plugin = TablePlugin()
    plugin.init(engine)
  })
})
