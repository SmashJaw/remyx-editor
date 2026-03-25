/**
 * SpellcheckPlugin — Spelling & grammar checking with inline underlines.
 *
 * - Uses browser's native `spellcheck` attribute on contenteditable
 * - Built-in grammar rules engine for passive voice, wordiness, cliches, punctuation
 * - Configurable writing-style presets (formal, casual, technical, academic)
 * - Custom service interface for LanguageTool, Grammarly SDK, or other services
 * - Context menu integration: right-click on underlined word shows suggestions
 * - Per-session or persistent "Ignore" and "Add to dictionary"
 * - Language detection and multi-language support via BCP 47 tags
 *
 * @param {object} [options]
 * @param {string}   [options.language='en-US']       — BCP 47 language tag
 * @param {boolean}  [options.enabled=true]            — enable spellcheck on init
 * @param {boolean}  [options.grammarRules=true]       — enable built-in grammar checking
 * @param {string}   [options.stylePreset='formal']    — 'formal'|'casual'|'technical'|'academic'
 * @param {object}   [options.customService]           — optional external grammar service
 * @param {Function} [options.customService.check]     — async (text) => Array<{offset,length,message,suggestions,type}>
 * @param {string[]} [options.dictionary=[]]           — custom words to ignore
 * @param {boolean}  [options.persistent=true]         — persist dictionary in localStorage
 * @param {Function} [options.onError]                 — (errors) => void
 * @param {Function} [options.onCorrection]            — ({ original, replacement }) => void
 */

import { createPlugin } from '@remyxjs/core'
import { analyzeGrammar, summarizeIssues, STYLE_PRESETS } from './GrammarEngine.js'

const DICTIONARY_STORAGE_KEY = 'rmx-spellcheck-dictionary'
const IGNORED_STORAGE_KEY = 'rmx-spellcheck-ignored'

/**
 * Load persisted dictionary from localStorage.
 * @returns {string[]}
 */
