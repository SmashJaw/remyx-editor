/**
 * Distraction-free mode — hides toolbar, status bar, and menu bar.
 * Chrome elements reappear on mouse movement (3s timeout to re-hide).
 * Toggle via command or Mod+Shift+D shortcut.
 */

let hideTimer = null

export function registerDistractionFreeCommands(engine) {
  engine.commands.register('distractionFree', {
    execute(eng) {
      const root = eng.element.closest('.rmx-editor')
      if (!root) return

      const isActive = root.classList.contains('rmx-distraction-free')
      if (isActive) {
        root.classList.remove('rmx-distraction-free')
        root.classList.remove('rmx-df-show-chrome')
        root.removeEventListener('mousemove', showChrome)
        clearTimeout(hideTimer)
      } else {
        root.classList.add('rmx-distraction-free')
        root.addEventListener('mousemove', showChrome)
      }
      eng.eventBus.emit('distractionFree:toggle', { active: !isActive })
    },
    isActive(eng) {
      const root = eng.element.closest('.rmx-editor')
      return root ? root.classList.contains('rmx-distraction-free') : false
    },
    shortcut: 'mod+shift+d',
    meta: { icon: 'distractionFree', tooltip: 'Distraction-Free Mode' },
  })
}

function showChrome(e) {
  const root = e.currentTarget
  if (!root.classList.contains('rmx-distraction-free')) return

  root.classList.add('rmx-df-show-chrome')
  clearTimeout(hideTimer)
  hideTimer = setTimeout(() => {
    root.classList.remove('rmx-df-show-chrome')
  }, 3000)
}
