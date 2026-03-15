import { renderHook, act } from '@testing-library/react'
import { useModal } from '../hooks/useModal.js'

describe('useModal', () => {
  it('should initialize with all modals closed', () => {
    const { result } = renderHook(() => useModal())
    const { modals } = result.current

    expect(modals.link.open).toBe(false)
    expect(modals.image.open).toBe(false)
    expect(modals.table.open).toBe(false)
    expect(modals.embed.open).toBe(false)
    expect(modals.findReplace.open).toBe(false)
    expect(modals.source.open).toBe(false)
    expect(modals.attachment.open).toBe(false)
    expect(modals.importDocument.open).toBe(false)
    expect(modals.export.open).toBe(false)
  })

  it('should open a modal', () => {
    const { result } = renderHook(() => useModal())

    act(() => {
      result.current.openModal('link')
    })

    expect(result.current.modals.link.open).toBe(true)
    expect(result.current.modals.link.data).toBeNull()
  })

  it('should open a modal with data', () => {
    const { result } = renderHook(() => useModal())
    const data = { href: 'https://example.com', text: 'Example' }

    act(() => {
      result.current.openModal('link', data)
    })

    expect(result.current.modals.link.open).toBe(true)
    expect(result.current.modals.link.data).toEqual(data)
  })

  it('should close a modal', () => {
    const { result } = renderHook(() => useModal())

    act(() => {
      result.current.openModal('image')
    })
    expect(result.current.modals.image.open).toBe(true)

    act(() => {
      result.current.closeModal('image')
    })
    expect(result.current.modals.image.open).toBe(false)
    expect(result.current.modals.image.data).toBeNull()
  })

  it('should clear data when closing modal', () => {
    const { result } = renderHook(() => useModal())

    act(() => {
      result.current.openModal('link', { href: 'test' })
    })
    expect(result.current.modals.link.data).toEqual({ href: 'test' })

    act(() => {
      result.current.closeModal('link')
    })
    expect(result.current.modals.link.data).toBeNull()
  })

  it('should not affect other modals when opening one', () => {
    const { result } = renderHook(() => useModal())

    act(() => {
      result.current.openModal('link')
    })

    expect(result.current.modals.link.open).toBe(true)
    expect(result.current.modals.image.open).toBe(false)
    expect(result.current.modals.table.open).toBe(false)
  })

  describe('isOpen', () => {
    it('should return false for closed modals', () => {
      const { result } = renderHook(() => useModal())
      expect(result.current.isOpen('link')).toBe(false)
    })

    it('should return true for open modals', () => {
      const { result } = renderHook(() => useModal())

      act(() => {
        result.current.openModal('link')
      })
      expect(result.current.isOpen('link')).toBe(true)
    })

    it('should return false for unknown modal names', () => {
      const { result } = renderHook(() => useModal())
      expect(result.current.isOpen('nonexistent')).toBe(false)
    })
  })

  describe('getData', () => {
    it('should return null when no data', () => {
      const { result } = renderHook(() => useModal())
      expect(result.current.getData('link')).toBeNull()
    })

    it('should return data when set', () => {
      const { result } = renderHook(() => useModal())
      const data = { href: 'https://example.com' }

      act(() => {
        result.current.openModal('link', data)
      })
      expect(result.current.getData('link')).toEqual(data)
    })

    it('should return null for unknown modal names', () => {
      const { result } = renderHook(() => useModal())
      expect(result.current.getData('nonexistent')).toBeNull()
    })
  })

  it('should support opening multiple modals', () => {
    const { result } = renderHook(() => useModal())

    act(() => {
      result.current.openModal('link')
      result.current.openModal('image')
    })

    expect(result.current.modals.link.open).toBe(true)
    expect(result.current.modals.image.open).toBe(true)
  })
})
