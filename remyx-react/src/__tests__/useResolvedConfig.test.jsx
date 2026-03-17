import React from 'react'
import { renderHook } from '@testing-library/react'
import { useResolvedConfig, DEFAULT_EDITOR_HEIGHT } from '../hooks/useResolvedConfig.js'
import { RemyxConfigProvider } from '../config/RemyxConfigProvider.jsx'

// Mock @remyxjs/core defaults
jest.mock('@remyxjs/core', () => ({
  DEFAULT_TOOLBAR: [['bold', 'italic', 'underline'], ['link', 'image']],
  DEFAULT_FONTS: ['Arial', 'Verdana'],
  DEFAULT_MENU_BAR: [
    { label: 'Edit', items: ['undo', 'redo'] },
    { label: 'Format', items: ['bold', 'italic'] },
  ],
}))

// Mock collectMenuBarCommands
jest.mock('../components/MenuBar/MenuBar.jsx', () => ({
  collectMenuBarCommands: jest.fn((config) => {
    const cmds = new Set()
    for (const menu of config) {
      for (const item of menu.items) {
        if (typeof item === 'string') cmds.add(item)
      }
    }
    return cmds
  }),
}))

describe('useResolvedConfig', () => {
  it('returns default values when no props or provider', () => {
    const { result } = renderHook(() => useResolvedConfig({}))

    expect(result.current.theme).toBe('light')
    expect(result.current.placeholder).toBe('')
    expect(result.current.height).toBe(DEFAULT_EDITOR_HEIGHT)
    expect(result.current.readOnly).toBe(false)
    expect(result.current.outputFormat).toBe('html')
    expect(result.current.showFloatingToolbar).toBe(true)
    expect(result.current.showContextMenu).toBe(true)
    expect(result.current.statusBar).toBe('bottom')
    expect(result.current.className).toBe('')
  })

  it('uses prop values when provided', () => {
    const { result } = renderHook(() =>
      useResolvedConfig({
        theme: 'dark',
        placeholder: 'Write here...',
        height: 500,
        readOnly: true,
        outputFormat: 'markdown',
      })
    )

    expect(result.current.theme).toBe('dark')
    expect(result.current.placeholder).toBe('Write here...')
    expect(result.current.height).toBe(500)
    expect(result.current.readOnly).toBe(true)
    expect(result.current.outputFormat).toBe('markdown')
  })

  it('merges provider config with props, props taking priority', () => {
    const config = {
      theme: 'dark',
      placeholder: 'From config',
      height: 400,
    }

    const wrapper = ({ children }) => (
      <RemyxConfigProvider config={config}>{children}</RemyxConfigProvider>
    )

    const { result } = renderHook(
      () => useResolvedConfig({ theme: 'light', placeholder: 'From props' }),
      { wrapper }
    )

    expect(result.current.theme).toBe('light')
    expect(result.current.placeholder).toBe('From props')
    // height comes from config since not overridden by props
    expect(result.current.height).toBe(400)
  })

  it('resolves named editor config from provider', () => {
    const config = {
      theme: 'dark',
      height: 300,
      editors: {
        minimal: {
          height: 200,
          placeholder: 'Minimal editor',
        },
      },
    }

    const wrapper = ({ children }) => (
      <RemyxConfigProvider config={config}>{children}</RemyxConfigProvider>
    )

    const { result } = renderHook(
      () => useResolvedConfig({ config: 'minimal' }),
      { wrapper }
    )

    expect(result.current.height).toBe(200)
    expect(result.current.placeholder).toBe('Minimal editor')
    expect(result.current.theme).toBe('dark')
  })

  it('resolves menuBarConfig when menuBar=true', () => {
    const { result } = renderHook(() =>
      useResolvedConfig({ menuBar: true })
    )

    // menuBar=true should resolve to DEFAULT_MENU_BAR
    expect(result.current.menuBarConfig).toEqual([
      { label: 'Edit', items: ['undo', 'redo'] },
      { label: 'Format', items: ['bold', 'italic'] },
    ])
  })

  it('resolves menuBarConfig when menuBar is an array', () => {
    const customMenu = [{ label: 'File', items: ['save'] }]
    const { result } = renderHook(() =>
      useResolvedConfig({ menuBar: customMenu })
    )

    expect(result.current.menuBarConfig).toEqual(customMenu)
  })

  it('sets menuBarConfig to null when menuBar is not provided', () => {
    const { result } = renderHook(() => useResolvedConfig({}))
    expect(result.current.menuBarConfig).toBeNull()
  })

  it('deduplicates toolbar items that appear in menu bar', () => {
    // menuBar=true with default toolbar: bold and italic are in the menu bar
    const { result } = renderHook(() =>
      useResolvedConfig({ menuBar: true })
    )

    // effectiveToolbar should not include 'bold' or 'italic' since they are in menu bar
    const allItems = result.current.effectiveToolbar.flat()
    expect(allItems).not.toContain('bold')
    expect(allItems).not.toContain('italic')
    // 'underline', 'link', 'image' should remain
    expect(allItems).toContain('underline')
    expect(allItems).toContain('link')
    expect(allItems).toContain('image')
  })

  it('does not deduplicate toolbar when toolbar prop is explicitly passed', () => {
    const customToolbar = [['bold', 'italic']]
    const { result } = renderHook(() =>
      useResolvedConfig({ menuBar: true, toolbar: customToolbar })
    )

    // When toolbar is explicitly provided, no dedup happens
    expect(result.current.effectiveToolbar).toEqual(customToolbar)
  })

  it('handles undefined and null prop values gracefully', () => {
    const { result } = renderHook(() =>
      useResolvedConfig({
        theme: undefined,
        placeholder: undefined,
        height: undefined,
      })
    )

    // Should fall back to defaults
    expect(result.current.theme).toBe('light')
    expect(result.current.placeholder).toBe('')
    expect(result.current.height).toBe(DEFAULT_EDITOR_HEIGHT)
  })
})
