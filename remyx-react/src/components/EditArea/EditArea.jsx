import { forwardRef } from 'react'

export const EditArea = forwardRef(function EditArea({ style, readOnly, className = '', id }, ref) {
  return (
    <div className={`rmx-edit-area ${className}`} id={id}>
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
