/**
 * AnalyticsPlugin — Content analytics and readability scoring.
 *
 * - Flesch-Kincaid, Gunning Fog, Coleman-Liau readability scores
 * - Reading time estimate
 * - Sentence and paragraph length analysis
 * - Vocabulary level indicator
 * - Heading hierarchy validation
 * - Goal-based writing (target word count)
 * - SEO hints (keyword density, heading structure)
 *
 * @param {object} [options]
 * @param {number} [options.wordsPerMinute=200] — reading speed for time estimate
 * @param {number} [options.targetWordCount=0]  — goal word count (0 = disabled)
 * @param {Function} [options.onAnalytics] — (stats) => void, called on every content change
 * @param {number} [options.maxSentenceLength=30] — warn if sentence exceeds this
 * @param {number} [options.maxParagraphLength=150] — warn if paragraph exceeds this
 */

import { createPlugin } from '@remyxjs/core'

// ---------------------------------------------------------------------------
// Text analysis utilities
// ---------------------------------------------------------------------------

/**
 * Count syllables in a word (English approximation).
 * @param {string} word
 * @returns {number}
 */
export function countSyllables(word) {
  word = word.toLowerCase().replace(/[^a-z]/g, '')
  if (!word) return 0
  if (word.length <= 3) return 1

  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '')
  word = word.replace(/^y/, '')

  const vowelGroups = word.match(/[aeiouy]{1,2}/g)
  return vowelGroups ? vowelGroups.length : 1
}

/**
 * Split text into sentences.
 * @param {string} text
 * @returns {string[]}
 */
export function splitSentences(text) {
  if (!text) return []
  return text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0)
}

/**
 * Split text into paragraphs.
 * @param {string} text
 * @returns {string[]}
 */
function splitParagraphs(text) {
  return text.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 0)
}

/**
 * Get words from text.
 * @param {string} text
 * @returns {string[]}
 */
function getWords(text) {
  return text.trim().split(/\s+/).filter(w => w.length > 0)
}

// ---------------------------------------------------------------------------
// Readability scores
// ---------------------------------------------------------------------------

/**
 * Calculate Flesch-Kincaid Grade Level.
 * @param {{ words: number, sentences: number, syllables: number }} stats
 * @returns {number}
 */
export function fleschKincaid(stats) {
  if (stats.sentences === 0 || stats.words === 0) return 0
  return 0.39 * (stats.words / stats.sentences) + 11.8 * (stats.syllables / stats.words) - 15.59
}

/**
 * Calculate Flesch Reading Ease score.
 * @param {{ words: number, sentences: number, syllables: number }} stats
 * @returns {number}
 */
export function fleschReadingEase(stats) {
  if (stats.sentences === 0 || stats.words === 0) return 0
  return 206.835 - 1.015 * (stats.words / stats.sentences) - 84.6 * (stats.syllables / stats.words)
}

/**
 * Calculate Gunning Fog Index.
 * @param {{ words: number, sentences: number, complexWords: number }} stats
 * @returns {number}
 */
export function gunningFog(stats) {
  if (stats.sentences === 0 || stats.words === 0) return 0
  return 0.4 * ((stats.words / stats.sentences) + 100 * (stats.complexWords / stats.words))
}

/**
 * Calculate Coleman-Liau Index.
 * @param {{ chars: number, words: number, sentences: number }} stats
 * @returns {number}
 */
export function colemanLiau(stats) {
  if (stats.words === 0) return 0
  const L = (stats.chars / stats.words) * 100
  const S = (stats.sentences / stats.words) * 100
  return 0.0588 * L - 0.296 * S - 15.8
}

/**
 * Determine vocabulary level from readability score.
 * @param {number} gradeLevel
 * @returns {'basic'|'intermediate'|'advanced'}
 */
export function vocabularyLevel(gradeLevel) {
  if (gradeLevel <= 6) return 'basic'
  if (gradeLevel <= 12) return 'intermediate'
  return 'advanced'
}

// ---------------------------------------------------------------------------
// Full content analysis
// ---------------------------------------------------------------------------

/**
 * Analyze content and return comprehensive stats.
 * @param {string} text
 * @param {object} [options]
 * @param {number} [options.wordsPerMinute=200]
 * @param {number} [options.targetWordCount=0]
 * @param {number} [options.maxSentenceLength=30]
 * @param {number} [options.maxParagraphLength=150]
 * @param {HTMLElement} [options.element] — editor DOM element for accurate paragraph counting
 * @returns {object}
 */
