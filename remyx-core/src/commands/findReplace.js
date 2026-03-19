export function registerFindReplaceCommands(engine) {
  let currentMatches = []
  let currentIndex = -1

  function clearHighlights(editorEl) {
    editorEl.querySelectorAll('mark.rmx-find-highlight').forEach((mark) => {
      const parent = mark.parentNode
      parent.replaceChild(document.createTextNode(mark.textContent), mark)
      parent.normalize()
    })
  }

  function findMatches(editorEl, searchText, caseSensitive = false) {
    clearHighlights(editorEl)
    if (!searchText) return []

    const matches = []
    const walker = document.createTreeWalker(editorEl, NodeFilter.SHOW_TEXT, null)
    const textNodes = []

    while (walker.nextNode()) {
      textNodes.push(walker.currentNode)
    }

    const flags = caseSensitive ? 'g' : 'gi'
    const regex = new RegExp(escapeRegex(searchText), flags)

    // Process text nodes in reverse to avoid offset issues
    for (let i = textNodes.length - 1; i >= 0; i--) {
      const node = textNodes[i]
      const text = node.textContent
      const nodeMatches = []
      let m
      while ((m = regex.exec(text)) !== null) {
        nodeMatches.push({ index: m.index, length: m[0].length })
      }

      // Wrap matches in reverse order within this node
      for (let j = nodeMatches.length - 1; j >= 0; j--) {
        const match = nodeMatches[j]
        const range = document.createRange()
        range.setStart(node, match.index)
        range.setEnd(node, match.index + match.length)

        const mark = document.createElement('mark')
        mark.className = 'rmx-find-highlight'
        range.surroundContents(mark)
        matches.unshift(mark)
      }
    }

    return matches
  }

  engine.commands.register('find', {
    execute(eng, { text, caseSensitive }) {
      currentMatches = findMatches(eng.element, text, caseSensitive)
      currentIndex = currentMatches.length > 0 ? 0 : -1
      if (currentIndex >= 0) {
        highlightCurrent()
      }
      eng.eventBus.emit('find:results', {
        total: currentMatches.length,
        current: currentIndex + 1,
      })
      return { total: currentMatches.length, current: currentIndex + 1 }
    },
    shortcut: 'mod+f',
    meta: { icon: 'findReplace', tooltip: 'Find & Replace' },
  })

  engine.commands.register('findNext', {
    execute(eng) {
      if (currentMatches.length === 0) return
      currentIndex = (currentIndex + 1) % currentMatches.length
      highlightCurrent()
      eng.eventBus.emit('find:results', {
        total: currentMatches.length,
        current: currentIndex + 1,
      })
    },
    meta: { tooltip: 'Find Next' },
  })

  engine.commands.register('findPrev', {
    execute(eng) {
      if (currentMatches.length === 0) return
      currentIndex = (currentIndex - 1 + currentMatches.length) % currentMatches.length
      highlightCurrent()
      eng.eventBus.emit('find:results', {
        total: currentMatches.length,
        current: currentIndex + 1,
      })
    },
    meta: { tooltip: 'Find Previous' },
  })

  engine.commands.register('replace', {
    execute(eng, { replaceText }) {
      pruneStaleMatches()
      if (currentMatches.length === 0 || currentIndex < 0 || currentIndex >= currentMatches.length) return
      const mark = currentMatches[currentIndex]
      const textNode = document.createTextNode(replaceText)
      mark.parentNode.replaceChild(textNode, mark)
      currentMatches.splice(currentIndex, 1)
      if (currentMatches.length > 0) {
        currentIndex = Math.min(currentIndex, currentMatches.length - 1)
        highlightCurrent()
      } else {
        currentIndex = -1
      }
      eng.eventBus.emit('find:results', {
        total: currentMatches.length,
        current: currentIndex + 1,
      })
      eng.eventBus.emit('content:change')
    },
    meta: { tooltip: 'Replace' },
  })

  engine.commands.register('replaceAll', {
    execute(eng, { replaceText }) {
      pruneStaleMatches()
      currentMatches.forEach((mark) => {
        const textNode = document.createTextNode(replaceText)
        mark.parentNode.replaceChild(textNode, mark)
      })
      const count = currentMatches.length
      currentMatches = []
      currentIndex = -1
      eng.eventBus.emit('find:results', { total: 0, current: 0 })
      eng.eventBus.emit('content:change')
      return count
    },
    meta: { tooltip: 'Replace All' },
  })

  engine.commands.register('clearFind', {
    execute(eng) {
      clearHighlights(eng.element)
      currentMatches = []
      currentIndex = -1
    },
    meta: { tooltip: 'Clear Find' },
  })

  /** Remove stale mark references that are no longer in the document */
  function pruneStaleMatches() {
    currentMatches = currentMatches.filter((m) => m.isConnected)
    if (currentIndex >= currentMatches.length) {
      currentIndex = currentMatches.length > 0 ? currentMatches.length - 1 : -1
    }
  }

  function highlightCurrent() {
    pruneStaleMatches()
    currentMatches.forEach((m, i) => {
      m.className = i === currentIndex ? 'rmx-find-highlight rmx-find-current' : 'rmx-find-highlight'
    })
    if (currentMatches[currentIndex]) {
      currentMatches[currentIndex].scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
  }
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
