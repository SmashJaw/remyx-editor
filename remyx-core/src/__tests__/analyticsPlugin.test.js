/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest'
import {
  AnalyticsPlugin,
  analyzeContent,
  countSyllables,
  splitSentences,
  fleschKincaid,
  fleschReadingEase,
  gunningFog,
  colemanLiau,
  vocabularyLevel,
  keywordDensity,
  seoAnalysis,
} from '../plugins/builtins/analyticsFeatures/index.js'

describe('countSyllables', () => {
  it('counts single-syllable words', () => {
    expect(countSyllables('cat')).toBe(1)
    expect(countSyllables('the')).toBe(1)
  })

  it('counts multi-syllable words', () => {
    expect(countSyllables('beautiful')).toBeGreaterThanOrEqual(2)
    expect(countSyllables('education')).toBeGreaterThanOrEqual(3)
  })

  it('handles empty/null', () => {
    expect(countSyllables('')).toBe(0)
  })
})

describe('splitSentences', () => {
  it('splits on periods', () => {
    expect(splitSentences('Hello world. How are you?')).toEqual(['Hello world.', 'How are you?'])
  })

  it('handles empty', () => {
    expect(splitSentences('')).toEqual([])
    expect(splitSentences(null)).toEqual([])
  })
})

describe('readability scores', () => {
  const stats = { words: 100, sentences: 5, syllables: 150, complexWords: 10, chars: 500 }

  it('fleschKincaid returns a number', () => {
    expect(typeof fleschKincaid(stats)).toBe('number')
    expect(fleschKincaid(stats)).toBeGreaterThan(0)
  })

  it('fleschReadingEase returns a number', () => {
    expect(typeof fleschReadingEase(stats)).toBe('number')
  })

  it('gunningFog returns a number', () => {
    expect(typeof gunningFog(stats)).toBe('number')
    expect(gunningFog(stats)).toBeGreaterThan(0)
  })

  it('colemanLiau returns a number', () => {
    expect(typeof colemanLiau(stats)).toBe('number')
  })

  it('handles zero values', () => {
    expect(fleschKincaid({ words: 0, sentences: 0, syllables: 0 })).toBe(0)
    expect(gunningFog({ words: 0, sentences: 0, complexWords: 0 })).toBe(0)
  })
})

describe('vocabularyLevel', () => {
  it('returns basic for low grade levels', () => {
    expect(vocabularyLevel(3)).toBe('basic')
    expect(vocabularyLevel(6)).toBe('basic')
  })

  it('returns intermediate for mid grade levels', () => {
    expect(vocabularyLevel(8)).toBe('intermediate')
    expect(vocabularyLevel(12)).toBe('intermediate')
  })

  it('returns advanced for high grade levels', () => {
    expect(vocabularyLevel(15)).toBe('advanced')
  })
})

describe('analyzeContent', () => {
  const text = 'The quick brown fox jumps over the lazy dog. This is a simple sentence. Another one here.'

  it('returns word count', () => {
    const stats = analyzeContent(text)
    expect(stats.wordCount).toBeGreaterThan(0)
  })

  it('returns readability scores', () => {
    const stats = analyzeContent(text)
    expect(stats.readability).toBeDefined()
    expect(typeof stats.readability.fleschKincaid).toBe('number')
    expect(typeof stats.readability.gunningFog).toBe('number')
    expect(typeof stats.readability.colemanLiau).toBe('number')
    expect(stats.readability.vocabularyLevel).toBeTruthy()
  })

  it('returns reading time', () => {
    const stats = analyzeContent(text, { wordsPerMinute: 200 })
    expect(stats.readingTime.minutes).toBeGreaterThanOrEqual(1)
    expect(stats.readingTime.wordsPerMinute).toBe(200)
  })

  it('detects long sentences', () => {
    const longText = Array(35).fill('word').join(' ') + '. Short.'
    const stats = analyzeContent(longText, { maxSentenceLength: 30 })
    expect(stats.warnings.longSentences.length).toBe(1)
  })

  it('tracks goal progress', () => {
    const stats = analyzeContent(text, { targetWordCount: 100 })
    expect(stats.goalProgress).toBeDefined()
    expect(stats.goalProgress.target).toBe(100)
    expect(stats.goalProgress.percentage).toBeGreaterThan(0)
  })

  it('goalProgress is null when target is 0', () => {
    const stats = analyzeContent(text, { targetWordCount: 0 })
    expect(stats.goalProgress).toBeNull()
  })
})

describe('keywordDensity', () => {
  it('calculates density', () => {
    const result = keywordDensity('the cat sat on the mat', 'the')
    expect(result.count).toBe(2)
    expect(result.density).toBeGreaterThan(0)
    expect(result.positions).toEqual([0, 4])
  })

  it('handles empty input', () => {
    expect(keywordDensity('', 'test')).toEqual({ count: 0, density: 0, positions: [] })
    expect(keywordDensity('text', '')).toEqual({ count: 0, density: 0, positions: [] })
  })
})

describe('seoAnalysis', () => {
  it('detects missing H1', () => {
    const el = document.createElement('div')
    el.innerHTML = '<h2>Section</h2><p>Text</p>'
    const result = seoAnalysis('Section Text', el)
    expect(result.hints.some(h => h.includes('Missing H1'))).toBe(true)
  })

  it('detects multiple H1s', () => {
    const el = document.createElement('div')
    el.innerHTML = '<h1>A</h1><h1>B</h1>'
    const result = seoAnalysis('A B', el)
    expect(result.hints.some(h => h.includes('Multiple H1'))).toBe(true)
  })

  it('reports keyword density', () => {
    const el = document.createElement('div')
    el.innerHTML = '<h1>Title</h1><p>hello hello hello</p>'
    const result = seoAnalysis('Title hello hello hello', el, 'hello')
    expect(result.keywordInfo).toBeDefined()
    expect(result.keywordInfo.count).toBe(3)
  })
})

describe('AnalyticsPlugin', () => {
  it('creates a valid plugin', () => {
    const plugin = AnalyticsPlugin()
    expect(plugin.name).toBe('analytics')
    expect(plugin.commands.length).toBe(4)
    const names = plugin.commands.map(c => c.name)
    expect(names).toContain('toggleAnalytics')
    expect(names).toContain('getAnalytics')
    expect(names).toContain('getSeoAnalysis')
    expect(names).toContain('getKeywordDensity')
  })

  it('exposes _analytics API after init', () => {
    const plugin = AnalyticsPlugin()
    const el = document.createElement('div')
    el.contentEditable = 'true'
    el.innerHTML = '<p>Test content</p>'
    document.body.appendChild(el)
    const engine = {
      element: el,
      eventBus: { on: vi.fn(() => () => {}), emit: vi.fn() },
      getText: () => el.textContent,
      commands: { register: vi.fn() },
    }
    plugin.init(engine)
    expect(engine._analytics).toBeDefined()
    expect(typeof engine._analytics.analyzeContent).toBe('function')
    expect(typeof engine._analytics.seoAnalysis).toBe('function')
    expect(typeof engine._analytics.countSyllables).toBe('function')
    plugin.destroy()
    el.remove()
  })
})
