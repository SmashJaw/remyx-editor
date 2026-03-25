import React from 'react'
import PropTypes from 'prop-types'

export const ToolbarSeparator = React.memo(function ToolbarSeparator({ separatorStyle }) {
  return <div className="rmx-toolbar-separator" role="separator" style={separatorStyle || undefined} />
})

ToolbarSeparator.propTypes = {
  separatorStyle: PropTypes.object,
}
