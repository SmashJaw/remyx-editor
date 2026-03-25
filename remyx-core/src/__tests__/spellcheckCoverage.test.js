import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { SpellcheckPlugin } from '../plugins/builtins/spellcheckFeatures/SpellcheckPlugin.js'

vi.mock('../plugins/builtins/spellcheckFeatures/GrammarEngine.js', () => ({
  analyzeGrammar: vi.fn(() => []),
  summarizeIssues: vi.fn((errors) => ({ total: errors.length, grammar: 0, style: 0, byRule: {} })),
  STYLE_PRESETS: { formal: {}, casual: {}, technical: {}, academic: {} },
}))

import { analyzeGrammar, summarizeIssues } from '../plugins/builtins/spellcheckFeatures/GrammarEngine.js'

function createMockEngine() {
  const element = document.createElement('div')
  element.contentEditable = 'true'
  document.body.appendChild(element)
  return {
    element,
    eventBus: { on: vi.fn(() => vi.fn()), emit: vi.fn() },
    history: { snapshot: vi.fn() },
    getText: vi.fn(() => element.textContent),
    getHTML: vi.fn(() => element.innerHTML),
  }
}

describe('SpellcheckPlugin — comprehensive coverage', () => {
  let engine, plugin

  beforeEach(() => {
    localStorage.clear()
    engine = createMockEngine()
    analyzeGrammar.mockClear()
    summarizeIssues.mockClear()
    summarizeIssues.mockImplementation((errors) => ({ total: errors.length, grammar: 0, style: 0, byRule: {} }))
  })

  afterEach(() => {
    if (plugin) plugin.destroy(engine)
    engine.element.remove()
  })

  describe('init/destroy', () => {
    it('initializes with spellcheck and language attributes', () => {
      plugin = SpellcheckPlugin()
      plugin.init(engine)
      expect(engine.element.getAttribute('spellcheck')).toBe('true')
      expect(engine.element.getAttribute('lang')).toBe('en-US')
    })

    it('exposes spellcheck API', () => {
      plugin = SpellcheckPlugin()
      plugin.init(engine)
      expect(engine._spellcheck).toBeTruthy()
      expect(typeof engine._spellcheck.runCheck).toBe('function')
      expect(typeof engine._spellcheck.addToDictionary).toBe('function')
      expect(typeof engine._spellcheck.ignoreWord).toBe('function')
      expect(typeof engine._spellcheck.applyCorrection).toBe('function')
    })

    it('cleans up on destroy', () => {
      plugin = SpellcheckPlugin()
      plugin.init(engine)
      plugin.destroy(engine)
    })

    it('initializes disabled when enabled=false', () => {
      plugin = SpellcheckPlugin({ enabled: false })
      plugin.init(engine)
      expect(engine.element.getAttribute('spellcheck')).toBe('false')
    })
  })

  describe('commands — toggleSpellcheck', () => {
    it('toggles spellcheck on/off', () => {
      plugin = SpellcheckPlugin()
      plugin.init(engine)

      const cmd = plugin.commands.find(c => c.name === 'toggleSpellcheck')

      // Toggle off
      const result1 = cmd.execute(engine)
      expect(result1).toBe(false)
      expect(engine.element.getAttribute('spellcheck')).toBe('false')

      // Toggle on
      const result2 = cmd.execute(engine)
      expect(result2).toBe(true)
      expect(engine.element.getAttribute('spellcheck')).toBe('true')
    })
  })

  describe('dictionary management', () => {
    it('adds word to dictionary', () => {
      plugin = SpellcheckPlugin()
      plugin.init(engine)

      engine._spellcheck.addToDictionary('customword')
      expect(engine._spellcheck.getDictionary()).toContain('customword')
      expect(engine.eventBus.emit).toHaveBeenCalledWith('spellcheck:dictionary:add', { word: 'customword' })
    })

    it('removes word from dictionary', () => {
      plugin = SpellcheckPlugin({ dictionary: ['removeMe'] })
      plugin.init(engine)

      engine._spellcheck.removeFromDictionary('removeMe')
      expect(engine._spellcheck.getDictionary()).not.toContain('removeme')
    })

    it('persists dictionary to localStorage', () => {
      plugin = SpellcheckPlugin({ persistent: true })
      plugin.init(engine)

      engine._spellcheck.addToDictionary('persisted')
      const stored = JSON.parse(localStorage.getItem('rmx-spellcheck-dictionary'))
      expect(stored).toContain('persisted')
    })

    it('loads persisted dictionary on init', () => {
      localStorage.setItem('rmx-spellcheck-dictionary', JSON.stringify(['preloaded']))
      plugin = SpellcheckPlugin({ persistent: true })
      plugin.init(engine)

      expect(engine._spellcheck.getDictionary()).toContain('preloaded')
    })

    it('does not add empty word', () => {
      plugin = SpellcheckPlugin()
      plugin.init(engine)
      engine._spellcheck.addToDictionary('')
      engine._spellcheck.addToDictionary(null)
    })
  })

  describe('ignore management', () => {
    it('ignores a word', () => {
      plugin = SpellcheckPlugin()
      plugin.init(engine)

      engine._spellcheck.ignoreWord('skipme')
      expect(engine._spellcheck.getIgnoredWords()).toContain('skipme')
    })

    it('persists ignored words', () => {
      plugin = SpellcheckPlugin({ persistent: true })
      plugin.init(engine)

      engine._spellcheck.ignoreWord('ignored')
      const stored = JSON.parse(localStorage.getItem('rmx-spellcheck-ignored'))
      expect(stored).toContain('ignored')
    })

    it('loads persisted ignored words on init', () => {
      localStorage.setItem('rmx-spellcheck-ignored', JSON.stringify(['preignored']))
      plugin = SpellcheckPlugin({ persistent: true })
      plugin.init(engine)
      expect(engine._spellcheck.getIgnoredWords()).toContain('preignored')
    })

    it('does not ignore empty word', () => {
      plugin = SpellcheckPlugin()
      plugin.init(engine)
      engine._spellcheck.ignoreWord('')
    })
  })

  describe('runCheck', () => {
    it('runs grammar analysis on content', async () => {
      analyzeGrammar.mockReturnValue([
        { offset: 0, length: 4, message: 'test error', suggestions: ['fix'], type: 'grammar' },
      ])

      plugin = SpellcheckPlugin()
      plugin.init(engine)

      engine.element.textContent = 'test content'
      engine.getText.mockReturnValue('test content')

      const errors = await engine._spellcheck.runCheck()
      expect(analyzeGrammar).toHaveBeenCalled()
      expect(errors).toHaveLength(1)
    })

    it('returns empty when disabled', async () => {
      plugin = SpellcheckPlugin({ enabled: false })
      plugin.init(engine)
      const errors = await engine._spellcheck.runCheck()
      expect(errors).toEqual([])
    })

    it('returns empty for blank content', async () => {
      plugin = SpellcheckPlugin()
      plugin.init(engine)
      engine.getText.mockReturnValue('   ')
      const errors = await engine._spellcheck.runCheck()
      expect(errors).toEqual([])
    })

    it('filters out dictionary words', async () => {
      analyzeGrammar.mockReturnValue([
        { offset: 0, length: 6, message: 'unknown', suggestions: [], type: 'spelling' },
      ])
      plugin = SpellcheckPlugin({ dictionary: ['custom'] })
      plugin.init(engine)

      engine.element.textContent = 'custom'
      engine.getText.mockReturnValue('custom')

      const errors = await engine._spellcheck.runCheck()
      expect(errors).toHaveLength(0)
    })

    it('uses custom service when provided', async () => {
      const customService = {
        check: vi.fn().mockResolvedValue([
          { offset: 0, length: 3, message: 'bad', suggestions: ['good'], type: 'grammar' },
        ]),
      }

      plugin = SpellcheckPlugin({ customService, grammarRules: false })
      plugin.init(engine)

      engine.element.textContent = 'bad text'
      engine.getText.mockReturnValue('bad text')

      const errors = await engine._spellcheck.runCheck()
      expect(customService.check).toHaveBeenCalled()
      expect(errors).toHaveLength(1)
    })

    it('handles custom service error gracefully', async () => {
      const customService = {
        check: vi.fn().mockRejectedValue(new Error('service down')),
      }

      plugin = SpellcheckPlugin({ customService, grammarRules: false })
      plugin.init(engine)

      engine.element.textContent = 'test'
      engine.getText.mockReturnValue('test')

      const errors = await engine._spellcheck.runCheck()
      expect(engine.eventBus.emit).toHaveBeenCalledWith('spellcheck:error', expect.any(Object))
    })

    it('calls onError callback', async () => {
      const onError = vi.fn()
      analyzeGrammar.mockReturnValue([
        { offset: 0, length: 4, message: 'err', suggestions: [], type: 'grammar' },
      ])
      plugin = SpellcheckPlugin({ onError })
      plugin.init(engine)

      engine.element.textContent = 'test'
      engine.getText.mockReturnValue('test')

      await engine._spellcheck.runCheck()
      expect(onError).toHaveBeenCalled()
    })
  })

  describe('applyCorrection', () => {
    it('replaces error text with correction', () => {
      const onCorrection = vi.fn()
      plugin = SpellcheckPlugin({ onCorrection })
      plugin.init(engine)

      const mark = document.createElement('span')
      mark.className = 'rmx-spelling-error'
      mark.textContent = 'teh'
      const p = document.createElement('p')
      p.appendChild(mark)
      engine.element.appendChild(p)

      engine._spellcheck.applyCorrection(mark, 'the')
      expect(p.textContent).toBe('the')
      expect(onCorrection).toHaveBeenCalledWith({ original: 'teh', replacement: 'the' })
    })
  })

  describe('writing style management', () => {
    it('sets writing style', () => {
      plugin = SpellcheckPlugin()
      plugin.init(engine)

      engine._spellcheck.setWritingStyle('casual')
      expect(engine._spellcheck.getWritingStyle()).toBe('casual')
    })

    it('ignores invalid style preset', () => {
      plugin = SpellcheckPlugin()
      plugin.init(engine)
      engine._spellcheck.setWritingStyle('nonexistent')
      expect(engine._spellcheck.getWritingStyle()).toBe('formal')
    })
  })

  describe('language management', () => {
    it('sets language', () => {
      plugin = SpellcheckPlugin()
      plugin.init(engine)

      engine._spellcheck.setLanguage('fr-FR')
      expect(engine._spellcheck.getLanguage()).toBe('fr-FR')
      expect(engine.element.getAttribute('lang')).toBe('fr-FR')
    })
  })

  describe('stats', () => {
    it('returns stats object', () => {
      plugin = SpellcheckPlugin()
      plugin.init(engine)

      const stats = engine._spellcheck.getStats()
      expect(stats.enabled).toBe(true)
      expect(stats.stylePreset).toBe('formal')
      expect(stats.language).toBe('en-US')
    })
  })

  describe('context menu', () => {
    it('emits spellcheck:contextmenu on right-click of error mark', () => {
      plugin = SpellcheckPlugin()
      plugin.init(engine)

      const mark = document.createElement('span')
      mark.className = 'rmx-spelling-error'
      mark.setAttribute('data-spellcheck-message', 'Misspelling')
      mark.setAttribute('data-spellcheck-suggestions', '["the"]')
      mark.setAttribute('data-spellcheck-type', 'spelling')
      mark.textContent = 'teh'
      engine.element.appendChild(mark)

      const event = new MouseEvent('contextmenu', { bubbles: true })
      event.preventDefault = vi.fn()
      mark.dispatchEvent(event)

      expect(event.preventDefault).toHaveBeenCalled()
      expect(engine.eventBus.emit).toHaveBeenCalledWith('spellcheck:contextmenu', expect.objectContaining({
        word: 'teh',
        message: 'Misspelling',
        suggestions: ['the'],
        type: 'spelling',
      }))
    })

    it('handles invalid JSON in suggestions attribute', () => {
      plugin = SpellcheckPlugin()
      plugin.init(engine)

      const mark = document.createElement('span')
      mark.className = 'rmx-grammar-error'
      mark.setAttribute('data-spellcheck-message', 'Error')
      mark.setAttribute('data-spellcheck-suggestions', 'invalid json')
      mark.setAttribute('data-spellcheck-type', 'grammar')
      mark.textContent = 'word'
      engine.element.appendChild(mark)

      const event = new MouseEvent('contextmenu', { bubbles: true })
      event.preventDefault = vi.fn()
      mark.dispatchEvent(event)

      expect(engine.eventBus.emit).toHaveBeenCalledWith('spellcheck:contextmenu', expect.objectContaining({
        suggestions: [],
      }))
    })
  })

  describe('commands — addToDictionary', () => {
    it('adds word via command', () => {
      plugin = SpellcheckPlugin()
      plugin.init(engine)
      const cmd = plugin.commands.find(c => c.name === 'addToDictionary')
      cmd.execute(engine, 'myword')
      expect(engine._spellcheck.getDictionary()).toContain('myword')
    })
  })

  describe('commands — ignoreWord', () => {
    it('ignores word via command', () => {
      plugin = SpellcheckPlugin()
      plugin.init(engine)
      const cmd = plugin.commands.find(c => c.name === 'ignoreWord')
      cmd.execute(engine, 'ignorethis')
      expect(engine._spellcheck.getIgnoredWords()).toContain('ignorethis')
    })
  })

  describe('commands — setWritingStyle', () => {
    it('sets style via command', () => {
      plugin = SpellcheckPlugin()
      plugin.init(engine)
      const cmd = plugin.commands.find(c => c.name === 'setWritingStyle')
      cmd.execute(engine, 'academic')
      expect(engine._spellcheck.getWritingStyle()).toBe('academic')
    })
  })

  describe('commands — getSpellcheckStats', () => {
    it('returns stats via command', () => {
      plugin = SpellcheckPlugin()
      plugin.init(engine)
      const cmd = plugin.commands.find(c => c.name === 'getSpellcheckStats')
      const stats = cmd.execute(engine)
      expect(stats.enabled).toBe(true)
    })
  })
})
