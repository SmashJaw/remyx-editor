import { createPlugin } from '../createPlugin.js'

export function WordCountPlugin() {
  let debounceTimer = null
  let unsubContentChange = null

  return createPlugin({
    name: 'wordCount',
    requiresFullAccess: true, // Writes to engine._wordCount
    init(engine) {
      const update = () => {
        const text = engine.getText().trim()
        const wordCount = text ? text.split(/\s+/).length : 0
        const charCount = engine.getText().length
        const data = { wordCount, charCount }
        engine._wordCount = data
        engine.eventBus.emit('wordcount:update', data)
      }

      // Task 248: Removed MutationObserver. Debounce content:change handler with 100ms timeout.
      const debouncedUpdate = () => {
        clearTimeout(debounceTimer)
        debounceTimer = setTimeout(update, 100)
      }

      // Listen for content:change events from the engine (debounced)
      unsubContentChange = engine.eventBus.on('content:change', debouncedUpdate)

      update()
    },

    destroy() {
      clearTimeout(debounceTimer)
      if (unsubContentChange) {
        unsubContentChange()
        unsubContentChange = null
      }
    },
  })
}
