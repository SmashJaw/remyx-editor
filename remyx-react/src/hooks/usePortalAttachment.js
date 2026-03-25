import { useState, useCallback, useEffect, useRef } from 'react'

/**
 * Manages portal-based attachment to existing textarea/div elements.
 * Handles initial content extraction, portal container creation/cleanup,
 * and syncing changes back to the original element.
 */
export function usePortalAttachment({ attachTo, value, defaultValue, onChange }) {
  const [portalContainer, setPortalContainer] = useState(null)
  const [attachedInitialContent, setAttachedInitialContent] = useState(undefined)
  const attachCleanupRef = useRef(null)

  useEffect(() => {
    const target = attachTo?.current
    if (!target) {
      setPortalContainer(null)
      return
    }

    const tag = target.tagName.toLowerCase()
    const isFormElement = tag === 'textarea' || tag === 'input'

    // Read initial content from the target element
    if (value === undefined && defaultValue === undefined) {
      const initial = isFormElement ? (target.value || '') : (target.innerHTML || '')
      setAttachedInitialContent(initial)
    }

    // Create portal container div
    const container = document.createElement('div')

    if (isFormElement) {
      // Hide the original form element and insert the editor after it
      target.style.display = 'none'
      target.parentNode.insertBefore(container, target.nextSibling)

      attachCleanupRef.current = () => {
        target.style.display = ''
        if (container.parentNode) container.parentNode.removeChild(container)
      }
    } else {
      // For divs/other elements: save original content as text, render editor inside
      const originalContent = target.innerHTML
      target.innerHTML = ''
      target.appendChild(container)

      attachCleanupRef.current = () => {
        target.innerHTML = originalContent
      }
    }

    setPortalContainer(container)

    return () => {
      if (attachCleanupRef.current) {
        attachCleanupRef.current()
        attachCleanupRef.current = null
      }
      setPortalContainer(null)
    }
  }, [attachTo]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync changes back to the attached element
  const handleChange = useCallback((html) => {
    if (attachTo?.current) {
      const tag = attachTo.current.tagName.toLowerCase()
      if (tag === 'textarea' || tag === 'input') {
        attachTo.current.value = html
      }
    }
    onChange?.(html)
  }, [attachTo, onChange])

  // Determine the effective value and onChange
  const effectiveValue = value !== undefined ? value : attachedInitialContent
  const effectiveOnChange = attachTo ? handleChange : onChange

  return { portalContainer, effectiveValue, effectiveOnChange }
}
