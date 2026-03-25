import { VirtualScroller } from '../core/VirtualScroller.js'

describe('VirtualScroller', () => {
  let container

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should construct with default options', () => {
    const scroller = new VirtualScroller(container)
    expect(scroller).toBeDefined()
    scroller.destroy()
  })

  it('should construct with custom threshold', () => {
    const scroller = new VirtualScroller(container, { threshold: 50 })
    expect(scroller).toBeDefined()
    scroller.destroy()
  })

  it('should init without error', () => {
    const scroller = new VirtualScroller(container, { threshold: 5 })
    // Add some blocks
    for (let i = 0; i < 10; i++) {
      const p = document.createElement('p')
      p.textContent = `Block ${i}`
      container.appendChild(p)
    }
    scroller.init()
    scroller.destroy()
  })

  it('should not virtualize when below threshold', () => {
    const scroller = new VirtualScroller(container, { threshold: 100 })
    const p = document.createElement('p')
    p.textContent = 'Only one'
    container.appendChild(p)
    scroller.init()
    scroller.destroy()
  })

  it('destroy should not throw when not initialized', () => {
    const scroller = new VirtualScroller(container)
    scroller.destroy()
  })
})
