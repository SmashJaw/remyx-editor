import React, { useEffect, useRef, useCallback } from 'react'
import PropTypes from 'prop-types'
import { CloseIcon } from '../../icons/index.jsx'

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), textarea, input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

function ModalOverlayInner({ title, open, onClose, children, width = 420 }) {
  const ref = useRef(null)
  const previousFocusRef = useRef(null)
  const focusableRef = useRef([])

  // Save previously focused element when opening
  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement
    }
  }, [open])

  // Restore focus to previously focused element on close
  useEffect(() => {
    if (!open && previousFocusRef.current) {
      const el = previousFocusRef.current
      previousFocusRef.current = null
      // Delay to allow DOM to settle after modal unmount
      requestAnimationFrame(() => {
        if (el && typeof el.focus === 'function') el.focus()
      })
    }
  }, [open])

  // Focus the first focusable element on open
  useEffect(() => {
    if (open && ref.current) {
      // Prefer input/textarea/select, fall back to any focusable element
      const firstInput = ref.current.querySelector('input, textarea, select')
      const firstFocusable = firstInput || ref.current.querySelector(FOCUSABLE_SELECTOR)
      if (firstFocusable) firstFocusable.focus()
    }
  }, [open])

  // Cache focusable elements when modal opens or content changes
  useEffect(() => {
    if (open && ref.current) {
      focusableRef.current = Array.from(ref.current.querySelectorAll(FOCUSABLE_SELECTOR))
    }
  }, [open])

  // Handle Escape and focus trapping (Tab / Shift+Tab)
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      onClose()
      return
    }

    if (e.key === 'Tab' && ref.current) {
      const focusable = focusableRef.current.length > 0 ? focusableRef.current : Array.from(ref.current.querySelectorAll(FOCUSABLE_SELECTOR))
      if (focusable.length === 0) {
        e.preventDefault()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey) {
        // Shift+Tab: if focus is on first element, wrap to last
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        // Tab: if focus is on last element, wrap to first
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
  }, [onClose])

  if (!open) return null

  return (
    <div className="rmx-modal-overlay" onClick={onClose} onKeyDown={handleKeyDown}>
      <div
        ref={ref}
        className="rmx-modal"
        style={{ maxWidth: width }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="rmx-modal-header">
          <h3 className="rmx-modal-title">{title}</h3>
          <button className="rmx-modal-close" onClick={onClose} type="button" aria-label="Close">
            <CloseIcon size={18} />
          </button>
        </div>
        <div className="rmx-modal-body">
          {children}
        </div>
      </div>
    </div>
  )
}

export const ModalOverlay = React.memo(ModalOverlayInner)

ModalOverlay.propTypes = {
  title: PropTypes.string.isRequired,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node,
  width: PropTypes.number,
}
