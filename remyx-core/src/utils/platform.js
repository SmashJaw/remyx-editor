let _isMac = null

export function isMac() {
  if (_isMac === null) {
    _isMac = typeof navigator !== 'undefined' && (
      navigator.userAgentData?.platform === 'macOS' ||
      /Mac|iPod|iPhone|iPad/.test(navigator.platform || navigator.userAgent)
    )
  }
  return _isMac
}

export function getModKey() {
  return isMac() ? '⌘' : 'Ctrl'
}
