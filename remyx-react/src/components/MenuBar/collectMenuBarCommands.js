/**
 * Collect all command names from a menu bar config (recursively through submenus).
 * Extracted to a separate module so useResolvedConfig can import it without
 * pulling in the full MenuBar React component (which is lazy-loaded).
 */
export function collectMenuBarCommands(menuBarConfig) {
  const commands = new Set()
  const walk = (items) => {
    for (const item of items) {
      if (typeof item === 'string' && item !== '---') {
        commands.add(item)
      } else if (typeof item === 'object' && item.items) {
        walk(item.items)
      }
    }
  }
  for (const menu of menuBarConfig) {
    walk(menu.items)
  }
  return commands
}
