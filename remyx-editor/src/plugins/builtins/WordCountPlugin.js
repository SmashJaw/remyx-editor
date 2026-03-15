import { createPlugin } from '../createPlugin.js'

export function WordCountPlugin() {
  let observer = null
  let debounceTimer = null

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

      // Debounced update for high-frequency events (MutationObserver, input)
      const debouncedUpdate = () => {
        clearTimeout(debounceTimer)
        debounceTimer = setTimeout(update, 50)
      }

      // Primary: listen for content:change events from the engine
      engine.eventBus.on('content:change', update)

      // Fallback: MutationObserver catches any DOM changes that don't
      // trigger content:change (e.g. paste in some browsers, execCommand
      // edge cases, or third-party extensions modifying content)
      observer = new MutationObserver(debouncedUpdate)
      observer.observe(engine.element, {
        childList: true,
        subtree: true,
        characterData: true,
      })

      update()
    },

    destroy() {
      clearTimeout(debounceTimer)
      if (observer) {
        observer.disconnect()
        observer = null
      }
    },
  })
}
