import React from 'react'

/**
 * Full-editor overlay shown when external content (files, images, rich text)
 * is dragged over the editor from the desktop or another application.
 *
 * Renders a translucent overlay with an upload icon and descriptive text.
 * The overlay is pointer-events: none so it doesn't interfere with drop targeting.
 */
export function DropZoneOverlay({ visible, fileTypes }) {
  if (!visible) return null

  const hasImages = fileTypes.includes('Files') || fileTypes.some(t => t.startsWith('image/'))
  const label = hasImages ? 'Drop files here' : 'Drop content here'
  const hint = hasImages ? 'Images, documents, and rich text' : 'Rich text and HTML content'

  return (
    <div className="rmx-drop-zone-overlay" aria-hidden="true">
      <svg
        className="rmx-drop-zone-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      <span className="rmx-drop-zone-text">{label}</span>
      <span className="rmx-drop-zone-hint">{hint}</span>
    </div>
  )
}
