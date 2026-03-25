import { createPlugin } from '../createPlugin.js'

export function PlaceholderPlugin(placeholderText = 'Start typing...') {
  return createPlugin({
    name: 'placeholder',
    requiresFullAccess: true, // Needs direct eventBus and element access
    init(engine) {
      const update = () => {
        if (engine.isEmpty()) {
          engine.element.setAttribute('data-placeholder', placeholderText)
          engine.element.classList.add('rmx-empty')
        } else {
          engine.element.classList.remove('rmx-empty')
        }
      }
      engine.eventBus.on('content:change', update)
      engine.eventBus.on('focus', update)
      engine.eventBus.on('blur', update)
      update()
    },
  })
}
