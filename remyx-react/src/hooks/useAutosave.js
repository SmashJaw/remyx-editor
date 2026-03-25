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
  // Task 274: Use a ref for saveStatus to avoid re-renders on every keystroke.
  // Only update state when the status actually changes.
  const saveStatusRef = useRef('saved')
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

    // Task 274: Subscribe to autosave events with ref-based status to avoid re-renders
    const updateStatus = (newStatus) => {
      if (saveStatusRef.current !== newStatus) {
        saveStatusRef.current = newStatus
        setSaveStatus(newStatus)
      }
    }

    const unsubs = [
      engine.eventBus.on('autosave:saving', () => updateStatus('saving')),
      engine.eventBus.on('autosave:saved', ({ timestamp }) => {
        updateStatus('saved')
        setLastSaved(timestamp)
      }),
      engine.eventBus.on('autosave:error', () => updateStatus('error')),
      engine.eventBus.on('content:change', () => {
        if (saveStatusRef.current !== 'saving') {
          updateStatus('unsaved')
        }
      }),
    ]

    // Check for recovery data, then start autosaving after recovery check completes
    const currentContent = engine.getHTML()
    manager.checkRecovery(currentContent).then((data) => {
      if (data) {
        setRecoveryData(data)
        engine.eventBus.emit('autosave:recovered', data)
        onRecoverRef.current?.(data)
      }
      manager.init()
    }).catch((err) => {
      console.warn('[Remyx] Recovery check failed:', err)
      // Still init autosave even if recovery check fails
      manager.init()
    })

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