export function analyzeContent(text, options = {}) {
  const {
    wordsPerMinute = 200,
    targetWordCount = 0,
    maxSentenceLength = 30,
    maxParagraphLength = 150,
    element = null,
  } = options

  const words = getWords(text)
  const sentences = splitSentences(text)
  // Count paragraphs from DOM if available (getText() strips newlines between <p> tags)
  let paragraphs
  if (element) {
    const blockEls = element.querySelectorAll('p, li, blockquote, h1, h2, h3, h4, h5, h6, pre')
    const domParagraphs = Array.from(blockEls)
      .map(el => el.textContent.trim())
      .filter(t => t.length > 0)
    paragraphs = domParagraphs.length > 0 ? domParagraphs : splitParagraphs(text)
  } else {
    paragraphs = splitParagraphs(text)
  }
  const chars = text.replace(/\s/g, '').length

  let syllables = 0
  let complexWords = 0
  for (const word of words) {
    const s = countSyllables(word)
    syllables += s
    if (s >= 3) complexWords++
  }

  const baseStats = { words: words.length, sentences: sentences.length, syllables, complexWords, chars }

  // Readability scores
  const fk = fleschKincaid(baseStats)
  const fre = fleschReadingEase(baseStats)
  const gf = gunningFog(baseStats)
  const cl = colemanLiau(baseStats)
  const level = vocabularyLevel(fk)

  // Reading time
  const readingTimeMinutes = words.length / wordsPerMinute
  const readingTimeSeconds = Math.round(readingTimeMinutes * 60)

  // Sentence/paragraph warnings
  const longSentences = sentences
    .map((s, i) => ({ index: i, text: s, wordCount: getWords(s).length }))
    .filter(s => s.wordCount > maxSentenceLength)

  const longParagraphs = paragraphs
    .map((p, i) => ({ index: i, text: p.substring(0, 100) + (p.length > 100 ? '...' : ''), wordCount: getWords(p).length }))
    .filter(p => p.wordCount > maxParagraphLength)

  // Word count goal progress
  const goalProgress = targetWordCount > 0
    ? { target: targetWordCount, current: words.length, percentage: Math.round((words.length / targetWordCount) * 100) }
    : null

  return {
    wordCount: words.length,
    charCount: chars,
    sentenceCount: sentences.length,
    paragraphCount: paragraphs.length,
    syllableCount: syllables,
    complexWordCount: complexWords,
    readability: {
      fleschKincaid: Math.round(fk * 10) / 10,
      fleschReadingEase: Math.round(fre * 10) / 10,
      gunningFog: Math.round(gf * 10) / 10,
      colemanLiau: Math.round(cl * 10) / 10,
      vocabularyLevel: level,
    },
    readingTime: {
      minutes: Math.ceil(readingTimeMinutes),
      seconds: readingTimeSeconds,
      wordsPerMinute,
    },
    warnings: {
      longSentences,
      longParagraphs,
    },
    goalProgress,
  }
}

/**
 * Analyze keyword density in text.
 * @param {string} text
 * @param {string} keyword
 * @returns {{ count: number, density: number, positions: number[] }}
 */
export function keywordDensity(text, keyword) {
  if (!text || !keyword) return { count: 0, density: 0, positions: [] }
  const words = getWords(text)
  const kw = keyword.toLowerCase()
  const positions = []
  let count = 0
  words.forEach((w, i) => {
    if (w.toLowerCase() === kw) {
      count++
      positions.push(i)
    }
  })
  return {
    count,
    density: words.length > 0 ? Math.round((count / words.length) * 10000) / 100 : 0,
    positions,
  }
}

/**
 * Generate SEO hints for the content.
 * @param {string} text
 * @param {HTMLElement} editorEl
 * @param {string} [targetKeyword]
 * @returns {object}
 */
