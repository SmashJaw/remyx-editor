import { useEffect, useRef, useCallback, useState } from 'react'

const MIN_SCALE = 0.5
const MAX_SCALE = 3.0

/**
 * Calculates distance between two touch points.
 */
function getTouchDistance(t1, t2) {
  const dx = t1.clientX - t2.clientX
  const dy = t1.clientY - t2.clientY
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Detects pinch gestures on <img> and <table> elements within the editor.
 * Scales the element during pinch and applies final width/height on release.
 * Shows a reset-zoom button when an element is zoomed.
 *
 * @param {React.RefObject} editorRef - Ref to the editor content element
 * @returns {{ zoomedElement: Element|null, resetZoom: Function }}
 */
export function usePinchZoom(editorRef) {
  const [zoomedElement, setZoomedElement] = useState(null)
  const pinchRef = useRef(null)
  const scaleRef = useRef(1)

  const resetZoom = useCallback(() => {
    if (zoomedElement) {
      zoomedElement.style.transform = ''
      zoomedElement.style.transformOrigin = ''
      // Reset size attributes
      if (zoomedElement.tagName === 'IMG') {
        zoomedElement.removeAttribute('data-rmx-zoomed')
      } else {
        // For tables, remove the wrapper scale if present
        const wrapper = zoomedElement.closest('.rmx-pinch-zoom-wrapper')
        if (wrapper) {
          wrapper.style.transform = ''
        }
        zoomedElement.removeAttribute('data-rmx-zoomed')
      }
      setZoomedElement(null)
    }
  }, [zoomedElement])

  const handleTouchStart = useCallback((e) => {
    if (e.touches.length !== 2) return

    // Find if pinching on an img or table
    const target = e.target
    const zoomable = target.closest('img, table')
    if (!zoomable) return

    e.preventDefault()

    const initialDistance = getTouchDistance(e.touches[0], e.touches[1])

    // Get the current scale of the element
    const currentTransform = zoomable.style.transform
    const match = currentTransform.match(/scale\(([^)]+)\)/)
    const currentScale = match ? parseFloat(match[1]) : 1

    pinchRef.current = {
      element: zoomable,
      initialDistance,
      initialScale: currentScale,
    }

    zoomable.style.transformOrigin = 'center center'
  }, [])

  const handleTouchMove = useCallback((e) => {
    if (!pinchRef.current || e.touches.length !== 2) return

    e.preventDefault()

    const currentDistance = getTouchDistance(e.touches[0], e.touches[1])
    const { initialDistance, initialScale, element } = pinchRef.current

    let newScale = initialScale * (currentDistance / initialDistance)
    newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale))
    scaleRef.current = newScale

    element.style.transform = `scale(${newScale})`
  }, [])

  const handleTouchEnd = useCallback((e) => {
    if (!pinchRef.current) return

    const { element } = pinchRef.current
    const finalScale = scaleRef.current

    if (!element || !element.isConnected) return

    if (Math.abs(finalScale - 1) > 0.05) {
      // Apply the scale by adjusting dimensions
      if (element.tagName === 'IMG') {
        const rect = element.getBoundingClientRect()
        const newWidth = Math.round(rect.width)
        const newHeight = Math.round(rect.height)
        element.style.transform = ''
        element.setAttribute('width', newWidth)
        element.setAttribute('height', newHeight)
        element.style.width = `${newWidth}px`
        element.style.height = `${newHeight}px`
        element.setAttribute('data-rmx-zoomed', 'true')
        setZoomedElement(element)
      } else if (element.tagName === 'TABLE') {
        // Keep the transform for tables since they have complex layouts
        element.setAttribute('data-rmx-zoomed', 'true')
        setZoomedElement(element)
      }
    } else {
      // Scale is close to 1, reset
      element.style.transform = ''
      element.style.transformOrigin = ''
    }

    pinchRef.current = null
    scaleRef.current = 1
  }, [])

  useEffect(() => {
    const el = editorRef?.current
    if (!el) return

    el.addEventListener('touchstart', handleTouchStart, { passive: false })
    el.addEventListener('touchmove', handleTouchMove, { passive: false })
    el.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      el.removeEventListener('touchstart', handleTouchStart)
      el.removeEventListener('touchmove', handleTouchMove)
      el.removeEventListener('touchend', handleTouchEnd)
    }
  }, [editorRef, handleTouchStart, handleTouchMove, handleTouchEnd])

  return { zoomedElement, resetZoom }
}
