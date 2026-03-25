/**
 * Lightweight djb2 hash function for fast string comparison.
 * Returns a 32-bit integer hash.
 * @param {string} str
 * @returns {number}
 */
export function djb2Hash(str) {
  let hash = 5381
  for (let i = 0, len = str.length; i < len; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0
  }
  return hash
}
