import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { AutosaveManager } from '@remyxjs/core'

/**
 * React hook for autosave integration with the editor engine.
 *
 * Manages AutosaveManager lifecycle, tracks save status, and handles
 * crash recovery detection with restore/dismiss actions.
 *
 * @param {import('@remyxjs/core').EditorEngine|null} engine
 * @param {Object} [config] - Autosave configuration
 * @param {boolean} [config.enabled] - Whether autosave is active
 * @param {number}  [config.interval] - Periodic save interval in ms
 * @param {number}  [config.debounce] - Debounce delay in ms
 * @param {string|object} [config.provider] - Storage provider config
 * @param {string}  [config.key] - Storage key
 * @param {Function} [config.onRecover] - Callback when recovery data is found
 * @param {boolean} [config.showRecoveryBanner] - Whether to show recovery banner
 * @param {boolean} [config.showSaveStatus] - Whether to show save status
 * @returns {{ saveStatus, lastSaved, recoveryData, recoverContent, dismissRecovery }}
 */
export function useAutosave(engine, config) {
  const [saveStatus, setSaveStatus] = useState('saved')
  const [lastSaved, setLastSaved] = useState(null)
  const [recoveryData, setRecoveryData] = useState(null)
  const managerRef = useRef(null)
  const onRecoverRef = useRef(config?.onRecover)

  // Keep onRecover ref fresh without triggering effect re-runs
  onRecoverRef.current = config?.onRecover

  // Stabilize config reference to avoid re-creating manager on every render
  const enabled = config?.enabled ?? false
  const configKey = config?.key
  const configInterval = config?.interval
  const configDebounce = config?.debounce
  const configProvider = config?.provider

  useEffect(() => {
    if (!engine || !enabled) return

    const manager = new AutosaveManager(engine, {
      enabled: true,
      key: configKey,
      interval: configInterval,
      debounce: configDebounce,
      provider: configProvider,
    })
    managerRef.current = manager

    // Subscribe to autosave events
    const unsubs = [
      engine.eventBus.on('autosave:saving', () => setSaveStatus('saving')),
      engine.eventBus.on('autosave:saved', ({ timestamp }) => {
        setSaveStatus('saved')
        setLastSaved(timestamp)
      }),
      engine.eventBus.on('autosave:error', () => setSaveStatus('error')),
      engine.eventBus.on('content:change', () => {
        setSaveStatus((prev) => (prev === 'saving' ? prev : 'unsaved'))
      }),
    ]

    // Check for recovery data
    const currentContent = engine.getHTML()
    manager.checkRecovery(currentContent).then((data) => {
      if (data) {
        setRecoveryData(data)
        engine.eventBus.emit('autosave:recovered', data)
        onRecoverRef.current?.(data)
      }
    })

    manager.init()

    return () => {
      unsubs.forEach((u) => u())
      manager.destroy()
      managerRef.current = null
    }
    // Re-create manager when timing, key, or provider changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, enabled, configKey, configInterval, configDebounce, configProvider])

  const recoverContent = useCallback(() => {
    if (!engine || !recoveryData) return
    engine.setHTML(recoveryData.recoveredContent)
    engine.eventBus.emit('content:change')
    setRecoveryData(null)
    managerRef.current?.clearRecovery()
  }, [engine, recoveryData])

  const dismissRecovery = useCallback(() => {
    setRecoveryData(null)
    managerRef.current?.clearRecovery()
  }, [])

  return useMemo(
    () => ({
      saveStatus,
      lastSaved,
      recoveryData,
      recoverContent,
      dismissRecovery,
    }),
    [saveStatus, lastSaved, recoveryData, recoverContent, dismissRecovery],
  )
}
