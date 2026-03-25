import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * React hook for interacting with the SpellcheckPlugin.
 *
 * Provides reactive state for spellcheck errors, statistics, and convenience
 * methods for toggling, correcting, and managing the dictionary.
 *
 * @param {object|null} engine — the EditorEngine instance (from useEditorEngine or onReady)
 * @returns {object} spellcheck API
 */
export function useSpellcheck(engine) {
  const [errors, setErrors] = useState([])
  const [stats, setStats] = useState({ total: 0, grammar: 0, style: 0, byRule: {} })
  const [enabled, setEnabled] = useState(true)
  const [stylePreset, setStylePresetState] = useState('formal')
  const [language, setLanguageState] = useState('en-US')
  const unsubsRef = useRef([])

  // Refresh state from the plugin
  const refresh = useCallback(() => {
    if (!engine?._spellcheck) return
    const s = engine._spellcheck.getStats()
    setErrors(engine._spellcheck.getErrors())
    setStats(s)
    setEnabled(engine._spellcheck.isEnabled())
    setStylePresetState(engine._spellcheck.getWritingStyle())
    setLanguageState(engine._spellcheck.getLanguage())
  }, [engine])

  useEffect(() => {
    if (!engine?.eventBus) return

    // Initial load
    refresh()

    // Subscribe to spellcheck events
    const events = [
      'spellcheck:update',
      'spellcheck:toggle',
      'spellcheck:style:change',
      'spellcheck:language:change',
      'spellcheck:dictionary:add',
      'spellcheck:ignored:add',
      'spellcheck:correction',
    ]

    const unsubs = events.map(evt =>
      engine.eventBus.on(evt, refresh)
    )

    unsubsRef.current = unsubs

    return () => {
      for (const unsub of unsubsRef.current) unsub?.()
      unsubsRef.current = []
    }
  }, [engine, refresh])

  const toggleSpellcheck = useCallback(() => {
    return engine?.executeCommand?.('toggleSpellcheck') ?? false
  }, [engine])

  const checkGrammar = useCallback(async () => {
    return engine?._spellcheck?.runCheck() ?? []
  }, [engine])

  const addToDictionary = useCallback((word) => {
    engine?._spellcheck?.addToDictionary(word)
  }, [engine])

  const removeFromDictionary = useCallback((word) => {
    engine?._spellcheck?.removeFromDictionary(word)
  }, [engine])

  const ignoreWord = useCallback((word) => {
    engine?._spellcheck?.ignoreWord(word)
  }, [engine])

  const setWritingStyle = useCallback((preset) => {
    engine?._spellcheck?.setWritingStyle(preset)
  }, [engine])

  const setLanguage = useCallback((lang) => {
    engine?._spellcheck?.setLanguage(lang)
  }, [engine])

  const getDictionary = useCallback(() => {
    return engine?._spellcheck?.getDictionary() ?? []
  }, [engine])

  const getIgnoredWords = useCallback(() => {
    return engine?._spellcheck?.getIgnoredWords() ?? []
  }, [engine])

  return {
    /** All current spellcheck/grammar errors */
    errors,
    /** Summary statistics */
    stats,
    /** Whether spellcheck is enabled */
    enabled,
    /** Current writing style preset */
    stylePreset,
    /** Current language */
    language,
    /** Toggle spellcheck on/off */
    toggleSpellcheck,
    /** Run a grammar check now */
    checkGrammar,
    /** Add a word to the custom dictionary */
    addToDictionary,
    /** Remove a word from the custom dictionary */
    removeFromDictionary,
    /** Ignore a word for this session */
    ignoreWord,
    /** Set the writing style preset */
    setWritingStyle,
    /** Set the language */
    setLanguage,
    /** Get all dictionary words */
    getDictionary,
    /** Get all ignored words */
    getIgnoredWords,
    /** Force refresh state */
    refresh,
  }
}
