import { DEFAULT_MAX_FILE_SIZE } from '../constants/defaults.js'

/**
 * Check if a file exceeds the given maximum size.
 * Emits a 'file:too-large' event on the provided eventBus and logs a warning.
 *
 * @param {File} file - The file to check
 * @param {number} maxBytes - Maximum allowed file size in bytes (0 = no limit)
 * @param {{ eventBus?: { emit: Function } }} [context] - Optional context with eventBus for emitting events
 * @returns {boolean} true if the file exceeds the limit
 */
export function exceedsMaxFileSize(file, maxBytes, context) {
  const maxSize = maxBytes ?? DEFAULT_MAX_FILE_SIZE
  if (maxSize > 0 && file.size > maxSize) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1)
    const limitMB = (maxSize / (1024 * 1024)).toFixed(0)
    console.warn(`[Remyx] File "${file.name}" (${sizeMB} MB) exceeds the ${limitMB} MB limit.`)
    if (context?.eventBus) {
      context.eventBus.emit('file:too-large', { file, maxSize })
    }
    return true
  }
  return false
}
