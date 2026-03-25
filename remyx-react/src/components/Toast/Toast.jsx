import { useState, useEffect, useCallback } from 'react'

/**
 * Lightweight toast notification component.
 * Shows a brief message at the bottom-center of the screen and auto-dismisses.
 *
 * @param {string} message - The text to display
 * @param {'info'|'success'|'warning'} type - Visual style (default: 'info')
 * @param {number} duration - Auto-dismiss time in ms (default: 3000)
 * @param {function} onDismiss - Called when toast is dismissed
 */
export function Toast({ message, type = 'info', duration = 3000, onDismiss }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (!message) return
    setVisible(true)
    const timer = setTimeout(() => {
      setVisible(false)
      onDismiss?.()
    }, duration)
    return () => clearTimeout(timer)
  }, [message, duration, onDismiss])

  if (!visible || !message) return null

  return (
    <div
      className={`rmx-toast rmx-toast--${type}`}
      role="status"
      aria-live="polite"
      style={{ animationDuration: `${duration}ms` }}
    >
      {message}
    </div>
  )
}

/**
 * Hook to manage toast state. Returns [toast element, showToast function].
 *
 * Usage:
 *   const [toastEl, showToast] = useToast()
 *   showToast('Saved!', 'success')
 *   return <>{toastEl}</>
 */
export function useToast() {
  const [toastState, setToastState] = useState(null)

  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    // Force re-render by using a new key
    setToastState({ message, type, duration, key: Date.now() })
  }, [])

  const handleDismiss = useCallback(() => {
    setToastState(null)
  }, [])

  const toastEl = toastState ? (
    <Toast
      key={toastState.key}
      message={toastState.message}
      type={toastState.type}
      duration={toastState.duration}
      onDismiss={handleDismiss}
    />
  ) : null

  return [toastEl, showToast]
}
