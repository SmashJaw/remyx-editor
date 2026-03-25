// Track how many editors are currently fullscreen so we only restore
// document.body.style.overflow when the last one exits.
let fullscreenCount = 0

export function registerFullscreenCommands(engine) {
  engine.commands.register('fullscreen', {
    execute(eng) {
      const root = eng.element.closest('.rmx-editor')
      if (!root) return

      const isFullscreen = root.classList.contains('rmx-fullscreen')
      if (isFullscreen) {
        root.classList.remove('rmx-fullscreen')
        fullscreenCount = Math.max(0, fullscreenCount - 1)
        if (fullscreenCount === 0) {
          document.body.style.overflow = ''
        }
      } else {
        root.classList.add('rmx-fullscreen')
        fullscreenCount++
        document.body.style.overflow = 'hidden'
      }
      eng.eventBus.emit('fullscreen:toggle', { fullscreen: !isFullscreen })
    },
    isActive(eng) {
      const root = eng.element.closest('.rmx-editor')
      return root ? root.classList.contains('rmx-fullscreen') : false
    },
    shortcut: 'mod+shift+f',
    meta: { icon: 'fullscreen', tooltip: 'Fullscreen' },
  })
}
