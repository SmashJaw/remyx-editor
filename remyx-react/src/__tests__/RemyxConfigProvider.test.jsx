import React from 'react'
import { render, screen } from '@testing-library/react'
import { renderHook } from '@testing-library/react'
import { RemyxConfigProvider, useRemyxConfig } from '../config/RemyxConfigProvider.jsx'

describe('RemyxConfigProvider', () => {
  it('provides config to children via useRemyxConfig', () => {
    const config = {
      theme: 'dark',
      height: 500,
      placeholder: 'Test placeholder',
    }

    const wrapper = ({ children }) => (
      <RemyxConfigProvider config={config}>{children}</RemyxConfigProvider>
    )

    const { result } = renderHook(() => useRemyxConfig(), { wrapper })

    expect(result.current.theme).toBe('dark')
    expect(result.current.height).toBe(500)
    expect(result.current.placeholder).toBe('Test placeholder')
  })

  it('returns null when used outside provider', () => {
    const { result } = renderHook(() => useRemyxConfig())

    expect(result.current).toBeNull()
  })

  it('returns default config (without editors key) when no configName specified', () => {
    const config = {
      theme: 'dark',
      height: 400,
      editors: {
        minimal: { height: 200 },
      },
    }

    const wrapper = ({ children }) => (
      <RemyxConfigProvider config={config}>{children}</RemyxConfigProvider>
    )

    const { result } = renderHook(() => useRemyxConfig(), { wrapper })

    expect(result.current.theme).toBe('dark')
    expect(result.current.height).toBe(400)
    // editors key should not be in the returned config
    expect(result.current.editors).toBeUndefined()
  })

  it('resolves named editor config merged with defaults', () => {
    const config = {
      theme: 'dark',
      height: 400,
      placeholder: 'Default',
      editors: {
        minimal: {
          height: 200,
          placeholder: 'Minimal',
        },
      },
    }

    const wrapper = ({ children }) => (
      <RemyxConfigProvider config={config}>{children}</RemyxConfigProvider>
    )

    const { result } = renderHook(() => useRemyxConfig('minimal'), { wrapper })

    // Named config overrides
    expect(result.current.height).toBe(200)
    expect(result.current.placeholder).toBe('Minimal')
    // Default config inherited
    expect(result.current.theme).toBe('dark')
  })

  it('returns defaults when configName does not exist in editors', () => {
    const config = {
      theme: 'dark',
      height: 400,
      editors: {
        minimal: { height: 200 },
      },
    }

    const wrapper = ({ children }) => (
      <RemyxConfigProvider config={config}>{children}</RemyxConfigProvider>
    )

    const { result } = renderHook(() => useRemyxConfig('nonexistent'), { wrapper })

    // Falls back to defaults since 'nonexistent' is not in editors
    expect(result.current.theme).toBe('dark')
    expect(result.current.height).toBe(400)
  })

  it('renders children correctly', () => {
    const config = { theme: 'light' }

    render(
      <RemyxConfigProvider config={config}>
        <div>Child component</div>
      </RemyxConfigProvider>
    )

    expect(screen.getByText('Child component')).toBeTruthy()
  })

  it('handles config without editors key', () => {
    const config = {
      theme: 'dark',
      height: 300,
    }

    const wrapper = ({ children }) => (
      <RemyxConfigProvider config={config}>{children}</RemyxConfigProvider>
    )

    const { result } = renderHook(() => useRemyxConfig('anything'), { wrapper })

    // No editors defined, so returns defaults
    expect(result.current.theme).toBe('dark')
    expect(result.current.height).toBe(300)
  })
})
