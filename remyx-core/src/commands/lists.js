/**
 * CSP-compatible list commands using Range-based DOM manipulation.
 */
export function registerListCommands(engine) {
  engine.commands.register('orderedList', {
    execute(eng) {
      const existingOl = eng.selection.getClosestElement('ol')
      if (existingOl) {
        // Toggle off: unwrap list items to paragraphs
        unwrapList(existingOl)
        return
      }
      // Convert from ul to ol if in an unordered list
      const existingUl = eng.selection.getClosestElement('ul')
      if (existingUl) {
        convertListType(existingUl, 'ol')
        return
      }
      // Wrap current block in <ol><li>
      wrapInList(eng, 'ol')
    },
    isActive(eng) {
      return !!eng.selection.getClosestElement('ol')
    },
    shortcut: 'mod+shift+7',
    meta: { icon: 'orderedList', tooltip: 'Numbered List' },
  })

  engine.commands.register('unorderedList', {
    execute(eng) {
      const existingUl = eng.selection.getClosestElement('ul')
      if (existingUl && !existingUl.classList.contains('rmx-task-list')) {
        unwrapList(existingUl)
        return
      }
      const existingOl = eng.selection.getClosestElement('ol')
      if (existingOl) {
        convertListType(existingOl, 'ul')
        return
      }
      wrapInList(eng, 'ul')
    },
    isActive(eng) {
      const ul = eng.selection.getClosestElement('ul')
      if (!ul) return false
      return !ul.classList.contains('rmx-task-list')
    },
    shortcut: 'mod+shift+8',
    meta: { icon: 'unorderedList', tooltip: 'Bulleted List' },
  })

  engine.commands.register('taskList', {
    execute(eng) {
      const existingUl = eng.selection.getClosestElement('ul')
      if (existingUl && existingUl.classList.contains('rmx-task-list')) {
        // Remove task list - convert back to regular list
        existingUl.classList.remove('rmx-task-list')
        existingUl.querySelectorAll('.rmx-task-checkbox').forEach((cb) => cb.remove())
        return
      }

      // If not in a list, create one
      if (!existingUl) {
        wrapInList(eng, 'ul')
      }

      const ul = eng.selection.getClosestElement('ul')
      if (!ul) return

      ul.classList.add('rmx-task-list')
      ul.querySelectorAll('li').forEach((li) => {
        if (!li.querySelector('.rmx-task-checkbox')) {
          const checkbox = document.createElement('input')
          checkbox.type = 'checkbox'
          checkbox.className = 'rmx-task-checkbox'
          checkbox.setAttribute('contenteditable', 'false')
          li.insertBefore(checkbox, li.firstChild)
        }
      })
    },
    isActive(eng) {
      const ul = eng.selection.getClosestElement('ul')
      return ul && ul.classList.contains('rmx-task-list')
    },
    meta: { icon: 'taskList', tooltip: 'Task List' },
  })

  engine.commands.register('indent', {
    execute(eng) {
      const li = eng.selection.getClosestElement('li')
      if (!li) return
      const prevLi = li.previousElementSibling
      if (!prevLi) return // Can't indent first item

      // Check current nesting depth and enforce max
      const maxDepth = eng.options?.maxListNestingDepth ?? 5
      let depth = 0
      let el = li.parentElement
      while (el && el !== eng.element) {
        if (el.tagName === 'UL' || el.tagName === 'OL') depth++
        el = el.parentElement
      }
      if (depth >= maxDepth) return // Already at max nesting depth

      // Find or create a sub-list inside the previous li
      const listTag = li.parentElement.tagName.toLowerCase()
      let subList = prevLi.querySelector(listTag)
      if (!subList) {
        subList = document.createElement(listTag)
        prevLi.appendChild(subList)
      }
      subList.appendChild(li)
    },
    meta: { icon: 'indent', tooltip: 'Increase Indent' },
  })

  engine.commands.register('outdent', {
    execute(eng) {
      const li = eng.selection.getClosestElement('li')
      if (!li) return
      const parentList = li.parentElement
      if (!parentList) return
      const grandParentLi = parentList.parentElement
      if (!grandParentLi || grandParentLi.tagName !== 'LI') return // Already at top level

      // Move the li after the grandparent li
      const grandParentList = grandParentLi.parentElement
      grandParentList.insertBefore(li, grandParentLi.nextSibling)

      // Clean up empty sub-list
      if (parentList.children.length === 0) {
        parentList.remove()
      }
    },
    meta: { icon: 'outdent', tooltip: 'Decrease Indent' },
  })
}

function wrapInList(engine, listTag) {
  const block = engine.selection.getParentBlock()
  if (!block) return

  const list = document.createElement(listTag)
  const li = document.createElement('li')

  // Move block content into the li
  while (block.firstChild) {
    li.appendChild(block.firstChild)
  }
  list.appendChild(li)
  block.parentNode.replaceChild(list, block)

  // Restore cursor
  const range = document.createRange()
  range.selectNodeContents(li)
  range.collapse(false)
  engine.selection.setRange(range)
}

function unwrapList(list) {
  const parent = list.parentNode
  const items = Array.from(list.querySelectorAll(':scope > li'))
  for (const li of items) {
    const p = document.createElement('p')
    while (li.firstChild) {
      p.appendChild(li.firstChild)
    }
    parent.insertBefore(p, list)
  }
  parent.removeChild(list)
}

function convertListType(list, newTag) {
  const newList = document.createElement(newTag)
  // Copy attributes
  for (const attr of list.attributes) {
    newList.setAttribute(attr.name, attr.value)
  }
  while (list.firstChild) {
    newList.appendChild(list.firstChild)
  }
  list.parentNode.replaceChild(newList, list)
}
