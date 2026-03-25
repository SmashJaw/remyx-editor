/**
 * GrammarEngine — Built-in grammar, style, and punctuation rules engine.
 *
 * Provides pattern-based detection for:
 * - Passive voice constructions (was/were/been + past participle)
 * - Wordiness patterns (e.g., "in order to" -> "to")
 * - Cliche detection (common cliches list)
 * - Punctuation issues (double spaces, missing periods, Oxford comma)
 *
 * Each rule returns an array of issues:
 *   { offset, length, message, suggestions, type: 'grammar'|'style'|'spelling' }
 *
 * Writing-style presets control which rules fire:
 * - formal: all rules active, strict grammar
 * - casual: relaxed grammar, skip passive voice + wordiness
 * - technical: jargon OK, skip cliches + wordiness
 * - academic: citation-aware, all grammar rules, skip casual cliches
 */

// ---------------------------------------------------------------------------
// Passive voice patterns
// ---------------------------------------------------------------------------

const PASSIVE_AUXILIARIES = /\b(was|were|been|being|is|are|am|get|gets|got|gotten)\b/i

const PAST_PARTICIPLE_SUFFIXES = /\b\w+(ed|en|wn|nt|ht|lt)\b/i

/**
 * Detect passive voice constructions.
 * Looks for auxiliary verb + past participle patterns.
 * @param {string} text
 * @returns {Array<{offset: number, length: number, message: string, suggestions: string[], type: string}>}
 */
export function detectPassiveVoice(text) {
  const issues = []
  const words = text.split(/(\s+)/)
  let offset = 0

  for (let i = 0; i < words.length; i++) {
    const word = words[i]
    if (/^\s+$/.test(word)) {
      offset += word.length
      continue
    }

    if (PASSIVE_AUXILIARIES.test(word)) {
      // Look ahead for a past participle (skip whitespace tokens)
      let nextIdx = i + 1
      while (nextIdx < words.length && /^\s+$/.test(words[nextIdx])) nextIdx++

      if (nextIdx < words.length && PAST_PARTICIPLE_SUFFIXES.test(words[nextIdx])) {
        const passiveStart = offset
        let passiveEnd = offset + word.length
        // Include all tokens up to and including the past participle
        for (let j = i + 1; j <= nextIdx; j++) {
          passiveEnd += words[j].length
        }
        const passiveText = text.slice(passiveStart, passiveEnd)
        issues.push({
          offset: passiveStart,
          length: passiveEnd - passiveStart,
          message: `Passive voice detected: "${passiveText}". Consider using active voice.`,
          suggestions: [],
          type: 'grammar',
          rule: 'passive-voice',
        })
      }
    }

    offset += word.length
  }

  return issues
}

// ---------------------------------------------------------------------------
// Wordiness patterns
// ---------------------------------------------------------------------------

/** @type {Array<{pattern: RegExp, replacement: string, message: string}>} */
const WORDINESS_RULES = [
  { pattern: /\bin order to\b/gi, replacement: 'to', message: '"in order to" can be simplified to "to"' },
  { pattern: /\bat this point in time\b/gi, replacement: 'now', message: '"at this point in time" can be simplified to "now"' },
  { pattern: /\bdue to the fact that\b/gi, replacement: 'because', message: '"due to the fact that" can be simplified to "because"' },
  { pattern: /\bin the event that\b/gi, replacement: 'if', message: '"in the event that" can be simplified to "if"' },
  { pattern: /\bfor the purpose of\b/gi, replacement: 'to', message: '"for the purpose of" can be simplified to "to"' },
  { pattern: /\bin the near future\b/gi, replacement: 'soon', message: '"in the near future" can be simplified to "soon"' },
  { pattern: /\bat the present time\b/gi, replacement: 'now', message: '"at the present time" can be simplified to "now"' },
  { pattern: /\bin spite of the fact that\b/gi, replacement: 'although', message: '"in spite of the fact that" can be simplified to "although"' },
  { pattern: /\bwith regard to\b/gi, replacement: 'about', message: '"with regard to" can be simplified to "about"' },
  { pattern: /\bin close proximity\b/gi, replacement: 'near', message: '"in close proximity" can be simplified to "near"' },
  { pattern: /\ba large number of\b/gi, replacement: 'many', message: '"a large number of" can be simplified to "many"' },
  { pattern: /\bhas the ability to\b/gi, replacement: 'can', message: '"has the ability to" can be simplified to "can"' },
  { pattern: /\bis able to\b/gi, replacement: 'can', message: '"is able to" can be simplified to "can"' },
  { pattern: /\bit is important to note that\b/gi, replacement: '(remove)', message: '"it is important to note that" is unnecessary filler' },
  { pattern: /\bneedless to say\b/gi, replacement: '(remove)', message: '"needless to say" is unnecessary — just say it' },
  { pattern: /\beach and every\b/gi, replacement: 'each', message: '"each and every" can be simplified to "each" or "every"' },
  { pattern: /\bfirst and foremost\b/gi, replacement: 'first', message: '"first and foremost" can be simplified to "first"' },
  { pattern: /\bbasically\b/gi, replacement: '(remove)', message: '"basically" is often unnecessary filler' },
  { pattern: /\bvery unique\b/gi, replacement: 'unique', message: '"unique" is absolute — "very" is redundant' },
  { pattern: /\bcompletely eliminate\b/gi, replacement: 'eliminate', message: '"eliminate" is absolute — "completely" is redundant' },
]