function loadPersistedDictionary() {
  try {
    const raw = localStorage.getItem(DICTIONARY_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * Save dictionary to localStorage.
 * @param {string[]} words
 */
function persistDictionary(words) {
  try {
    localStorage.setItem(DICTIONARY_STORAGE_KEY, JSON.stringify(words))
  } catch {
    // localStorage unavailable — silently ignore
  }
}

/**
 * Load persisted ignored words from localStorage.
 * @returns {Set<string>}
 */
function loadPersistedIgnored() {
  try {
    const raw = localStorage.getItem(IGNORED_STORAGE_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    return new Set(Array.isArray(parsed) ? parsed : [])
  } catch {
    return new Set()
  }
}

/**
 * Save ignored words to localStorage.
 * @param {Set<string>} words
 */
function persistIgnored(words) {
  try {
    localStorage.setItem(IGNORED_STORAGE_KEY, JSON.stringify([...words]))
  } catch {
    // noop
  }
}

export function SpellcheckPlugin(options = {}) {
  const {
    language = 'en-US',
    enabled: enabledOnInit = true,
    grammarRules = true,
    stylePreset = 'formal',
    customService = null,
    dictionary: initialDictionary = [],
    persistent = true,
    onError,
    onCorrection,
  } = options

  let engine = null
  let isEnabled = enabledOnInit
  let currentStylePreset = stylePreset
  let currentLanguage = language
  let debounceTimer = null
  let currentErrors = []
  let unsubContentChange = null
  let unsubDestroy = null

  // Dictionary: custom words to always accept
  const dictionary = new Set([
    ...initialDictionary,
    ...(persistent ? loadPersistedDictionary() : []),
  ])

  // Ignored words: per-session (or persistent) ignore list
  const ignoredWords = persistent ? loadPersistedIgnored() : new Set()

  // ---------------------------------------------------------------------------
  // Error overlay management
  // ---------------------------------------------------------------------------

  /**
   * Clear all spellcheck/grammar underline marks from the editor.
   */
  function clearMarks() {
    if (!engine) return
    const marks = engine.element.querySelectorAll('.rmx-spelling-error, .rmx-grammar-error, .rmx-style-suggestion')
    for (const mark of marks) {
      const parent = mark.parentNode
      while (mark.firstChild) {
        parent.insertBefore(mark.firstChild, mark)
      }
      parent.removeChild(mark)
      parent.normalize()
    }
  }

  /**
   * Apply underline marks for detected errors.
   * @param {Array} errors
   */
  function applyMarks(errors) {
    if (!engine || errors.length === 0) return

    const text = engine.getText()

    // Walk text nodes and map character offsets to DOM positions
    const walker = document.createTreeWalker(engine.element, NodeFilter.SHOW_TEXT, null)
    const textNodes = []
    let totalOffset = 0
    let node
    while ((node = walker.nextNode())) {
      textNodes.push({ node, start: totalOffset, end: totalOffset + node.textContent.length })
      totalOffset += node.textContent.length
    }

    // Apply marks in reverse order to avoid offset shifting
    const sortedErrors = [...errors].sort((a, b) => b.offset - a.offset)

    for (const error of sortedErrors) {
      const errorEnd = error.offset + error.length

      // Find the text node(s) that contain this error
      let startNode = null, endNode = null
      let startOffset = 0, endOffset = 0

      for (const tn of textNodes) {
        if (!startNode && tn.end > error.offset) {
          startNode = tn
          startOffset = error.offset - tn.start
        }
        if (tn.end >= errorEnd) {
          endNode = tn
          endOffset = errorEnd - tn.start
          break
        }
      }

      if (!startNode || !endNode) continue
      // Only mark if within a single text node (simplification for reliability)
      if (startNode.node !== endNode.node) continue

      try {
        const range = document.createRange()
        range.setStart(startNode.node, startOffset)
        range.setEnd(endNode.node, endOffset)

        const className = error.type === 'spelling' ? 'rmx-spelling-error'
          : error.type === 'grammar' ? 'rmx-grammar-error'
          : 'rmx-style-suggestion'

        const mark = document.createElement('span')
        mark.className = className
        mark.setAttribute('data-spellcheck-message', error.message)
        mark.setAttribute('data-spellcheck-suggestions', JSON.stringify(error.suggestions || []))
        mark.setAttribute('data-spellcheck-type', error.type)
        mark.setAttribute('title', error.message)

        range.surroundContents(mark)
      } catch {
        // surroundContents can fail across element boundaries — skip
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Grammar analysis
  // ---------------------------------------------------------------------------

  /**
   * Run grammar analysis on the current editor content.
   * @returns {Promise<Array>}
   */
  async function runCheck() {
    if (!engine || !isEnabled) return []

    // Item 13: Use full text but debounce already prevents per-keystroke DOM walks
    const text = engine.getText()
    if (!text.trim()) {
      currentErrors = []
      engine.eventBus.emit('spellcheck:update', { errors: [], stats: summarizeIssues([]) })
      return []
    }

    let errors = []

    // Built-in grammar rules
    if (grammarRules) {
      const grammarIssues = analyzeGrammar(text, { stylePreset: currentStylePreset })
      errors.push(...grammarIssues)
    }

    // Custom service (e.g., LanguageTool, Grammarly)
    if (customService?.check) {
      try {
        const serviceIssues = await customService.check(text)
        if (Array.isArray(serviceIssues)) {
          errors.push(...serviceIssues)
        }
      } catch (err) {
        engine.eventBus.emit('spellcheck:error', { error: err })
      }
    }

    // Filter out dictionary and ignored words
    errors = errors.filter(error => {
      const word = text.slice(error.offset, error.offset + error.length).toLowerCase()
      return !dictionary.has(word) && !ignoredWords.has(word)
    })

    // Sort by offset
    errors.sort((a, b) => a.offset - b.offset)

    currentErrors = errors

    // Apply visual marks
    clearMarks()
    applyMarks(errors)

    const stats = summarizeIssues(errors)
    engine.eventBus.emit('spellcheck:update', { errors, stats })
    engine.eventBus.emit('grammar:check', { errors, stats })
    onError?.(errors)

    return errors
  }

  /**
   * Item 13: Debounced check — called on content changes.
   * Uses 500ms debounce to batch rapid keystrokes.
   */
  function debouncedCheck() {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(runCheck, 500)
  }

  // ---------------------------------------------------------------------------
  // Dictionary and ignore management
  // ---------------------------------------------------------------------------

  /**
   * Add a word to the custom dictionary.
   * @param {string} word
   */
  function addToDictionary(word) {
    if (!word) return
    const lower = word.toLowerCase()
    dictionary.add(lower)
    if (persistent) persistDictionary([...dictionary])

    engine?.eventBus.emit('spellcheck:dictionary:add', { word: lower })

    // Re-run check to remove this word's errors
    debouncedCheck()
  }

  /**
   * Remove a word from the custom dictionary.
   * @param {string} word
   */
  function removeFromDictionary(word) {
    dictionary.delete(word.toLowerCase())
    if (persistent) persistDictionary([...dictionary])
    debouncedCheck()
  }

  /**
   * Get all dictionary words.
   * @returns {string[]}
   */
  function getDictionary() {
    return [...dictionary]
  }

  /**
   * Ignore a word for this session (or persistently).
   * @param {string} word
   */
  function ignoreWord(word) {
    if (!word) return
    const lower = word.toLowerCase()
    ignoredWords.add(lower)
    if (persistent) persistIgnored(ignoredWords)

    engine?.eventBus.emit('spellcheck:ignored:add', { word: lower })
    debouncedCheck()
  }

  /**
   * Get all currently ignored words.
   * @returns {string[]}
   */
  function getIgnoredWords() {
    return [...ignoredWords]
  }

  // ---------------------------------------------------------------------------
  // Correction
  // ---------------------------------------------------------------------------

  /**
   * Apply a correction to a spellcheck mark in the DOM.
   * @param {HTMLElement} mark - The .rmx-spelling-error/.rmx-grammar-error element
   * @param {string} replacement - The text to replace with
   */
  function applyCorrection(mark, replacement) {
    if (!engine || !mark) return

    const original = mark.textContent
    engine.history.snapshot()

    const textNode = document.createTextNode(replacement)
    mark.parentNode.replaceChild(textNode, mark)
    textNode.parentNode.normalize()

    engine.eventBus.emit('content:change')
    engine.eventBus.emit('spellcheck:correction', { original, replacement })
    onCorrection?.({ original, replacement })

    // Re-check after correction
    debouncedCheck()
  }

  // ---------------------------------------------------------------------------
  // Style preset management
  // ---------------------------------------------------------------------------

  /**
   * Set the writing style preset.
   * @param {'formal'|'casual'|'technical'|'academic'} preset
   */
  function setWritingStyle(preset) {
    if (!STYLE_PRESETS[preset]) return
    currentStylePreset = preset
    engine?.eventBus.emit('spellcheck:style:change', { preset })
    debouncedCheck()
  }

  /**
   * Get the current writing style preset.
   * @returns {string}
   */
  function getWritingStyle() {
    return currentStylePreset
  }

  // ---------------------------------------------------------------------------
  // Language management
  // ---------------------------------------------------------------------------

  /**
   * Set the language for spellchecking.
   * @param {string} lang - BCP 47 language tag
   */
  function setLanguage(lang) {
    currentLanguage = lang
    if (engine?.element) {
      engine.element.setAttribute('lang', lang)
    }
    engine?.eventBus.emit('spellcheck:language:change', { language: lang })
    debouncedCheck()
  }

  /**
   * Get the current language.
   * @returns {string}
   */
  function getLanguage() {
    return currentLanguage
  }

  // ---------------------------------------------------------------------------
  // Stats
  // ---------------------------------------------------------------------------

  /**
   * Get current spellcheck statistics.
   * @returns {{ total: number, grammar: number, style: number, byRule: Record<string, number>, enabled: boolean, stylePreset: string, language: string }}
   */
  function getSpellcheckStats() {
    const stats = summarizeIssues(currentErrors)
    return {
      ...stats,
      enabled: isEnabled,
      stylePreset: currentStylePreset,
      language: currentLanguage,
      dictionarySize: dictionary.size,
      ignoredCount: ignoredWords.size,
    }
  }

  // ---------------------------------------------------------------------------
  // Context menu handler
  // ---------------------------------------------------------------------------

  function handleContextMenu(e) {
    const mark = e.target.closest?.('.rmx-spelling-error, .rmx-grammar-error, .rmx-style-suggestion')
    if (!mark) return

    e.preventDefault()

    const message = mark.getAttribute('data-spellcheck-message') || ''
    const suggestionsRaw = mark.getAttribute('data-spellcheck-suggestions') || '[]'
    const type = mark.getAttribute('data-spellcheck-type') || 'grammar'
    let suggestions = []
    try { suggestions = JSON.parse(suggestionsRaw) } catch { /* noop */ }

    const word = mark.textContent
    const rect = mark.getBoundingClientRect()

    engine.eventBus.emit('spellcheck:contextmenu', {
      word,
      message,
      suggestions,
      type,
      rect,
      mark,
      applyCorrection: (replacement) => applyCorrection(mark, replacement),
      ignoreWord: () => ignoreWord(word),
      addToDictionary: () => addToDictionary(word),
    })
  }

  // ---------------------------------------------------------------------------
  // Plugin definition
  // ---------------------------------------------------------------------------

  return createPlugin({
    name: 'spellcheck',
    requiresFullAccess: true,
    version: '1.0.0',
    description: 'Spelling & grammar checking with inline underlines, writing-style presets, and custom service integration',

    commands: [
      {
        name: 'toggleSpellcheck',
        execute(eng) {
          isEnabled = !isEnabled
          if (isEnabled) {
            eng.element.setAttribute('spellcheck', 'true')
            debouncedCheck()
          } else {
            eng.element.setAttribute('spellcheck', 'false')
            clearMarks()
            currentErrors = []
            eng.eventBus.emit('spellcheck:update', { errors: [], stats: summarizeIssues([]) })
          }
          eng.eventBus.emit('spellcheck:toggle', { enabled: isEnabled })
          return isEnabled
        },
        meta: { icon: 'spellcheck', tooltip: 'Toggle Spellcheck' },
      },
      {
        name: 'checkGrammar',
        async execute(eng) {
          return runCheck()
        },
        meta: { icon: 'spellcheck', tooltip: 'Check Grammar' },
      },
      {
        name: 'addToDictionary',
        execute(eng, word) {
          addToDictionary(word)
        },
        meta: { tooltip: 'Add to Dictionary' },
      },
      {
        name: 'ignoreWord',
        execute(eng, word) {
          ignoreWord(word)
        },
        meta: { tooltip: 'Ignore Word' },
      },
      {
        name: 'setWritingStyle',
        execute(eng, preset) {
          setWritingStyle(preset)
          return preset
        },
        meta: { tooltip: 'Set Writing Style' },
      },
      {
        name: 'getSpellcheckStats',
        execute(eng) {
          return getSpellcheckStats()
        },
        meta: { tooltip: 'Get Spellcheck Stats' },
      },
    ],

    contextMenuItems: [
      {
        label: 'Check Grammar',
        command: 'checkGrammar',
        when: () => isEnabled,
      },
    ],

    init(eng) {
      engine = eng

      // Expose the spellcheck API on the engine for external access
      engine._spellcheck = {
        runCheck,
        clearMarks,
        addToDictionary,
        removeFromDictionary,
        getDictionary,
        ignoreWord,
        getIgnoredWords,
        applyCorrection,
        setWritingStyle,
        getWritingStyle,
        setLanguage,
        getLanguage,
        getErrors: () => [...currentErrors],
        getStats: getSpellcheckStats,
        isEnabled: () => isEnabled,
      }

      // Set native browser spellcheck
      engine.element.setAttribute('spellcheck', isEnabled ? 'true' : 'false')
      engine.element.setAttribute('lang', currentLanguage)

      // Listen for content changes
      unsubContentChange = engine.eventBus.on('content:change', debouncedCheck)

      // Context menu for correction suggestions
      engine.element.addEventListener('contextmenu', handleContextMenu)

      // Cleanup on engine destroy
      unsubDestroy = engine.eventBus.on('destroy', cleanup)

      // Initial check
      if (isEnabled) {
        debouncedCheck()
      }
    },

    destroy() {
      cleanup()
    },
  })

  function cleanup() {
    clearTimeout(debounceTimer)
    clearMarks()
    unsubContentChange?.()
    unsubDestroy?.()
    engine?.element?.removeEventListener('contextmenu', handleContextMenu)
    engine = null
  }
}
