import { escapeHTMLAttr } from '../escapeHTML.js'

/**
 * Shared utilities for document converters.
 */

/**
 * Get the file extension from a filename.
 */
export function getExtension(filename) {
  const dot = filename.lastIndexOf('.')
  return dot >= 0 ? filename.slice(dot).toLowerCase() : ''
}

/**
 * Read a file as text.
 */
export function readAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`))
    reader.readAsText(file)
  })
}

/**
 * Read a file as ArrayBuffer.
 */
export function readAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`))
    reader.readAsArrayBuffer(file)
  })
}

/**
 * Escape HTML special characters.
 * Task 261: Re-exports shared escapeHTMLAttr as escapeHtml for backward compatibility.
 */
export function escapeHtml(str) {
  return escapeHTMLAttr(str)
}