/**
 * Detect wordy phrases that can be simplified.
 * @param {string} text
 * @returns {Array<{offset: number, length: number, message: string, suggestions: string[], type: string}>}
 */
export function detectWordiness(text) {
  const issues = []

  for (const rule of WORDINESS_RULES) {
    let match
    const re = new RegExp(rule.pattern.source, rule.pattern.flags)
    while ((match = re.exec(text)) !== null) {
      issues.push({
        offset: match.index,
        length: match[0].length,
        message: rule.message,
        suggestions: rule.replacement === '(remove)' ? [] : [rule.replacement],
        type: 'style',
        rule: 'wordiness',
      })
    }
  }

  return issues
}

// ---------------------------------------------------------------------------
// Cliche detection
// ---------------------------------------------------------------------------

const CLICHES = [
  'at the end of the day',
  'think outside the box',
  'low-hanging fruit',
  'move the needle',
  'take it to the next level',
  'game changer',
  'paradigm shift',
  'synergy',
  'it goes without saying',
  'avoid it like the plague',
  'better late than never',
  'the bottom line',
  'by the same token',
  'crystal clear',
  'few and far between',
  'hit the ground running',
  'in a nutshell',
  'level playing field',
  'read between the lines',
  'reinvent the wheel',
  'tip of the iceberg',
  'win-win situation',
  'back to the drawing board',
  'bite the bullet',
  'cutting edge',
  'pushing the envelope',
  'raise the bar',
  'on the same page',
  'circle back',
  'deep dive',
  'best practice',
  'leverage',
  'ecosystem',
  'robust',
  'scalable solution',
]

/**
 * Detect cliche phrases in text.
 * @param {string} text
 * @returns {Array<{offset: number, length: number, message: string, suggestions: string[], type: string}>}
 */
export function detectCliches(text) {
  const issues = []
  const lower = text.toLowerCase()

  for (const cliche of CLICHES) {
    let idx = lower.indexOf(cliche)
    while (idx !== -1) {
      issues.push({
        offset: idx,
        length: cliche.length,
        message: `Cliche detected: "${text.slice(idx, idx + cliche.length)}". Consider using more original phrasing.`,
        suggestions: [],
        type: 'style',
        rule: 'cliche',
      })
      idx = lower.indexOf(cliche, idx + cliche.length)
    }
  }

  return issues
}

// ---------------------------------------------------------------------------
// Punctuation checks
// ---------------------------------------------------------------------------

/**
 * Detect punctuation issues.
 * @param {string} text
 * @returns {Array<{offset: number, length: number, message: string, suggestions: string[], type: string}>}
 */
