import { useEffect, useRef, useCallback } from 'react'

const LONG_PRESS_DURATION = 500
const MOVE_CANCEL_THRESHOLD = 10

/**
 * Detects long-press (500ms hold) on touch devices and triggers a context menu
 * at the touch position. Supports haptic feedback and cancels on movement.
 *
 * @param {React.RefObject} elementRef - Ref to the element to listen on
 * @param {Function} onLongPress - Callback receiving { x, y } position
 * @param {object} [options]
 * @param {boolean} [options.enabled=true] - Whether long-press detection is active
 */
export function useLongPress(elementRef, onLongPress, options = {}) {
  const { enabled = true } = options
  const timerRef = useRef(null)
  const startPosRef = useRef(null)
  const firedRef = useRef(false)

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    startPosRef.current = null
    firedRef.current = false
  }, [])

  const handleTouchStart = useCallback((e) => {
    if (!enabled || !e.touches.length) return

    const touch = e.touches[0]
    startPosRef.current = { x: touch.clientX, y: touch.clientY }
    firedRef.current = false

    timerRef.current = setTimeout(() => {
      // Trigger haptic feedback if available
      if (navigator.vibrate) {
        try { navigator.vibrate(10) } catch (_) { /* ignore */ }
      }

      firedRef.current = true
      onLongPress?.({
        x: startPosRef.current.x,
        y: startPosRef.current.y,
      })
    }, LONG_PRESS_DURATION)
  }, [enabled, onLongPress])

  const handleTouchMove = useCallback((e) => {
    if (!startPosRef.current || !e.touches.length) return

    const touch = e.touches[0]
    const dx = Math.abs(touch.clientX - startPosRef.current.x)
    const dy = Math.abs(touch.clientY - startPosRef.current.y)

    // Cancel long-press if user moves finger beyond threshold
    if (dx > MOVE_CANCEL_THRESHOLD || dy > MOVE_CANCEL_THRESHOLD) {
      clear()
    }
  }, [clear])

  const handleTouchEnd = useCallback((e) => {
    // If long-press fired, prevent default browser context menu
    if (firedRef.current) {
      e.preventDefault()
    }
    clear()
  }, [clear])

  const handleContextMenu = useCallback((e) => {
    // Prevent default browser context menu on touch devices when long-press is active
    if (firedRef.current) {
      e.preventDefault()
    }
  }, [])

  useEffect(() => {
    const el = elementRef?.current
    if (!el || !enabled) return

    el.addEventListener('touchstart', handleTouchStart, { passive: true })
    el.addEventListener('touchmove', handleTouchMove, { passive: true })
    el.addEventListener('touchend', handleTouchEnd)
    el.addEventListener('contextmenu', handleContextMenu)

    return () => {
      el.removeEventListener('touchstart', handleTouchStart)
      el.removeEventListener('touchmove', handleTouchMove)
      el.removeEventListener('touchend', handleTouchEnd)
      el.removeEventListener('contextmenu', handleContextMenu)
      clear()
    }
  }, [elementRef, enabled, handleTouchStart, handleTouchMove, handleTouchEnd, handleContextMenu, clear])
}
