import { collectMenuBarCommands } from '../components/MenuBar/collectMenuBarCommands.js'

describe('collectMenuBarCommands', () => {
  it('collects top-level string commands', () => {
    const config = [
      { label: 'File', items: ['bold', 'italic', 'underline'] },
    ]
    const result = collectMenuBarCommands(config)
    expect(result.has('bold')).toBe(true)
    expect(result.has('italic')).toBe(true)
    expect(result.has('underline')).toBe(true)
  })

  it('skips separator strings', () => {
    const config = [
      { label: 'Edit', items: ['undo', '---', 'redo'] },
    ]
    const result = collectMenuBarCommands(config)
    expect(result.has('undo')).toBe(true)
    expect(result.has('redo')).toBe(true)
    expect(result.has('---')).toBe(false)
  })

  it('recursively collects from submenus', () => {
    const config = [
      {
        label: 'Format',
        items: [
          'bold',
          { label: 'More', items: ['subscript', 'superscript'] },
        ],
      },
    ]
    const result = collectMenuBarCommands(config)
    expect(result.has('bold')).toBe(true)
    expect(result.has('subscript')).toBe(true)
    expect(result.has('superscript')).toBe(true)
  })

  it('handles multiple menus', () => {
    const config = [
      { label: 'File', items: ['undo'] },
      { label: 'Edit', items: ['redo'] },
    ]
    const result = collectMenuBarCommands(config)
    expect(result.has('undo')).toBe(true)
    expect(result.has('redo')).toBe(true)
  })

  it('returns empty set for empty config', () => {
    const result = collectMenuBarCommands([])
    expect(result.size).toBe(0)
  })

  it('deduplicates commands', () => {
    const config = [
      { label: 'A', items: ['bold'] },
      { label: 'B', items: ['bold'] },
    ]
    const result = collectMenuBarCommands(config)
    expect(result.size).toBe(1)
  })
})
