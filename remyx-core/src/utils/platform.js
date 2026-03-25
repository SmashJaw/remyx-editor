let _isMac = null

export function isMac() {
  if (_isMac === null) {
    _isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform)
  }
  return _isMac
}

export function getModKey() {
  return isMac() ? '⌘' : 'Ctrl'
}