export function seoAnalysis(text, editorEl, targetKeyword) {
  const words = getWords(text)
  const headings = editorEl.querySelectorAll('h1, h2, h3, h4, h5, h6')
  const h1Count = editorEl.querySelectorAll('h1').length

  const hints = []
  if (h1Count === 0) hints.push('Missing H1 heading')
  if (h1Count > 1) hints.push('Multiple H1 headings — consider using only one')
  if (words.length < 300) hints.push('Content is short — aim for 300+ words for SEO')
  if (headings.length === 0) hints.push('No headings — add headings to improve content structure')

  let keywordInfo = null
  if (targetKeyword) {
    keywordInfo = keywordDensity(text, targetKeyword)
    if (keywordInfo.density < 0.5) hints.push(`Keyword "${targetKeyword}" density is low (${keywordInfo.density}%) — aim for 1-3%`)
    if (keywordInfo.density > 3) hints.push(`Keyword "${targetKeyword}" density is high (${keywordInfo.density}%) — may be over-optimized`)
  }

  return {
    wordCount: words.length,
    headingCount: headings.length,
    h1Count,
    keywordInfo,
    hints,
  }
}

// ---------------------------------------------------------------------------
// Plugin
// ---------------------------------------------------------------------------

export function AnalyticsPlugin(options = {}) {
  const {
    wordsPerMinute = 200,
    targetWordCount = 0,
    onAnalytics,
    maxSentenceLength = 30,
    maxParagraphLength = 150,
  } = options

  let engine = null
  let unsubContentChange = null
  let debounceTimer = null
  let currentStats = null
  /** Item 15: Cache the last analyzed text to avoid re-splitting */
  let lastAnalyzedText = null

  /**
   * Extract text from the editor DOM with newline separators between block
   * elements.  engine.getText() returns element.textContent which concatenates
   * all <p> tags without whitespace, breaking sentence splitting.
   */
  function getDomText() {
    if (!engine) return ''
    const el = engine.element
    const blockEls = el.querySelectorAll('p, li, blockquote, h1, h2, h3, h4, h5, h6, pre')
    const blocks = Array.from(blockEls).map(b => b.textContent.trim()).filter(t => t.length > 0)
    return blocks.length > 0 ? blocks.join('\n') : (engine.getText() || '')
  }

  function updateAnalytics() {
    if (!engine) return
    const text = getDomText()
    // Item 15: Skip recompute if text hasn't changed
    if (text === lastAnalyzedText && currentStats) return
    lastAnalyzedText = text
    currentStats = analyzeContent(text, { wordsPerMinute, targetWordCount, maxSentenceLength, maxParagraphLength, element: engine.element })
    engine.eventBus.emit('analytics:update', currentStats)
    onAnalytics?.(currentStats)
  }

  return createPlugin({
    name: 'analytics',
    requiresFullAccess: true,
    version: '1.0.0',
    description: 'Readability scores, reading time, vocabulary level, SEO hints',

    commands: [
      {
        name: 'toggleAnalytics',
        execute(eng) {
          eng._analyticsVisible = !eng._analyticsVisible
          eng.eventBus.emit('analytics:toggle', { visible: eng._analyticsVisible })
          return eng._analyticsVisible
        },
        meta: { icon: 'analytics', tooltip: 'Toggle Analytics Panel' },
      },
      {
        name: 'getAnalytics',
        execute() {
          return analyzeContent(getDomText(), { wordsPerMinute, targetWordCount, maxSentenceLength, maxParagraphLength, element: engine.element })
        },
        meta: { tooltip: 'Get Content Analytics' },
      },
      {
        name: 'getSeoAnalysis',
        execute(eng, keyword) {
          return seoAnalysis(eng.getText(), eng.element, keyword)
        },
        meta: { tooltip: 'Get SEO Analysis' },
      },
      {
        name: 'getKeywordDensity',
        execute(eng, keyword) {
          return keywordDensity(eng.getText(), keyword)
        },
        meta: { tooltip: 'Get Keyword Density' },
      },
    ],

    init(eng) {
      engine = eng

      engine._analytics = {
        analyzeContent: () => analyzeContent(getDomText(), { wordsPerMinute, targetWordCount, maxSentenceLength, maxParagraphLength, element: engine.element }),
        seoAnalysis: (keyword) => seoAnalysis(engine.getText(), engine.element, keyword),
        keywordDensity: (keyword) => keywordDensity(engine.getText(), keyword),
        getStats: () => currentStats,
        countSyllables,
        fleschKincaid,
        gunningFog,
        colemanLiau,
      }

      // Update on content changes (debounced)
      unsubContentChange = engine.eventBus.on('content:change', () => {
        clearTimeout(debounceTimer)
        debounceTimer = setTimeout(updateAnalytics, 300)
      })

      // Initial analysis
      updateAnalytics()
    },

    destroy() {
      clearTimeout(debounceTimer)
      unsubContentChange?.()
      engine = null
    },
  })
}
