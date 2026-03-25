export function registerSourceModeCommands(engine) {
  engine.commands.register('sourceMode', {
    execute(eng) {
      eng.isSourceMode = !eng.isSourceMode
      eng.eventBus.emit('mode:change', { sourceMode: eng.isSourceMode })
    },
    isActive(eng) {
      return eng.isSourceMode
    },
    shortcut: 'mod+shift+u',
    meta: { icon: 'sourceMode', tooltip: 'Source Code' },
  })
}
