import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { VirtualScroller } from '../core/VirtualScroller.js'

// Mock IntersectionObserver for jsdom
class MockIntersectionObserver {
  constructor(callback) {
    this._callback = callback
    this._observed = new Set()
  }
  observe(el) { this._observed.add(el) }
  unobserve(el) { this._observed.delete(el) }
  disconnect() { this._observed.clear() }
}

describe('VirtualScroller — comprehensive coverage', () => {
  let container
  let originalIO

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    originalIO = globalThis.IntersectionObserver
    globalThis.IntersectionObserver = MockIntersectionObserver
  })

  afterEach(() => {
    container.remove()
    globalThis.IntersectionObserver = originalIO
  })

  function addBlocks(n, tag = 'P') {
    for (let i = 0; i < n; i++) {
      const el = document.createElement(tag)
      el.textContent = `Block ${i}`
      container.appendChild(el)
    }
  }

  describe('constructor', () => {
    it('sets default options', () => {
      const scroller = new VirtualScroller(container)
      expect(scroller._threshold).toBe(200)
      expect(scroller._rootMargin).toBe('500px')
      expect(scroller.isActive).toBe(false)
    })

    it('accepts custom options', () => {
      const scroller = new VirtualScroller(container, { threshold: 50, rootMargin: '100px' })
      expect(scroller._threshold).toBe(50)
      expect(scroller._rootMargin).toBe('100px')
    })
  })

  describe('init', () => {
    it('does nothing when threshold is 0', () => {
      const scroller = new VirtualScroller(container, { threshold: 0 })
      scroller.init()
      expect(scroller._observer).toBeNull()
    })

    it('does not activate when block count is below threshold', () => {
      addBlocks(5)
      const scroller = new VirtualScroller(container, { threshold: 10 })
      scroller.init()
      expect(scroller.isActive).toBe(false)
      scroller.destroy()
    })

    it('activates when block count exceeds threshold', () => {
      addBlocks(15)
      const scroller = new VirtualScroller(container, { threshold: 10 })
      scroller.init()
      expect(scroller.isActive).toBe(true)
      scroller.destroy()
    })
  })

  describe('_getBlockElements', () => {
    it('returns direct block-level children', () => {
      addBlocks(3, 'P')
      const span = document.createElement('span')
      container.appendChild(span)
      const scroller = new VirtualScroller(container)
      const blocks = scroller._getBlockElements()
      expect(blocks).toHaveLength(3) // 3 P elements, not the span
    })

    it('recognizes various block tags', () => {
      const tags = ['P', 'DIV', 'H1', 'H2', 'BLOCKQUOTE', 'PRE', 'UL', 'OL', 'TABLE', 'HR']
      tags.forEach(tag => {
        const el = document.createElement(tag)
        container.appendChild(el)
      })
      const scroller = new VirtualScroller(container)
      const blocks = scroller._getBlockElements()
      expect(blocks).toHaveLength(tags.length)
    })
  })

  describe('_collapse / _restore', () => {
    it('collapses a block element', () => {
      const p = document.createElement('p')
      p.textContent = 'Hello World'
      container.appendChild(p)

      // Mock getBoundingClientRect
      vi.spyOn(p, 'getBoundingClientRect').mockReturnValue({ height: 50, width: 100, top: 0, left: 0, right: 100, bottom: 50 })

      const scroller = new VirtualScroller(container)
      scroller._collapse(p)

      expect(p.innerHTML).toBe('')
      expect(p.style.minHeight).toBe('50px')
      expect(p.getAttribute('data-virtualized')).toBe('true')
      expect(scroller.collapsedCount).toBe(1)

      scroller.destroy()
    })

    it('restores a collapsed block', () => {
      const p = document.createElement('p')
      p.innerHTML = '<b>Hello</b>'
      container.appendChild(p)

      vi.spyOn(p, 'getBoundingClientRect').mockReturnValue({ height: 50, width: 100, top: 0, left: 0, right: 100, bottom: 50 })

      const scroller = new VirtualScroller(container)
      scroller._collapse(p)
      scroller._restore(p)

      expect(p.innerHTML).toBe('<b>Hello</b>')
      expect(p.style.minHeight).toBe('')
      expect(p.hasAttribute('data-virtualized')).toBe(false)
      expect(scroller.collapsedCount).toBe(0)

      scroller.destroy()
    })

    it('skips collapsing zero-height elements', () => {
      const p = document.createElement('p')
      container.appendChild(p)

      vi.spyOn(p, 'getBoundingClientRect').mockReturnValue({ height: 0, width: 0, top: 0, left: 0, right: 0, bottom: 0 })

      const scroller = new VirtualScroller(container)
      scroller._collapse(p)
      expect(scroller.collapsedCount).toBe(0)
    })

    it('does not collapse already-collapsed elements', () => {
      const p = document.createElement('p')
      p.textContent = 'test'
      container.appendChild(p)

      vi.spyOn(p, 'getBoundingClientRect').mockReturnValue({ height: 50, width: 100, top: 0, left: 0, right: 100, bottom: 50 })

      const scroller = new VirtualScroller(container)
      scroller._collapse(p)
      scroller._collapse(p) // second call should be no-op
      expect(scroller.collapsedCount).toBe(1)
    })

    it('restore does nothing for non-collapsed elements', () => {
      const p = document.createElement('p')
      p.textContent = 'test'
      container.appendChild(p)

      const scroller = new VirtualScroller(container)
      scroller._restore(p)
      expect(p.textContent).toBe('test')
    })
  })

  describe('restoreAll', () => {
    it('restores all collapsed elements', () => {
      const p1 = document.createElement('p')
      p1.textContent = 'A'
      const p2 = document.createElement('p')
      p2.textContent = 'B'
      container.appendChild(p1)
      container.appendChild(p2)

      vi.spyOn(p1, 'getBoundingClientRect').mockReturnValue({ height: 50, width: 100, top: 0, left: 0, right: 100, bottom: 50 })
      vi.spyOn(p2, 'getBoundingClientRect').mockReturnValue({ height: 50, width: 100, top: 50, left: 0, right: 100, bottom: 100 })

      const scroller = new VirtualScroller(container)
      scroller._collapse(p1)
      scroller._collapse(p2)
      expect(scroller.collapsedCount).toBe(2)

      scroller.restoreAll()
      expect(scroller.collapsedCount).toBe(0)
      expect(p1.textContent).toBe('A')
      expect(p2.textContent).toBe('B')
    })
  })

  describe('refresh', () => {
    it('restores all and rescans', () => {
      addBlocks(5)
      const scroller = new VirtualScroller(container, { threshold: 3 })
      scroller.init()
      expect(scroller.isActive).toBe(true)

      scroller.refresh()
      expect(scroller.isActive).toBe(true) // still has enough blocks

      scroller.destroy()
    })

    it('does nothing when no observer', () => {
      const scroller = new VirtualScroller(container, { threshold: 0 })
      scroller.refresh() // should not throw
    })
  })

  describe('destroy', () => {
    it('restores all and clears state', () => {
      addBlocks(5)
      const scroller = new VirtualScroller(container, { threshold: 3 })
      scroller.init()
      scroller.destroy()

      expect(scroller.isActive).toBe(false)
      expect(scroller.collapsedCount).toBe(0)
      expect(scroller._observer).toBeNull()
    })
  })

  describe('_handleIntersection', () => {
    it('collapses elements leaving viewport', () => {
      const p = document.createElement('p')
      p.textContent = 'test'
      container.appendChild(p)

      vi.spyOn(p, 'getBoundingClientRect').mockReturnValue({ height: 50, width: 100, top: 0, left: 0, right: 100, bottom: 50 })

      const scroller = new VirtualScroller(container)
      scroller._handleIntersection([
        { target: p, isIntersecting: false },
      ])
      expect(scroller.collapsedCount).toBe(1)
      scroller.destroy()
    })

    it('restores elements entering viewport', () => {
      const p = document.createElement('p')
      p.textContent = 'test'
      container.appendChild(p)

      vi.spyOn(p, 'getBoundingClientRect').mockReturnValue({ height: 50, width: 100, top: 0, left: 0, right: 100, bottom: 50 })

      const scroller = new VirtualScroller(container)
      scroller._collapse(p)

      scroller._handleIntersection([
        { target: p, isIntersecting: true },
      ])
      expect(scroller.collapsedCount).toBe(0)
      scroller.destroy()
    })
  })
})
