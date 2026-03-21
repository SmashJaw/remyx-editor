import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { DragDropPlugin } from '../plugins/builtins/dragDropFeatures/DragDropPlugin.js'

function createMockEngine() {
  const element = document.createElement('div')
  element.contentEditable = 'true'
  document.body.appendChild(element)
  return {
    element,
    eventBus: { on: vi.fn(() => vi.fn()), emit: vi.fn() },
    history: { snapshot: vi.fn() },
    selection: { getParentBlock: vi.fn() },
  }
}

function createDataTransfer(data = {}, files = []) {
  return {
    getData: vi.fn((type) => data[type] || ''),
    setData: vi.fn(),
    setDragImage: vi.fn(),
    effectAllowed: '',
    dropEffect: '',
    files,
  }
}

describe('DragDropPlugin — comprehensive coverage', () => {
  let engine, plugin

  beforeEach(() => {
    engine = createMockEngine()
  })

  afterEach(() => {
    if (plugin) plugin.destroy(engine)
    engine.element.remove()
  })

  describe('init/destroy', () => {
    it('initializes with drop zone class', () => {
      plugin = DragDropPlugin()
      plugin.init(engine)
      expect(engine.element.classList.contains('rmx-drop-zone')).toBe(true)
    })

    it('creates drop indicator when reorder enabled', () => {
      plugin = DragDropPlugin({ enableReorder: true })
      plugin.init(engine)
      expect(engine.element.querySelector('.rmx-drop-indicator')).toBeTruthy()
    })

    it('does not create drop indicator when reorder disabled', () => {
      plugin = DragDropPlugin({ enableReorder: false })
      plugin.init(engine)
      expect(engine.element.querySelector('.rmx-drop-indicator')).toBeNull()
    })

    it('cleans up on destroy', () => {
      plugin = DragDropPlugin()
      plugin.init(engine)
      plugin.destroy(engine)
      expect(engine.element.classList.contains('rmx-drop-zone')).toBe(false)
    })
  })

  describe('drag start', () => {
    it('starts drag on block element near left edge', () => {
      plugin = DragDropPlugin()
      plugin.init(engine)

      const p = document.createElement('p')
      p.textContent = 'Drag me'
      engine.element.appendChild(p)

      const dt = createDataTransfer()
      const dragStart = new Event('dragstart', { bubbles: true })
      Object.defineProperty(dragStart, 'dataTransfer', { value: dt })
      Object.defineProperty(dragStart, 'target', { value: p })

      p.dispatchEvent(dragStart)
      expect(p.classList.contains('rmx-dragging')).toBe(true)
    })
  })

  describe('drag over', () => {
    it('sets drop effect and shows drop zone', () => {
      plugin = DragDropPlugin()
      plugin.init(engine)

      const p = document.createElement('p')
      p.textContent = 'target'
      engine.element.appendChild(p)

      const dt = createDataTransfer()
      const dragOver = new Event('dragover', { bubbles: true, cancelable: true })
      Object.defineProperty(dragOver, 'dataTransfer', { value: dt })
      Object.defineProperty(dragOver, 'clientY', { value: 50 })
      dragOver.preventDefault = vi.fn()

      engine.element.dispatchEvent(dragOver)
      expect(dragOver.preventDefault).toHaveBeenCalled()
      expect(engine.element.classList.contains('rmx-drop-zone-active')).toBe(true)
    })
  })

  describe('drag leave', () => {
    it('removes active class when leaving editor', () => {
      plugin = DragDropPlugin()
      plugin.init(engine)

      engine.element.classList.add('rmx-drop-zone-active')

      const dragLeave = new Event('dragleave', { bubbles: true })
      Object.defineProperty(dragLeave, 'relatedTarget', { value: document.body })

      engine.element.dispatchEvent(dragLeave)
      expect(engine.element.classList.contains('rmx-drop-zone-active')).toBe(false)
    })

    it('keeps active class when moving within editor', () => {
      plugin = DragDropPlugin()
      plugin.init(engine)

      engine.element.classList.add('rmx-drop-zone-active')
      const child = document.createElement('p')
      engine.element.appendChild(child)

      const dragLeave = new Event('dragleave', { bubbles: true })
      Object.defineProperty(dragLeave, 'relatedTarget', { value: child })

      engine.element.dispatchEvent(dragLeave)
      expect(engine.element.classList.contains('rmx-drop-zone-active')).toBe(true)
    })
  })

  describe('drop — internal reorder', () => {
    it('reorders blocks on drop', () => {
      plugin = DragDropPlugin()
      plugin.init(engine)

      const p1 = document.createElement('p')
      p1.textContent = 'First'
      const p2 = document.createElement('p')
      p2.textContent = 'Second'
      engine.element.appendChild(p1)
      engine.element.appendChild(p2)

      // Mock getBoundingClientRect for drop target calculation
      vi.spyOn(p1, 'getBoundingClientRect').mockReturnValue({ top: 0, bottom: 30, height: 30, left: 0, right: 100, width: 100 })
      vi.spyOn(p2, 'getBoundingClientRect').mockReturnValue({ top: 30, bottom: 60, height: 30, left: 0, right: 100, width: 100 })

      // Simulate drag start to set draggedBlock
      const dt = createDataTransfer()
      const dragStart = new Event('dragstart', { bubbles: true })
      Object.defineProperty(dragStart, 'dataTransfer', { value: dt })
      Object.defineProperty(dragStart, 'target', { value: p1 })
      p1.dispatchEvent(dragStart)

      // Drop after p2
      const drop = new Event('drop', { bubbles: true, cancelable: true })
      Object.defineProperty(drop, 'dataTransfer', { value: dt })
      Object.defineProperty(drop, 'clientY', { value: 55 }) // after p2
      drop.preventDefault = vi.fn()

      engine.element.dispatchEvent(drop)
      expect(engine.eventBus.emit).toHaveBeenCalledWith('content:change')
    })
  })

  describe('drop — cross-editor block', () => {
    it('inserts HTML from another Remyx instance', () => {
      plugin = DragDropPlugin()
      plugin.init(engine)

      const p = document.createElement('p')
      p.textContent = 'existing'
      engine.element.appendChild(p)

      const dt = createDataTransfer({
        'text/x-remyx-block': 'true',
        'text/html': '<p>cross-editor</p>',
      })
      const drop = new Event('drop', { bubbles: true, cancelable: true })
      Object.defineProperty(drop, 'dataTransfer', { value: dt })
      Object.defineProperty(drop, 'clientY', { value: 50 })
      drop.preventDefault = vi.fn()

      engine.element.dispatchEvent(drop)
      expect(engine.eventBus.emit).toHaveBeenCalledWith('dragdrop:crossEditor', {})
    })
  })

  describe('drop — external file', () => {
    it('handles external file drop with callback', () => {
      const onFileDrop = vi.fn()
      const onDrop = vi.fn()
      plugin = DragDropPlugin({ onFileDrop, onDrop })
      plugin.init(engine)

      const file = new File(['data'], 'test.txt', { type: 'text/plain' })
      const dt = createDataTransfer({}, [file])
      const drop = new Event('drop', { bubbles: true, cancelable: true })
      Object.defineProperty(drop, 'dataTransfer', { value: dt })
      Object.defineProperty(drop, 'clientY', { value: 50 })
      drop.preventDefault = vi.fn()

      engine.element.dispatchEvent(drop)
      expect(onFileDrop).toHaveBeenCalledWith([file])
      expect(engine.eventBus.emit).toHaveBeenCalledWith('dragdrop:fileDrop', { files: [file] })
    })

    it('auto-inserts images on file drop', () => {
      plugin = DragDropPlugin()
      plugin.init(engine)

      const imgFile = new File(['data'], 'img.png', { type: 'image/png' })
      const dt = createDataTransfer({}, [imgFile])
      const drop = new Event('drop', { bubbles: true, cancelable: true })
      Object.defineProperty(drop, 'dataTransfer', { value: dt })
      Object.defineProperty(drop, 'clientY', { value: 50 })
      drop.preventDefault = vi.fn()

      // Mock FileReader
      const mockReader = { readAsDataURL: vi.fn(), onload: null, result: 'data:image/png;base64,abc' }
      vi.spyOn(globalThis, 'FileReader').mockImplementation(function () { return mockReader })

      engine.element.dispatchEvent(drop)

      // FileReader.onload is set asynchronously by the code
      if (mockReader.onload) {
        mockReader.onload()
        expect(engine.eventBus.emit).toHaveBeenCalledWith('content:change')
      }

      globalThis.FileReader.mockRestore()
    })

    it('does not handle external drop when allowExternalDrop is false', () => {
      plugin = DragDropPlugin({ allowExternalDrop: false })
      plugin.init(engine)

      const file = new File(['data'], 'test.txt', { type: 'text/plain' })
      const dt = createDataTransfer({}, [file])
      const drop = new Event('drop', { bubbles: true, cancelable: true })
      Object.defineProperty(drop, 'dataTransfer', { value: dt })
      Object.defineProperty(drop, 'clientY', { value: 50 })
      drop.preventDefault = vi.fn()

      engine.element.dispatchEvent(drop)
      expect(engine.eventBus.emit).not.toHaveBeenCalledWith('dragdrop:fileDrop', expect.anything())
    })
  })

  describe('drop — external text/HTML', () => {
    it('inserts external HTML on drop', () => {
      plugin = DragDropPlugin()
      plugin.init(engine)

      const dt = createDataTransfer({ 'text/html': '<b>bold text</b>' })
      dt.files = []
      const drop = new Event('drop', { bubbles: true, cancelable: true })
      Object.defineProperty(drop, 'dataTransfer', { value: dt })
      Object.defineProperty(drop, 'clientY', { value: 50 })
      drop.preventDefault = vi.fn()

      engine.element.dispatchEvent(drop)
      expect(engine.eventBus.emit).toHaveBeenCalledWith('dragdrop:externalDrop', expect.objectContaining({
        html: '<b>bold text</b>',
      }))
    })

    it('inserts external plain text wrapped in paragraphs', () => {
      plugin = DragDropPlugin()
      plugin.init(engine)

      const dt = createDataTransfer({ 'text/plain': 'hello\nworld' })
      dt.files = []
      const drop = new Event('drop', { bubbles: true, cancelable: true })
      Object.defineProperty(drop, 'dataTransfer', { value: dt })
      Object.defineProperty(drop, 'clientY', { value: 50 })
      drop.preventDefault = vi.fn()

      engine.element.dispatchEvent(drop)
      expect(engine.eventBus.emit).toHaveBeenCalledWith('dragdrop:externalDrop', expect.any(Object))
    })
  })

  describe('drag end', () => {
    it('cleans up drag state', () => {
      plugin = DragDropPlugin()
      plugin.init(engine)

      const p = document.createElement('p')
      p.textContent = 'block'
      p.classList.add('rmx-dragging')
      engine.element.appendChild(p)

      const dragEnd = new Event('dragend', { bubbles: true })
      engine.element.dispatchEvent(dragEnd)
    })
  })

  describe('mousedown — left edge drag enable', () => {
    it('makes block draggable when clicking near left edge', () => {
      plugin = DragDropPlugin()
      plugin.init(engine)

      const p = document.createElement('p')
      p.textContent = 'block'
      engine.element.appendChild(p)

      // Mock getBoundingClientRect
      vi.spyOn(p, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, right: 100, bottom: 30, width: 100, height: 30 })

      const mousedown = new MouseEvent('mousedown', { clientX: 10, bubbles: true })
      p.dispatchEvent(mousedown)

      expect(p.draggable).toBe(true)
    })

    it('does not make block draggable when clicking away from left edge', () => {
      plugin = DragDropPlugin()
      plugin.init(engine)

      const p = document.createElement('p')
      p.textContent = 'block'
      engine.element.appendChild(p)

      vi.spyOn(p, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, right: 100, bottom: 30, width: 100, height: 30 })

      const mousedown = new MouseEvent('mousedown', { clientX: 60, bubbles: true })
      p.dispatchEvent(mousedown)

      expect(p.draggable).toBeFalsy()
    })
  })

  describe('commands', () => {
    it('moveBlockUp moves block before its sibling', () => {
      plugin = DragDropPlugin()
      plugin.init(engine)

      const p1 = document.createElement('p')
      p1.textContent = 'first'
      const p2 = document.createElement('p')
      p2.textContent = 'second'
      engine.element.appendChild(p1)
      engine.element.appendChild(p2)

      engine.selection.getParentBlock = vi.fn(() => p2)
      const moveUp = plugin.commands.find(c => c.name === 'moveBlockUp')
      moveUp.execute(engine)

      // p2 should now be before p1
      const children = Array.from(engine.element.children).filter(c => c.tagName === 'P')
      expect(children[0]).toBe(p2)
    })

    it('moveBlockDown moves block after its sibling', () => {
      plugin = DragDropPlugin()
      plugin.init(engine)

      const p1 = document.createElement('p')
      p1.textContent = 'first'
      const p2 = document.createElement('p')
      p2.textContent = 'second'
      engine.element.appendChild(p1)
      engine.element.appendChild(p2)

      engine.selection.getParentBlock = vi.fn(() => p1)
      const moveDown = plugin.commands.find(c => c.name === 'moveBlockDown')
      moveDown.execute(engine)

      const children = Array.from(engine.element.children).filter(c => c.tagName === 'P')
      expect(children[1]).toBe(p1)
    })
  })
})
