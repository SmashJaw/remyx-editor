import React, { useEffect, useRef } from 'react'
import { CloseIcon } from '../../icons/index.jsx'

export function ModalOverlay({ title, open, onClose, children, width = 420 }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  useEffect(() => {
    if (open && ref.current) {
      const firstInput = ref.current.querySelector('input, textarea, select')
      if (firstInput) firstInput.focus()
    }
  }, [open])

  if (!open) return null

  return (
    <div className="rmx-modal-overlay" onClick={onClose}>
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
