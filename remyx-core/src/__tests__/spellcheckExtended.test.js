import { vi } from 'vitest'
import { SpellcheckPlugin } from '../plugins/builtins/spellcheckFeatures/index.js'

describe('SpellcheckPlugin - extended coverage', () => {
  let plugin, engine

  beforeEach(() => {
    localStorage.clear()

    const el = document.createElement('div')
    el.contentEditable = 'true'
    el.textContent = 'This is some test content.'
    document.body.appendChild(el)

    engine = {
      element: el,
      eventBus: {
        emit: vi.fn(),
        on: vi.fn(() => () => {}),
      },
      history: { snapshot: vi.fn() },
      selection: {
        getRange: vi.fn(),
        setRange: vi.fn(),
      },
      getText: vi.fn(() => el.textContent),
      commands: { register: vi.fn() },
    }
  })

  afterEach(() => {
    plugin?.destroy()
    document.body.innerHTML = ''
    localStorage.clear()
  })

  it('creates a plugin with correct name', () => {
    plugin = SpellcheckPlugin()
    expect(plugin.name).toBe('spellcheck')
    expect(plugin.requiresFullAccess).toBe(true)
  })

  it('has expected commands', () => {
    plugin = SpellcheckPlugin()
    const names = plugin.commands.map(c => c.name)
    expect(names).toContain('toggleSpellcheck')
    expect(names).toContain('checkGrammar')
    expect(names).toContain('addToDictionary')
    expect(names).toContain('ignoreWord')
    expect(names).toContain('setWritingStyle')
    expect(names).toContain('getSpellcheckStats')
  })

  it('exposes _spellcheck API after init', () => {
    plugin = SpellcheckPlugin()
    plugin.init(engine)
    expect(engine._spellcheck).toBeDefined()
    expect(typeof engine._spellcheck.runCheck).toBe('function')
    expect(typeof engine._spellcheck.addToDictionary).toBe('function')
    expect(typeof engine._spellcheck.getDictionary).toBe('function')
    expect(typeof engine._spellcheck.ignoreWord).toBe('function')
    expect(typeof engine._spellcheck.getIgnoredWords).toBe('function')
    expect(typeof engine._spellcheck.setWritingStyle).toBe('function')
    expect(typeof engine._spellcheck.getWritingStyle).toBe('function')
    expect(typeof engine._spellcheck.setLanguage).toBe('function')
    expect(typeof engine._spellcheck.getLanguage).toBe('function')
    expect(typeof engine._spellcheck.isEnabled).toBe('function')
  })

  it('sets spellcheck attribute on init', () => {
    plugin = SpellcheckPlugin({ enabled: true })
    plugin.init(engine)
    expect(engine.element.getAttribute('spellcheck')).toBe('true')
  })

  it('sets lang attribute on init', () => {
    plugin = SpellcheckPlugin({ language: 'fr-FR' })
    plugin.init(engine)
    expect(engine.element.getAttribute('lang')).toBe('fr-FR')
  })

  it('toggleSpellcheck toggles enabled state', () => {
    plugin = SpellcheckPlugin({ enabled: true })
    plugin.init(engine)
    const cmd = plugin.commands.find(c => c.name === 'toggleSpellcheck')
    const result = cmd.execute(engine)
    expect(result).toBe(false) // was true, now false
    expect(engine.element.getAttribute('spellcheck')).toBe('false')
  })

  it('toggleSpellcheck enables when disabled', () => {
    plugin = SpellcheckPlugin({ enabled: false })
    plugin.init(engine)
    const cmd = plugin.commands.find(c => c.name === 'toggleSpellcheck')
    const result = cmd.execute(engine)
    expect(result).toBe(true)
    expect(engine.element.getAttribute('spellcheck')).toBe('true')
  })

  it('addToDictionary adds word', () => {
    plugin = SpellcheckPlugin({ persistent: false })
    plugin.init(engine)
    engine._spellcheck.addToDictionary('myword')
    expect(engine._spellcheck.getDictionary()).toContain('myword')
  })

  it('addToDictionary lowercases word', () => {
    plugin = SpellcheckPlugin({ persistent: false })
    plugin.init(engine)
    engine._spellcheck.addToDictionary('MyWord')
    expect(engine._spellcheck.getDictionary()).toContain('myword')
  })

  it('addToDictionary ignores empty word', () => {
    plugin = SpellcheckPlugin({ persistent: false })
    plugin.init(engine)
    const before = engine._spellcheck.getDictionary().length
    engine._spellcheck.addToDictionary('')
    expect(engine._spellcheck.getDictionary().length).toBe(before)
  })

  it('removeFromDictionary removes word', () => {
    plugin = SpellcheckPlugin({ persistent: false })
    plugin.init(engine)
    engine._spellcheck.addToDictionary('testword')
    engine._spellcheck.removeFromDictionary('testword')
    expect(engine._spellcheck.getDictionary()).not.toContain('testword')
  })

  it('ignoreWord adds to ignored list', () => {
    plugin = SpellcheckPlugin({ persistent: false })
    plugin.init(engine)
    engine._spellcheck.ignoreWord('ignored')
    expect(engine._spellcheck.getIgnoredWords()).toContain('ignored')
  })

  it('ignoreWord ignores empty word', () => {
    plugin = SpellcheckPlugin({ persistent: false })
    plugin.init(engine)
    engine._spellcheck.ignoreWord('')
    expect(engine._spellcheck.getIgnoredWords()).not.toContain('')
  })

  it('setWritingStyle changes preset', () => {
    plugin = SpellcheckPlugin()
    plugin.init(engine)
    engine._spellcheck.setWritingStyle('casual')
    expect(engine._spellcheck.getWritingStyle()).toBe('casual')
  })

  it('setWritingStyle rejects invalid preset', () => {
    plugin = SpellcheckPlugin()
    plugin.init(engine)
    engine._spellcheck.setWritingStyle('nonexistent')
    expect(engine._spellcheck.getWritingStyle()).toBe('formal')
  })

  it('setLanguage changes language and attribute', () => {
    plugin = SpellcheckPlugin()
    plugin.init(engine)
    engine._spellcheck.setLanguage('de-DE')
    expect(engine._spellcheck.getLanguage()).toBe('de-DE')
    expect(engine.element.getAttribute('lang')).toBe('de-DE')
  })

  it('getStats returns comprehensive stats', () => {
    plugin = SpellcheckPlugin()
    plugin.init(engine)
    const stats = engine._spellcheck.getStats()
    expect(stats).toHaveProperty('total')
    expect(stats).toHaveProperty('enabled')
    expect(stats).toHaveProperty('stylePreset')
    expect(stats).toHaveProperty('language')
    expect(stats).toHaveProperty('dictionarySize')
    expect(stats).toHaveProperty('ignoredCount')
  })

  it('isEnabled returns current state', () => {
    plugin = SpellcheckPlugin({ enabled: true })
    plugin.init(engine)
    expect(engine._spellcheck.isEnabled()).toBe(true)
  })

  it('getErrors returns current errors array', () => {
    plugin = SpellcheckPlugin()
    plugin.init(engine)
    expect(engine._spellcheck.getErrors()).toEqual([])
  })

  it('persistent=true loads dictionary from localStorage', () => {
    localStorage.setItem('rmx-spellcheck-dictionary', JSON.stringify(['customword']))
    plugin = SpellcheckPlugin({ persistent: true })
    plugin.init(engine)
    expect(engine._spellcheck.getDictionary()).toContain('customword')
  })

  it('persistent=true loads ignored from localStorage', () => {
    localStorage.setItem('rmx-spellcheck-ignored', JSON.stringify(['ignoreword']))
    plugin = SpellcheckPlugin({ persistent: true })
    plugin.init(engine)
    expect(engine._spellcheck.getIgnoredWords()).toContain('ignoreword')
  })

  it('handles invalid localStorage data gracefully', () => {
    localStorage.setItem('rmx-spellcheck-dictionary', 'invalid json')
    localStorage.setItem('rmx-spellcheck-ignored', 'also invalid')
    plugin = SpellcheckPlugin({ persistent: true })
    plugin.init(engine)
    // Should not throw, returns defaults
    expect(engine._spellcheck.getDictionary().length).toBe(0)
  })

  it('handles localStorage with non-array data gracefully', () => {
    localStorage.setItem('rmx-spellcheck-dictionary', '"not-an-array"')
    localStorage.setItem('rmx-spellcheck-ignored', '{"obj": true}')
    plugin = SpellcheckPlugin({ persistent: true })
    plugin.init(engine)
    expect(engine._spellcheck.getDictionary().length).toBe(0)
  })

  it('initial dictionary is loaded', () => {
    plugin = SpellcheckPlugin({ dictionary: ['myword1', 'myword2'], persistent: false })
    plugin.init(engine)
    expect(engine._spellcheck.getDictionary()).toContain('myword1')
    expect(engine._spellcheck.getDictionary()).toContain('myword2')
  })

  it('contextMenuItems has check grammar', () => {
    plugin = SpellcheckPlugin()
    expect(plugin.contextMenuItems.length).toBe(1)
    expect(plugin.contextMenuItems[0].command).toBe('checkGrammar')
  })

  it('applyCorrection replaces mark text', () => {
    plugin = SpellcheckPlugin()
    plugin.init(engine)

    const mark = document.createElement('span')
    mark.className = 'rmx-spelling-error'
    mark.textContent = 'wrongword'
    engine.element.appendChild(mark)

    engine._spellcheck.applyCorrection(mark, 'rightword')
    expect(engine.element.textContent).toContain('rightword')
    expect(engine.eventBus.emit).toHaveBeenCalledWith('content:change')
  })

  it('clearMarks removes all error marks', () => {
    plugin = SpellcheckPlugin()
    plugin.init(engine)

    const mark = document.createElement('span')
    mark.className = 'rmx-spelling-error'
    mark.textContent = 'error'
    engine.element.appendChild(mark)

    engine._spellcheck.clearMarks()
    expect(engine.element.querySelector('.rmx-spelling-error')).toBeNull()
  })

  it('setWritingStyle command returns preset', () => {
    plugin = SpellcheckPlugin()
    plugin.init(engine)
    const cmd = plugin.commands.find(c => c.name === 'setWritingStyle')
    const result = cmd.execute(engine, 'academic')
    expect(result).toBe('academic')
  })

  it('getSpellcheckStats command returns stats', () => {
    plugin = SpellcheckPlugin()
    plugin.init(engine)
    const cmd = plugin.commands.find(c => c.name === 'getSpellcheckStats')
    const stats = cmd.execute(engine)
    expect(stats).toHaveProperty('total')
  })

  it('destroy cleans up event listeners', () => {
    plugin = SpellcheckPlugin()
    plugin.init(engine)
    plugin.destroy()
    // Should not throw on subsequent operations
  })
})
