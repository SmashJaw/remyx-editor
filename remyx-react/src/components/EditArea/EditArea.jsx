import { forwardRef } from 'react'
import PropTypes from 'prop-types'

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

EditArea.propTypes = {
  style: PropTypes.object,
  readOnly: PropTypes.bool,
  className: PropTypes.string,
  id: PropTypes.string,
}
