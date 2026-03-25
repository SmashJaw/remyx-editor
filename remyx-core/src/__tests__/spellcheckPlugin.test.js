/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest'
import {
  analyzeGrammar,
  summarizeIssues,
  detectPassiveVoice,
  detectWordiness,
  detectCliches,
  detectPunctuationIssues,
  STYLE_PRESETS,
  SpellcheckPlugin,
} from '../plugins/builtins/spellcheckFeatures/index.js'

// ---------------------------------------------------------------------------
// GrammarEngine — detectPassiveVoice
// ---------------------------------------------------------------------------

describe('detectPassiveVoice', () => {
  it('detects "was written" as passive voice', () => {
    const issues = detectPassiveVoice('The book was written by the author.')
    expect(issues.length).toBeGreaterThanOrEqual(1)
    expect(issues[0].type).toBe('grammar')
    expect(issues[0].rule).toBe('passive-voice')
  })

  it('detects "were broken" as passive voice', () => {
    const issues = detectPassiveVoice('The windows were broken during the storm.')
    expect(issues.length).toBeGreaterThanOrEqual(1)
  })

  it('returns empty for active voice sentences', () => {
    const issues = detectPassiveVoice('The cat sat on the mat.')
    expect(issues).toEqual([])
  })

  it('handles empty text', () => {
    expect(detectPassiveVoice('')).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// GrammarEngine — detectWordiness
// ---------------------------------------------------------------------------

describe('detectWordiness', () => {
  it('detects "in order to"', () => {
    const issues = detectWordiness('We need in order to succeed.')
    expect(issues.length).toBe(1)
    expect(issues[0].suggestions).toContain('to')
    expect(issues[0].type).toBe('style')
    expect(issues[0].rule).toBe('wordiness')
  })

  it('detects "at this point in time"', () => {
    const issues = detectWordiness('At this point in time we have no data.')
    expect(issues.length).toBe(1)
    expect(issues[0].suggestions).toContain('now')
  })

  it('detects "due to the fact that"', () => {
    const issues = detectWordiness('Due to the fact that it rained.')
    expect(issues.length).toBe(1)
    expect(issues[0].suggestions).toContain('because')
  })

  it('detects multiple wordiness issues', () => {
    const issues = detectWordiness('In order to succeed at this point in time.')
    expect(issues.length).toBe(2)
  })

  it('returns empty when no issues', () => {
    expect(detectWordiness('Hello world.')).toEqual([])
  })

  it('handles empty text', () => {
    expect(detectWordiness('')).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// GrammarEngine — detectCliches
// ---------------------------------------------------------------------------

describe('detectCliches', () => {
  it('detects "think outside the box"', () => {
    const issues = detectCliches('We need to think outside the box.')
    expect(issues.length).toBe(1)
    expect(issues[0].type).toBe('style')
    expect(issues[0].rule).toBe('cliche')
  })

  it('detects "low-hanging fruit"', () => {
    const issues = detectCliches('Let us grab the low-hanging fruit first.')
    expect(issues.length).toBe(1)
  })

  it('detects multiple cliches', () => {
    const issues = detectCliches('At the end of the day, we need to think outside the box.')
    expect(issues.length).toBe(2)
  })

  it('is case-insensitive', () => {
    const issues = detectCliches('Think Outside The Box is overused.')
    expect(issues.length).toBe(1)
  })

  it('returns empty when no cliches', () => {
    expect(detectCliches('The project timeline is on track.')).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// GrammarEngine — detectPunctuationIssues
// ---------------------------------------------------------------------------

describe('detectPunctuationIssues', () => {
  it('detects double spaces', () => {
    const issues = detectPunctuationIssues('Hello  world.')
    const doubleSpaceIssues = issues.filter(i => i.rule === 'double-space')
    expect(doubleSpaceIssues.length).toBe(1)
    expect(doubleSpaceIssues[0].suggestions).toContain(' ')
  })

  it('detects repeated punctuation', () => {
    const issues = detectPunctuationIssues('Wait,, really??')
    const repeatedIssues = issues.filter(i => i.rule === 'repeated-punctuation')
    expect(repeatedIssues.length).toBeGreaterThanOrEqual(1)
  })

  it('allows ellipsis (...)', () => {
    const issues = detectPunctuationIssues('Wait... really?')
    const repeatedIssues = issues.filter(i => i.rule === 'repeated-punctuation')
    expect(repeatedIssues).toEqual([])
  })

  it('detects missing space after punctuation', () => {
    const issues = detectPunctuationIssues('Hello.World')
    const missingSpaceIssues = issues.filter(i => i.rule === 'missing-space')
    expect(missingSpaceIssues.length).toBe(1)
  })

  it('handles empty text', () => {
    expect(detectPunctuationIssues('')).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// GrammarEngine — analyzeGrammar
// ---------------------------------------------------------------------------

describe('analyzeGrammar', () => {
  it('returns empty for empty text', () => {
    expect(analyzeGrammar('')).toEqual([])
    expect(analyzeGrammar(null)).toEqual([])
  })

  it('runs all rules with formal preset', () => {
    const text = 'The report was written in order to explain.  Think outside the box.'
    const issues = analyzeGrammar(text, { stylePreset: 'formal' })
    // Should detect passive voice, wordiness, double space, and cliche
    expect(issues.length).toBeGreaterThanOrEqual(3)
  })

  it('skips passive voice and wordiness with casual preset', () => {
    const text = 'The report was written in order to explain.'
    const formalIssues = analyzeGrammar(text, { stylePreset: 'formal' })
    const casualIssues = analyzeGrammar(text, { stylePreset: 'casual' })
    expect(casualIssues.length).toBeLessThan(formalIssues.length)
  })

  it('skips cliches with technical preset', () => {
    const text = 'Think outside the box for a scalable solution.'
    const formalIssues = analyzeGrammar(text, { stylePreset: 'formal' })
    const techIssues = analyzeGrammar(text, { stylePreset: 'technical' })
    expect(techIssues.length).toBeLessThan(formalIssues.length)
  })

  it('allows overriding preset settings', () => {
    const text = 'The report was written carefully.'
    const issues = analyzeGrammar(text, { stylePreset: 'casual', passiveVoice: true })
    const passiveIssues = issues.filter(i => i.rule === 'passive-voice')
    expect(passiveIssues.length).toBeGreaterThanOrEqual(1)
  })

  it('results are sorted by offset', () => {
    const text = 'In order to succeed  at this point in time, think outside the box.'
    const issues = analyzeGrammar(text, { stylePreset: 'formal' })
    for (let i = 1; i < issues.length; i++) {
      expect(issues[i].offset).toBeGreaterThanOrEqual(issues[i - 1].offset)
    }
  })
})

// ---------------------------------------------------------------------------
// GrammarEngine — summarizeIssues
// ---------------------------------------------------------------------------

describe('summarizeIssues', () => {
  it('summarizes an empty array', () => {
    const summary = summarizeIssues([])
    expect(summary.total).toBe(0)
    expect(summary.grammar).toBe(0)
    expect(summary.style).toBe(0)
  })

  it('counts grammar and style issues correctly', () => {
    const issues = [
      { type: 'grammar', rule: 'passive-voice' },
      { type: 'grammar', rule: 'double-space' },
      { type: 'style', rule: 'wordiness' },
      { type: 'style', rule: 'cliche' },
      { type: 'style', rule: 'cliche' },
    ]
    const summary = summarizeIssues(issues)
    expect(summary.total).toBe(5)
    expect(summary.grammar).toBe(2)
    expect(summary.style).toBe(3)
    expect(summary.byRule['cliche']).toBe(2)
    expect(summary.byRule['passive-voice']).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// STYLE_PRESETS
// ---------------------------------------------------------------------------

describe('STYLE_PRESETS', () => {
  it('has formal, casual, technical, academic presets', () => {
    expect(STYLE_PRESETS).toHaveProperty('formal')
    expect(STYLE_PRESETS).toHaveProperty('casual')
    expect(STYLE_PRESETS).toHaveProperty('technical')
    expect(STYLE_PRESETS).toHaveProperty('academic')
  })

  it('formal enables all rules', () => {
    const p = STYLE_PRESETS.formal
    expect(p.passiveVoice).toBe(true)
    expect(p.wordiness).toBe(true)
    expect(p.cliches).toBe(true)
    expect(p.punctuation).toBe(true)
  })

  it('casual disables passive voice and wordiness', () => {
    const p = STYLE_PRESETS.casual
    expect(p.passiveVoice).toBe(false)
    expect(p.wordiness).toBe(false)
  })

  it('technical disables cliches and wordiness', () => {
    const p = STYLE_PRESETS.technical
    expect(p.cliches).toBe(false)
    expect(p.wordiness).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// SpellcheckPlugin — factory
// ---------------------------------------------------------------------------

describe('SpellcheckPlugin', () => {
  it('returns a valid plugin definition', () => {
    const plugin = SpellcheckPlugin()
    expect(plugin.name).toBe('spellcheck')
    expect(plugin.requiresFullAccess).toBe(true)
    expect(plugin.version).toBe('1.0.0')
    expect(plugin.commands.length).toBeGreaterThanOrEqual(6)
  })

  it('registers expected command names', () => {
    const plugin = SpellcheckPlugin()
    const names = plugin.commands.map(c => c.name)
    expect(names).toContain('toggleSpellcheck')
    expect(names).toContain('checkGrammar')
    expect(names).toContain('addToDictionary')
    expect(names).toContain('ignoreWord')
    expect(names).toContain('setWritingStyle')
    expect(names).toContain('getSpellcheckStats')
  })

  it('has context menu items', () => {
    const plugin = SpellcheckPlugin()
    expect(plugin.contextMenuItems.length).toBeGreaterThanOrEqual(1)
  })

  it('accepts custom options', () => {
    const onError = vi.fn()
    const onCorrection = vi.fn()
    const plugin = SpellcheckPlugin({
      language: 'fr-FR',
      enabled: false,
      grammarRules: false,
      stylePreset: 'casual',
      dictionary: ['Remyx', 'WYSIWYG'],
      persistent: false,
      onError,
      onCorrection,
    })
    expect(plugin.name).toBe('spellcheck')
  })

  it('init sets spellcheck attributes on editor element', () => {
    const plugin = SpellcheckPlugin({ language: 'en-GB', enabled: true })
    const element = document.createElement('div')
    element.setAttribute('contenteditable', 'true')
    const eventBus = {
      on: vi.fn(() => vi.fn()),
      emit: vi.fn(),
    }
    const engine = {
      element,
      eventBus,
      getText: () => '',
      history: { snapshot: vi.fn() },
      _spellcheck: null,
    }

    plugin.init(engine)

    expect(element.getAttribute('spellcheck')).toBe('true')
    expect(element.getAttribute('lang')).toBe('en-GB')
    expect(engine._spellcheck).toBeTruthy()
    expect(typeof engine._spellcheck.runCheck).toBe('function')
    expect(typeof engine._spellcheck.addToDictionary).toBe('function')
    expect(typeof engine._spellcheck.ignoreWord).toBe('function')
    expect(typeof engine._spellcheck.setWritingStyle).toBe('function')
    expect(typeof engine._spellcheck.setLanguage).toBe('function')

    plugin.destroy()
  })

  it('toggleSpellcheck command toggles enabled state', () => {
    const plugin = SpellcheckPlugin({ enabled: true })
    const element = document.createElement('div')
    element.setAttribute('contenteditable', 'true')
    const eventBus = {
      on: vi.fn(() => vi.fn()),
      emit: vi.fn(),
    }
    const engine = {
      element,
      eventBus,
      getText: () => '',
      history: { snapshot: vi.fn() },
    }

    plugin.init(engine)

    const toggleCmd = plugin.commands.find(c => c.name === 'toggleSpellcheck')
    const result = toggleCmd.execute(engine)
    expect(result).toBe(false) // was true, toggled to false
    expect(element.getAttribute('spellcheck')).toBe('false')

    const result2 = toggleCmd.execute(engine)
    expect(result2).toBe(true) // toggled back to true
    expect(element.getAttribute('spellcheck')).toBe('true')

    plugin.destroy()
  })
})