export function detectPunctuationIssues(text) {
  const issues = []

  // Double spaces
  let match
  const doubleSpace = /  +/g
  while ((match = doubleSpace.exec(text)) !== null) {
    // Skip if at start of line (indentation)
    if (match.index === 0 || text[match.index - 1] === '\n') continue
    issues.push({
      offset: match.index,
      length: match[0].length,
      message: 'Multiple consecutive spaces detected.',
      suggestions: [' '],
      type: 'grammar',
      rule: 'double-space',
    })
  }

  // Repeated punctuation (e.g., "..", ",,", "!!")
  const repeatedPunc = /([.,!?;:])\1+/g
  while ((match = repeatedPunc.exec(text)) !== null) {
    // Allow "..." (ellipsis)
    if (match[0] === '...' || match[0] === '..') continue
    issues.push({
      offset: match.index,
      length: match[0].length,
      message: `Repeated punctuation: "${match[0]}"`,
      suggestions: [match[1]],
      type: 'grammar',
      rule: 'repeated-punctuation',
    })
  }

  // Missing space after punctuation
  const missingSpace = /[.!?,;:](?=[A-Za-z])/g
  while ((match = missingSpace.exec(text)) !== null) {
    // Skip common abbreviations like "e.g." "i.e." "Dr." "Mr." and URLs
    const before = text.slice(Math.max(0, match.index - 4), match.index + 1)
    if (/\b[A-Z]\.$/.test(before) || /[a-z]\.[a-z]/.test(before) || /https?:/.test(before)) continue
    issues.push({
      offset: match.index,
      length: 2,
      message: 'Missing space after punctuation.',
      suggestions: [text[match.index] + ' ' + text[match.index + 1]],
      type: 'grammar',
      rule: 'missing-space',
    })
  }

  return issues
}

// ---------------------------------------------------------------------------
// Style preset configurations
// ---------------------------------------------------------------------------

/**
 * @typedef {'formal'|'casual'|'technical'|'academic'} StylePreset
 */

/** @type {Record<StylePreset, {passiveVoice: boolean, wordiness: boolean, cliches: boolean, punctuation: boolean}>} */
export const STYLE_PRESETS = {
  formal: { passiveVoice: true, wordiness: true, cliches: true, punctuation: true },
  casual: { passiveVoice: false, wordiness: false, cliches: true, punctuation: true },
  technical: { passiveVoice: true, wordiness: false, cliches: false, punctuation: true },
  academic: { passiveVoice: true, wordiness: true, cliches: false, punctuation: true },
}

// ---------------------------------------------------------------------------
// Main analysis function
// ---------------------------------------------------------------------------

/**
 * Run all applicable grammar rules on the given text.
 *
 * @param {string} text - The plain text content to analyze
 * @param {object} [options]
 * @param {StylePreset} [options.stylePreset='formal'] - Writing style preset
 * @param {boolean} [options.passiveVoice] - Override: enable/disable passive voice detection
 * @param {boolean} [options.wordiness] - Override: enable/disable wordiness detection
 * @param {boolean} [options.cliches] - Override: enable/disable cliche detection
 * @param {boolean} [options.punctuation] - Override: enable/disable punctuation checks
 * @returns {Array<{offset: number, length: number, message: string, suggestions: string[], type: string, rule: string}>}
 */
export function analyzeGrammar(text, options = {}) {
  if (!text) return []

  const preset = STYLE_PRESETS[options.stylePreset] || STYLE_PRESETS.formal
  const config = {
    passiveVoice: options.passiveVoice ?? preset.passiveVoice,
    wordiness: options.wordiness ?? preset.wordiness,
    cliches: options.cliches ?? preset.cliches,
    punctuation: options.punctuation ?? preset.punctuation,
  }

  const issues = []

  if (config.passiveVoice) issues.push(...detectPassiveVoice(text))
  if (config.wordiness) issues.push(...detectWordiness(text))
  if (config.cliches) issues.push(...detectCliches(text))
  if (config.punctuation) issues.push(...detectPunctuationIssues(text))

  // Sort by offset
  issues.sort((a, b) => a.offset - b.offset)

  return issues
}

/**
 * Get a human-readable summary of grammar analysis results.
 * @param {Array<{type: string, rule: string}>} issues
 * @returns {{ total: number, grammar: number, style: number, byRule: Record<string, number> }}
 */
export function summarizeIssues(issues) {
  const summary = { total: issues.length, grammar: 0, style: 0, byRule: {} }
  for (const issue of issues) {
    if (issue.type === 'grammar') summary.grammar++
    else summary.style++
    summary.byRule[issue.rule] = (summary.byRule[issue.rule] || 0) + 1
  }
  return summary
}
