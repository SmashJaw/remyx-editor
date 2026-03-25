import {
  analyzeGrammar,
  summarizeIssues,
  detectPassiveVoice,
  detectWordiness,
  detectCliches,
  detectPunctuationIssues,
  STYLE_PRESETS,
} from '../plugins/builtins/spellcheckFeatures/GrammarEngine.js'

describe('detectPassiveVoice', () => {
  it('detects "was written"', () => {
    const issues = detectPassiveVoice('The book was written by the author.')
    expect(issues.length).toBeGreaterThanOrEqual(1)
    expect(issues[0].rule).toBe('passive-voice')
    expect(issues[0].type).toBe('grammar')
  })

  it('detects "were broken"', () => {
    const issues = detectPassiveVoice('The windows were broken during the storm.')
    expect(issues.length).toBeGreaterThanOrEqual(1)
  })

  it('detects "is known"', () => {
    const issues = detectPassiveVoice('It is known that the earth is round.')
    expect(issues.length).toBeGreaterThanOrEqual(1)
  })

  it('detects "been eaten"', () => {
    const issues = detectPassiveVoice('The cake has been eaten.')
    expect(issues.length).toBeGreaterThanOrEqual(1)
  })

  it('returns empty for active voice', () => {
    expect(detectPassiveVoice('The cat sat on the mat.')).toEqual([])
  })

  it('returns empty for empty text', () => {
    expect(detectPassiveVoice('')).toEqual([])
  })

  it('includes correct offset and length', () => {
    const issues = detectPassiveVoice('Text was deleted by admin.')
    if (issues.length > 0) {
      expect(issues[0].offset).toBeGreaterThanOrEqual(0)
      expect(issues[0].length).toBeGreaterThan(0)
    }
  })
})

describe('detectWordiness', () => {
  it('detects "in order to"', () => {
    const issues = detectWordiness('We need to do this in order to succeed.')
    expect(issues.length).toBeGreaterThanOrEqual(1)
    expect(issues[0].rule).toBe('wordiness')
    expect(issues[0].suggestions).toContain('to')
  })

  it('detects "due to the fact that"', () => {
    const issues = detectWordiness('Due to the fact that it rained, we stayed inside.')
    expect(issues.length).toBeGreaterThanOrEqual(1)
    expect(issues[0].suggestions).toContain('because')
  })

  it('detects "at this point in time"', () => {
    const issues = detectWordiness('At this point in time, we should move forward.')
    expect(issues.length).toBeGreaterThanOrEqual(1)
    expect(issues[0].suggestions).toContain('now')
  })

  it('detects "very unique"', () => {
    const issues = detectWordiness('This is a very unique situation.')
    expect(issues.length).toBeGreaterThanOrEqual(1)
  })

  it('detects "basically"', () => {
    const issues = detectWordiness('Basically, this is unnecessary.')
    expect(issues.length).toBeGreaterThanOrEqual(1)
  })

  it('detects "needless to say"', () => {
    const issues = detectWordiness('Needless to say, the results were clear.')
    expect(issues.length).toBeGreaterThanOrEqual(1)
    expect(issues[0].suggestions).toEqual([])
  })

  it('returns empty for concise text', () => {
    expect(detectWordiness('This is clear.')).toEqual([])
  })
})

describe('detectCliches', () => {
  it('detects "think outside the box"', () => {
    const issues = detectCliches('We need to think outside the box.')
    expect(issues.length).toBe(1)
    expect(issues[0].rule).toBe('cliche')
  })

  it('detects "at the end of the day"', () => {
    const issues = detectCliches('At the end of the day, results matter.')
    expect(issues.length).toBe(1)
  })

  it('detects "low-hanging fruit"', () => {
    const issues = detectCliches('Focus on the low-hanging fruit first.')
    expect(issues.length).toBe(1)
  })

  it('detects multiple cliches in text', () => {
    const issues = detectCliches('Think outside the box and hit the ground running.')
    expect(issues.length).toBe(2)
  })

  it('returns empty for non-cliche text', () => {
    expect(detectCliches('The algorithm performs efficiently.')).toEqual([])
  })

  it('handles case insensitivity', () => {
    const issues = detectCliches('THINK OUTSIDE THE BOX')
    expect(issues.length).toBe(1)
  })
})

