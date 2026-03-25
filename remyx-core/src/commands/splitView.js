/**
 * Split view — side-by-side preview pane showing rendered HTML or markdown.
 * Toggle via command or Mod+Shift+V shortcut.
 */

export function registerSplitViewCommands(engine) {
  engine.commands.register('toggleSplitView', {
    execute(eng) {
      const root = eng.element.closest('.rmx-editor')
      if (!root) return

      const isActive = root.classList.contains('rmx-split-view')
      if (isActive) {
        root.classList.remove('rmx-split-view')
      } else {
        root.classList.add('rmx-split-view')
      }
      eng.eventBus.emit('splitView:toggle', { active: !isActive })
    },
    isActive(eng) {
      const root = eng.element.closest('.rmx-editor')
      return root ? root.classList.contains('rmx-split-view') : false
    },
    shortcut: 'mod+shift+v',
    meta: { icon: 'splitView', tooltip: 'Split View' },
  })
}
