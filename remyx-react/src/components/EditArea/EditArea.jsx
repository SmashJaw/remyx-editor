import React, { forwardRef } from 'react'

export const EditArea = forwardRef(function EditArea({ style, readOnly, className = '' }, ref) {
  return (
    <div className={`rmx-edit-area ${className}`}>
      <div
        ref={ref}
        className="rmx-content"
        style={style}
        suppressContentEditableWarning
      />
      {readOnly && <div className="rmx-readonly-overlay" />}
    </div>
  )
})
