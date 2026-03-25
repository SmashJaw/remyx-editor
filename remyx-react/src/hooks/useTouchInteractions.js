import { useSwipeGesture } from './useSwipeGesture.js'
import { useLongPress } from './useLongPress.js'
import { usePinchZoom } from './usePinchZoom.js'
import { useVirtualKeyboard } from './useVirtualKeyboard.js'

/**
 * Item 19: Detect whether the current device supports touch input.
 * @returns {boolean}
 */
export function isTouchDevice() {
  if (typeof window === 'undefined') return false
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

/**
 * Item 19: Combined touch interactions hook with isTouchDevice() guard.
 * On non-touch devices, all touch hooks are disabled and return no-op values.
 *
 * @param {object} engine - The editor engine instance
 * @param {React.RefObject} editAreaRef - Ref to the editor content element
 * @param {React.RefObject} editorRootRef - Ref to the editor root element
 * @param {object} [options]
 * @param {Function} [options.onDismissToolbar]
 * @param {Function} [options.onLongPress]
 * @param {boolean} [options.contextMenuEnabled=true]
 * @param {boolean} [options.readOnly=false]
 * @returns {{ zoomedElement: Element|null, resetZoom: Function, keyboardVisible: boolean, keyboardHeight: number }}
 */
export function useTouchInteractions(engine, editAreaRef, editorRootRef, options = {}) {
  const isTouch = isTouchDevice()

  // Swipe gestures (indent/outdent on list items)
  useSwipeGesture(
    isTouch ? engine : null,
    isTouch ? editAreaRef : { current: null },
    { onDismissToolbar: options.onDismissToolbar }
  )

  // Long-press context menu
  useLongPress(
    isTouch ? editAreaRef : { current: null },
    options.onLongPress,
    { enabled: isTouch && options.contextMenuEnabled !== false && !options.readOnly }
  )

  // Pinch-to-zoom
  const { zoomedElement, resetZoom } = usePinchZoom(
    isTouch ? editAreaRef : { current: null }
  )

  // Virtual keyboard awareness
  const { keyboardVisible, keyboardHeight } = useVirtualKeyboard(
    isTouch ? engine : null,
    isTouch ? editorRootRef : { current: null }
  )

  return { zoomedElement, resetZoom, keyboardVisible, keyboardHeight }
}