describe('detectPunctuationIssues', () => {
  it('detects double spaces', () => {
    const issues = detectPunctuationIssues('Hello  World')
    expect(issues.length).toBeGreaterThanOrEqual(1)
    expect(issues[0].rule).toBe('double-space')
  })

  it('skips double spaces at line start', () => {
    const issues = detectPunctuationIssues('  indented text')
    const doubleSpaces = issues.filter(i => i.rule === 'double-space')
    expect(doubleSpaces.length).toBe(0)
  })

  it('detects repeated punctuation', () => {
    const issues = detectPunctuationIssues('Really,,, that happened!!')
    const repeated = issues.filter(i => i.rule === 'repeated-punctuation')
    expect(repeated.length).toBeGreaterThanOrEqual(1)
  })

  it('allows ellipsis (...)', () => {
    const issues = detectPunctuationIssues('Wait... what?')
    const repeated = issues.filter(i => i.rule === 'repeated-punctuation')
    expect(repeated.length).toBe(0)
  })

  it('detects missing space after punctuation', () => {
    const issues = detectPunctuationIssues('Hello.World')
    const missing = issues.filter(i => i.rule === 'missing-space')
    expect(missing.length).toBeGreaterThanOrEqual(1)
  })

  it('skips single letter abbreviations like "A."', () => {
    const issues = detectPunctuationIssues('Mr. Smith is here.')
    const missing = issues.filter(i => i.rule === 'missing-space')
    expect(missing.length).toBe(0)
  })

  it('returns empty for clean text', () => {
    expect(detectPunctuationIssues('This is clean text.')).toEqual([])
  })
})

describe('STYLE_PRESETS', () => {
  it('should have four presets', () => {
    expect(Object.keys(STYLE_PRESETS)).toEqual(['formal', 'casual', 'technical', 'academic'])
  })

  it('formal should enable all rules', () => {
    expect(STYLE_PRESETS.formal).toEqual({ passiveVoice: true, wordiness: true, cliches: true, punctuation: true })
  })

  it('casual should disable passive voice and wordiness', () => {
    expect(STYLE_PRESETS.casual.passiveVoice).toBe(false)
    expect(STYLE_PRESETS.casual.wordiness).toBe(false)
  })

  it('technical should disable cliches and wordiness', () => {
    expect(STYLE_PRESETS.technical.cliches).toBe(false)
    expect(STYLE_PRESETS.technical.wordiness).toBe(false)
  })

  it('academic should disable cliches but enable passive voice', () => {
    expect(STYLE_PRESETS.academic.cliches).toBe(false)
    expect(STYLE_PRESETS.academic.passiveVoice).toBe(true)
  })
})

describe('analyzeGrammar', () => {
  it('returns empty for empty text', () => {
    expect(analyzeGrammar('')).toEqual([])
    expect(analyzeGrammar(null)).toEqual([])
    expect(analyzeGrammar(undefined)).toEqual([])
  })

  it('uses formal preset by default', () => {
    const text = 'The report was written in order to improve the low-hanging fruit.  Extra space.'
    const issues = analyzeGrammar(text)
    // Should detect passive voice + wordiness + cliche + double space
    expect(issues.length).toBeGreaterThanOrEqual(3)
  })

  it('respects casual preset', () => {
    const text = 'The report was written in order to succeed.'
    const formalIssues = analyzeGrammar(text, { stylePreset: 'formal' })
    const casualIssues = analyzeGrammar(text, { stylePreset: 'casual' })
    // Casual skips passive voice and wordiness
    expect(casualIssues.length).toBeLessThan(formalIssues.length)
  })

  it('respects per-rule overrides', () => {
    const text = 'The cake was eaten in order to test.'
    const issues = analyzeGrammar(text, { passiveVoice: false, wordiness: false })
    const pvIssues = issues.filter(i => i.rule === 'passive-voice')
    const wdIssues = issues.filter(i => i.rule === 'wordiness')
    expect(pvIssues.length).toBe(0)
    expect(wdIssues.length).toBe(0)
  })

  it('falls back to formal if unknown preset', () => {
    const text = 'The cake was eaten.'
    const issues = analyzeGrammar(text, { stylePreset: 'nonexistent' })
    expect(issues.length).toBeGreaterThanOrEqual(1)
  })

  it('returns sorted results by offset', () => {
    const text = 'Basically, the cake was eaten in order to test  spacing.'
    const issues = analyzeGrammar(text)
    for (let i = 1; i < issues.length; i++) {
      expect(issues[i].offset).toBeGreaterThanOrEqual(issues[i - 1].offset)
    }
  })
})

describe('summarizeIssues', () => {
  it('returns zero counts for empty array', () => {
    const summary = summarizeIssues([])
    expect(summary.total).toBe(0)
    expect(summary.grammar).toBe(0)
    expect(summary.style).toBe(0)
    expect(summary.byRule).toEqual({})
  })

  it('counts grammar and style issues separately', () => {
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
    expect(summary.byRule['passive-voice']).toBe(1)
    expect(summary.byRule['cliche']).toBe(2)
  })
})
