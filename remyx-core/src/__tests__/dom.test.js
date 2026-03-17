import { closestBlock, closestTag, wrapInTag, unwrapTag, generateId, isBlockEmpty } from '../utils/dom.js'

describe('dom utilities', () => {
  let root

  beforeEach(() => {
    root = document.createElement('div')
    document.body.appendChild(root)
  })

  afterEach(() => {
    document.body.removeChild(root)
  })

  describe('closestBlock', () => {
    it('should find a paragraph ancestor from a text node', () => {
      root.innerHTML = '<p>Hello</p>'
      const textNode = root.querySelector('p').firstChild
      expect(closestBlock(textNode, root)).toBe(root.querySelector('p'))
    })

    it('should find the nearest block element', () => {
      root.innerHTML = '<div><p><span>Text</span></p></div>'
      const span = root.querySelector('span')
      expect(closestBlock(span, root).tagName).toBe('P')
    })

    it('should find heading elements', () => {
      root.innerHTML = '<h1><em>Title</em></h1>'
      const em = root.querySelector('em')
      expect(closestBlock(em, root).tagName).toBe('H1')
    })

    it('should find blockquote elements', () => {
      root.innerHTML = '<blockquote><span>Quote</span></blockquote>'
      const span = root.querySelector('span')
      expect(closestBlock(span, root).tagName).toBe('BLOCKQUOTE')
    })

    it('should find li elements', () => {
      root.innerHTML = '<ul><li>Item</li></ul>'
      const textNode = root.querySelector('li').firstChild
      expect(closestBlock(textNode, root).tagName).toBe('LI')
    })

    it('should return null when no block ancestor exists', () => {
      root.innerHTML = '<span>Inline only</span>'
      const span = root.querySelector('span')
      expect(closestBlock(span, root)).toBeNull()
    })

    it('should return null for text node directly under root', () => {
      root.innerHTML = 'Just text'
      const textNode = root.firstChild
      expect(closestBlock(textNode, root)).toBeNull()
    })

    it('should not traverse past root', () => {
      const outer = document.createElement('p')
      outer.appendChild(root)
      root.innerHTML = '<span>Text</span>'
      const span = root.querySelector('span')
      // root acts as boundary, so the <p> outside should not be found
      expect(closestBlock(span, root)).toBeNull()
      outer.removeChild(root)
      document.body.appendChild(root)
    })

    it('should handle element nodes directly', () => {
      root.innerHTML = '<div><p>Text</p></div>'
      const div = root.querySelector('div')
      expect(closestBlock(div, root).tagName).toBe('DIV')
    })
  })

  describe('closestTag', () => {
    it('should find the nearest ancestor with matching tag name', () => {
      root.innerHTML = '<strong><em>Text</em></strong>'
      const em = root.querySelector('em')
      expect(closestTag(em, 'strong', root)).toBe(root.querySelector('strong'))
    })

    it('should be case-insensitive for tag names', () => {
      root.innerHTML = '<STRONG>Bold</STRONG>'
      const textNode = root.querySelector('strong').firstChild
      expect(closestTag(textNode, 'strong', root)).toBe(root.querySelector('strong'))
    })

    it('should return null when no matching ancestor exists', () => {
      root.innerHTML = '<em>Italic</em>'
      const em = root.querySelector('em')
      expect(closestTag(em, 'strong', root)).toBeNull()
    })

    it('should not traverse past root', () => {
      root.innerHTML = '<span>Text</span>'
      const span = root.querySelector('span')
      expect(closestTag(span, 'div', root)).toBeNull()
    })

    it('should handle text nodes', () => {
      root.innerHTML = '<a href="#">Link text</a>'
      const textNode = root.querySelector('a').firstChild
      expect(closestTag(textNode, 'a', root).tagName).toBe('A')
    })

    it('should return the element itself if it matches', () => {
      root.innerHTML = '<strong>Bold</strong>'
      const strong = root.querySelector('strong')
      expect(closestTag(strong, 'strong', root)).toBe(strong)
    })
  })

  describe('wrapInTag', () => {
    it('should wrap a range in the specified tag', () => {
      root.innerHTML = '<p>Hello world</p>'
      const textNode = root.querySelector('p').firstChild
      const range = document.createRange()
      range.setStart(textNode, 0)
      range.setEnd(textNode, 5)

      const el = wrapInTag(range, 'strong')
      expect(el.tagName).toBe('STRONG')
      expect(el.textContent).toBe('Hello')
    })

    it('should set attributes on the wrapper element', () => {
      root.innerHTML = '<p>Click here</p>'
      const textNode = root.querySelector('p').firstChild
      const range = document.createRange()
      range.setStart(textNode, 0)
      range.setEnd(textNode, 10)

      const el = wrapInTag(range, 'a', { href: 'https://example.com', target: '_blank' })
      expect(el.tagName).toBe('A')
      expect(el.getAttribute('href')).toBe('https://example.com')
      expect(el.getAttribute('target')).toBe('_blank')
    })

    it('should work with empty attributes object', () => {
      root.innerHTML = '<p>Text</p>'
      const textNode = root.querySelector('p').firstChild
      const range = document.createRange()
      range.setStart(textNode, 0)
      range.setEnd(textNode, 4)

      const el = wrapInTag(range, 'em', {})
      expect(el.tagName).toBe('EM')
      expect(el.attributes.length).toBe(0)
    })

    it('should fall back to extractContents+appendChild+insertNode when surroundContents throws', () => {
      // surroundContents throws when the range partially selects a non-text node.
      // Create a range that spans across two sibling elements to trigger this.
      root.innerHTML = '<p><em>Hello</em><strong>World</strong></p>'
      const em = root.querySelector('em')
      const strong = root.querySelector('strong')
      const range = document.createRange()
      // Select from inside <em> to inside <strong> — crosses element boundaries
      range.setStart(em.firstChild, 3) // "lo" part of "Hello"
      range.setEnd(strong.firstChild, 3) // "Wor" part of "World"

      const el = wrapInTag(range, 'span', { class: 'highlight' })

      expect(el.tagName).toBe('SPAN')
      expect(el.getAttribute('class')).toBe('highlight')
      // The wrapper should contain the extracted content
      expect(el.textContent).toContain('lo')
      expect(el.textContent).toContain('Wor')
      // The wrapper should be inserted into the DOM
      expect(root.contains(el)).toBe(true)
    })
  })

  describe('unwrapTag', () => {
    it('should remove the element but keep its children', () => {
      root.innerHTML = '<p><strong>Bold text</strong></p>'
      const strong = root.querySelector('strong')
      unwrapTag(strong)

      expect(root.querySelector('strong')).toBeNull()
      expect(root.querySelector('p').textContent).toBe('Bold text')
    })

    it('should keep multiple children in place', () => {
      root.innerHTML = '<p><em>Hello <strong>bold</strong> world</em></p>'
      const em = root.querySelector('em')
      unwrapTag(em)

      expect(root.querySelector('em')).toBeNull()
      expect(root.querySelector('strong')).not.toBeNull()
      expect(root.querySelector('p').textContent).toBe('Hello bold world')
    })

    it('should handle element with no children', () => {
      root.innerHTML = '<p><span></span>text</p>'
      const span = root.querySelector('span')
      unwrapTag(span)

      expect(root.querySelector('span')).toBeNull()
      expect(root.querySelector('p').textContent).toBe('text')
    })
  })

  describe('generateId', () => {
    it('should return a string starting with "rmx-"', () => {
      const id = generateId()
      expect(id.startsWith('rmx-')).toBe(true)
    })

    it('should have a total length of 13 characters (rmx- + 9)', () => {
      const id = generateId()
      expect(id.length).toBe(13)
    })

    it('should generate unique ids', () => {
      const ids = new Set()
      for (let i = 0; i < 100; i++) {
        ids.add(generateId())
      }
      expect(ids.size).toBe(100)
    })

    it('should contain only alphanumeric characters after prefix', () => {
      const id = generateId()
      const suffix = id.slice(4)
      expect(suffix).toMatch(/^[a-z0-9]+$/)
    })
  })

  describe('isBlockEmpty', () => {
    it('should return true for null input', () => {
      expect(isBlockEmpty(null)).toBe(true)
    })

    it('should return true for undefined input', () => {
      expect(isBlockEmpty(undefined)).toBe(true)
    })

    it('should return true for empty paragraph', () => {
      root.innerHTML = '<p></p>'
      expect(isBlockEmpty(root.querySelector('p'))).toBe(true)
    })

    it('should return true for paragraph with only whitespace', () => {
      root.innerHTML = '<p>   \n  </p>'
      expect(isBlockEmpty(root.querySelector('p'))).toBe(true)
    })

    it('should return false for paragraph with text', () => {
      root.innerHTML = '<p>Hello</p>'
      expect(isBlockEmpty(root.querySelector('p'))).toBe(false)
    })

    it('should return false for paragraph with an image', () => {
      root.innerHTML = '<p><img src="test.png" /></p>'
      expect(isBlockEmpty(root.querySelector('p'))).toBe(false)
    })

    it('should return false for paragraph with an iframe', () => {
      root.innerHTML = '<p><iframe src="about:blank"></iframe></p>'
      expect(isBlockEmpty(root.querySelector('p'))).toBe(false)
    })

    it('should return false for div with an hr', () => {
      root.innerHTML = '<div><hr /></div>'
      expect(isBlockEmpty(root.querySelector('div'))).toBe(false)
    })

    it('should return false for paragraph with an input', () => {
      root.innerHTML = '<p><input type="text" /></p>'
      expect(isBlockEmpty(root.querySelector('p'))).toBe(false)
    })

    it('should return true for paragraph with empty span', () => {
      root.innerHTML = '<p><span></span></p>'
      expect(isBlockEmpty(root.querySelector('p'))).toBe(true)
    })
  })
})
