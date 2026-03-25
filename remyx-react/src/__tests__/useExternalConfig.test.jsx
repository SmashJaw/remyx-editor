import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useExternalConfig } from '../hooks/useExternalConfig.js'

describe('useExternalConfig', () => {
  let originalFetch

  beforeEach(() => {
    originalFetch = globalThis.fetch
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  function mockFetch(config) {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify(config)),
      })
    )
  }

  function mockFetchError(status = 500) {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status,
        text: () => Promise.resolve('Error'),
      })
    )
  }

  it('starts in loading state', () => {
    mockFetch({ theme: 'dark' })
    const { result } = renderHook(() => useExternalConfig('https://example.com/config.json'))
    expect(result.current.loading).toBe(true)
    expect(result.current.config).toBeNull()
  })

  it('loads config from URL', async () => {
    const config = { theme: 'dark', height: 500 }
    mockFetch(config)

    const { result } = renderHook(() => useExternalConfig('https://example.com/config.json'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.config).toEqual(config)
      expect(result.current.error).toBeNull()
    })
  })

  it('sets error state on fetch failure', async () => {
    mockFetchError(404)

    const { result } = renderHook(() => useExternalConfig('https://example.com/config.json'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeTruthy()
      expect(result.current.config).toBeNull()
    })
  })

  it('calls onLoad callback when config is loaded', async () => {
    const config = { theme: 'dark' }
    mockFetch(config)
    const onLoad = vi.fn()

    renderHook(() => useExternalConfig('https://example.com/config.json', { onLoad }))

    await waitFor(() => {
      expect(onLoad).toHaveBeenCalledWith(config)
    })
  })

  it('calls onError callback on failure', async () => {
    mockFetchError(500)
    const onError = vi.fn()

    renderHook(() => useExternalConfig('https://example.com/config.json', { onError }))

    await waitFor(() => {
      expect(onError).toHaveBeenCalled()
    })
  })

  it('reload() re-fetches config', async () => {
    const config1 = { theme: 'light' }
    const config2 = { theme: 'dark' }
    let callCount = 0
    globalThis.fetch = vi.fn(() => {
      callCount++
      const c = callCount === 1 ? config1 : config2
      return Promise.resolve({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify(c)),
      })
    })

    const { result } = renderHook(() => useExternalConfig('https://example.com/config.json'))

    await waitFor(() => {
      expect(result.current.config).toEqual(config1)
    })

    await act(async () => {
      await result.current.reload()
    })

    expect(result.current.config).toEqual(config2)
  })

  it('returns null config when no URL is provided', () => {
    const { result } = renderHook(() => useExternalConfig(null))
    expect(result.current.config).toBeNull()
    expect(result.current.loading).toBe(false)
  })

  it('passes env option to loadConfig for merging', async () => {
    const config = {
      theme: 'light',
      env: {
        production: { theme: 'dark', readOnly: true },
      },
    }
    mockFetch(config)

    const { result } = renderHook(() =>
      useExternalConfig('https://example.com/config.json', { env: 'production' })
    )

    await waitFor(() => {
      expect(result.current.config).toEqual({ theme: 'dark', readOnly: true })
    })
  })
})
