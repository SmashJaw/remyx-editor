import React from 'react'

/**
 * Create a stroke-based SVG icon component from a path or child elements.
 * @param {string|React.ReactNode} d - SVG path string or child elements
 * @param {string} [viewBox='0 0 24 24'] - SVG viewBox attribute
 * @returns {React.FC<{size?: number, className?: string}>}
 */
export const icon = (d, viewBox = '0 0 24 24') => ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox={viewBox} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`rmx-icon ${className}`}>
    {typeof d === 'string' ? <path d={d} /> : d}
  </svg>
)

/**
 * Create a filled SVG icon component from child elements.
 * @param {React.ReactNode} children - SVG child elements
 * @param {string} [viewBox='0 0 24 24'] - SVG viewBox attribute
 * @returns {React.FC<{size?: number, className?: string}>}
 */
export const filled = (children, viewBox = '0 0 24 24') => ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox={viewBox} fill="currentColor" className={`rmx-icon ${className}`}>
    {children}
  </svg>
)
