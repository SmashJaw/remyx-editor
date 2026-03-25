import { useEffect, useRef, useCallback } from 'react'

const MIN_SWIPE_DISTANCE = 50
const MAX_VERTICAL_DEVIATION = 30

/**
 * Detects horizontal swipe gestures on list items and blockquotes within the editor.
 * Swipe right → indent, swipe left → outdent.
 * Also supports swipe-down on the floating toolbar to dismiss it.
 *
 * @param {object} engine - The editor engine instance
 * @param {React.RefObject} editorRef - Ref to the editor content element
 * @param {object} [options] - Optional settings
 * @param {Function} [options.onDismissToolbar] - Callback to dismiss floating toolbar
 */
export function useSwipeGesture(engine, editorRef, options = {}) {
  const touchRef = useRef(null)
  const swipingElRef = useRef(null)

  const handleTouchStart = useCallback((e) => {
    if (!e.touches.length) return
    const touch = e.touches[0]
    touchRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
    }

    // Check if swiping on a list item or blockquote
    const target = e.target
    const swipable = target.closest('li, blockquote')
    if (swipable) {
      swipingElRef.current = swipable
    } else {
      swipingElRef.current = null
    }
  }, [])

  const handleTouchMove = useCallback((e) => {
    if (!touchRef.current) return
    const touch = e.touches[0]
    touchRef.current.currentX = touch.clientX
    touchRef.current.currentY = touch.clientY

    const dx = touch.clientX - touchRef.current.startX
    const dy = Math.abs(touch.clientY - touchRef.current.startY)

    // Show visual indicator during horizontal swipe on swipable elements
    if (swipingElRef.current && dy < MAX_VERTICAL_DEVIATION) {
      // Clamp translateX for visual feedback
      const clampedDx = Math.max(-80, Math.min(80, dx))
      swipingElRef.current.style.transform = `translateX(${clampedDx}px)`
      swipingElRef.current.style.transition = 'none'
    }
  }, [])

  const handleTouchEnd = useCallback((e) => {
    if (!touchRef.current || !engine) {
      touchRef.current = null
      return
    }

    const { startX, startY, currentX, currentY } = touchRef.current
    const dx = currentX - startX
    const dy = currentY - startY
    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)

    // Reset visual transform on the swiped element
    if (swipingElRef.current) {
      swipingElRef.current.style.transform = ''
      swipingElRef.current.style.transition = 'transform 0.2s ease'
      // Clear transition after animation
      setTimeout(() => {
        if (swipingElRef.current) {
          swipingElRef.current.style.transition = ''
        }
      }, 200)
    }

    // Check for horizontal swipe on list items / blockquotes
    if (swipingElRef.current && absDx >= MIN_SWIPE_DISTANCE && absDy < MAX_VERTICAL_DEVIATION) {
      if (dx > 0) {
        // Swipe right → indent
        engine.executeCommand('indent')
      } else {
        // Swipe left → outdent
        engine.executeCommand('outdent')
      }
    }

    // Check for swipe-down on floating toolbar to dismiss
    if (dy > MIN_SWIPE_DISTANCE && absDx < MAX_VERTICAL_DEVIATION) {
      const target = e.target
      if (target.closest('.rmx-floating-toolbar')) {
        options.onDismissToolbar?.()
      }
    }

    touchRef.current = null
    swipingElRef.current = null
  }, [engine, options])

  useEffect(() => {
    const el = editorRef?.current
    if (!el) return

    el.addEventListener('touchstart', handleTouchStart, { passive: true })
    el.addEventListener('touchmove', handleTouchMove, { passive: true })
    el.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      el.removeEventListener('touchstart', handleTouchStart)
      el.removeEventListener('touchmove', handleTouchMove)
      el.removeEventListener('touchend', handleTouchEnd)
    }
  }, [editorRef, handleTouchStart, handleTouchMove, handleTouchEnd])
}
