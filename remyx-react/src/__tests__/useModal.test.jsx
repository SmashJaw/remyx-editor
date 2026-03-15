import { renderHook, act } from '@testing-library/react'
import { useModal } from '../hooks/useModal.js'

describe('useModal', () => {
  it('initializes all modals as closed', () => {
    const { result } = renderHook(() => useModal())

    expect(result.current.isOpen('link')).toBe(false)
    expect(result.current.isOpen('image')).toBe(false)
    expect(result.current.isOpen('table')).toBe(false)
    expect(result.current.isOpen('embed')).toBe(false)
    expect(result.current.isOpen('findReplace')).toBe(false)
    expect(result.current.isOpen('source')).toBe(false)
    expect(result.current.isOpen('export')).toBe(false)
  })

  it('opens a modal', () => {
    const { result } = renderHook(() => useModal())

    act(() => {
      result.current.openModal('link')
    })

    expect(result.current.isOpen('link')).toBe(true)
    // Others remain closed
    expect(result.current.isOpen('image')).toBe(false)
  })

  it('closes a modal', () => {
    const { result } = renderHook(() => useModal())

    act(() => {
      result.current.openModal('link')
    })
    expect(result.current.isOpen('link')).toBe(true)

    act(() => {
      result.current.closeModal('link')
    })
    expect(result.current.isOpen('link')).toBe(false)
  })

  it('passes data when opening a modal', () => {
    const { result } = renderHook(() => useModal())
    const linkData = { url: 'https://example.com', text: 'Example' }

    act(() => {
      result.current.openModal('link', linkData)
    })

    expect(result.current.getData('link')).toEqual(linkData)
  })

  it('clears data when closing a modal', () => {
    const { result } = renderHook(() => useModal())

    act(() => {
      result.current.openModal('link', { url: 'https://example.com' })
    })
    expect(result.current.getData('link')).toBeTruthy()

    act(() => {
      result.current.closeModal('link')
    })
    expect(result.current.getData('link')).toBeNull()
  })

  it('handles multiple modals independently', () => {
    const { result } = renderHook(() => useModal())

    act(() => {
      result.current.openModal('link', { url: 'test' })
      result.current.openModal('image', { src: 'image.png' })
    })

    expect(result.current.isOpen('link')).toBe(true)
    expect(result.current.isOpen('image')).toBe(true)
    expect(result.current.getData('link')).toEqual({ url: 'test' })
    expect(result.current.getData('image')).toEqual({ src: 'image.png' })

    act(() => {
      result.current.closeModal('link')
    })

    expect(result.current.isOpen('link')).toBe(false)
    expect(result.current.isOpen('image')).toBe(true)
  })

  it('returns false for isOpen on unknown modal names', () => {
    const { result } = renderHook(() => useModal())

    expect(result.current.isOpen('nonexistent')).toBe(false)
  })

  it('returns null for getData on unknown modal names', () => {
    const { result } = renderHook(() => useModal())

    expect(result.current.getData('nonexistent')).toBeNull()
  })

  it('returns null for getData when modal has no data', () => {
    const { result } = renderHook(() => useModal())

    act(() => {
      result.current.openModal('link')
    })

    expect(result.current.getData('link')).toBeNull()
  })

  it('exposes the modals state object', () => {
    const { result } = renderHook(() => useModal())

    expect(result.current.modals).toBeDefined()
    expect(result.current.modals.link).toEqual({ open: false, data: null })
  })
})
