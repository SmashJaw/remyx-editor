import { createPlugin } from '@remyxjs/core'
import { detectLanguage, tokenize, LANGUAGE_MAP } from './tokenizers.js'
import { escapeHTML } from '@remyxjs/core'

const HIGHLIGHT_DEBOUNCE_MS = 150
const COPY_FEEDBACK_MS = 1500

/**
 * Finds the closest `<pre>` ancestor of the currently focused element,
 * or null if the focus is outside any `<pre>` block.
 */
function getFocusedPre() {
  const active = document.activeElement
  if (!active) return null
  // activeElement may be the contenteditable div itself; check the selection
  const sel = window.getSelection()
  if (!sel || !sel.focusNode) return null
  const node = sel.focusNode.nodeType === Node.TEXT_NODE
    ? sel.focusNode.parentElement
    : sel.focusNode
  return node?.closest?.('pre') ?? null
}

/**
 * Returns the `<pre>` element containing the current selection's anchor,
 * or null if the selection is not inside a code block.
 */
function getCurrentCodeBlock(engine) {
  const sel = engine.selection.getSelection()
  if (!sel || !sel.anchorNode) return null
  const node = sel.anchorNode.nodeType === Node.TEXT_NODE
    ? sel.anchorNode.parentElement
    : sel.anchorNode
  return node?.closest?.('pre') ?? null
}

/**
 * SyntaxHighlightPlugin - Automatically highlights `<pre><code>` blocks
 * in the editor using language-specific tokenizers.
 *
 * Watches for DOM mutations to detect new or changed code blocks and
 * applies syntax highlighting via `<span class="rmx-syn-{type}">` wrappers.
 *
 * Avoids disrupting contenteditable behavior by skipping blocks that are
 * currently focused (the user is typing in them). Re-highlights on blur.
 */
export function SyntaxHighlightPlugin() {
  let observer = null
  let debounceTimer = null
  let blurHandler = null
  let languageChangeUnsub = null
  let copyClickHandler = null
  let lineNumberClickHandler = null

  /**
   * Highlights a single `<code>` element inside a `<pre>`.
   * Detects (or reads) the language, tokenizes, and replaces innerHTML.
   * Preserves cursor position if the code block is inside the editor.
   */
  function highlightCodeElement(codeEl, engine) {
    const pre = codeEl.closest('pre')
    if (!pre) return

    // Determine language
    let language = codeEl.getAttribute('data-language')
    if (!language) {
      language = detectLanguage(codeEl.textContent)
      if (language) {
        codeEl.setAttribute('data-language', language)
      }
    }

    // Tokenize and build highlighted HTML
    const source = codeEl.textContent
    const tokens = tokenize(source, language)
    if (!tokens) {
      // No tokenizer available — mark as highlighted to skip next time
      pre.classList.add('rmx-highlighted')
      return
    }

    let html = ''
    for (const token of tokens) {
      if (token.type === 'plain') {
        html += escapeHTML(token.value)
      } else {
        html += `<span class="rmx-syn-${token.type}">${escapeHTML(token.value)}</span>`
      }
    }

    // Save cursor, replace content, restore cursor
    const bookmark = engine.selection.save()
    codeEl.innerHTML = html
    pre.classList.add('rmx-highlighted')
    if (bookmark) {
      engine.selection.restore(bookmark)
    }
  }

  /**
   * Injects or removes line number gutter for a `<pre>` block.
   * Line numbers are rendered as a `<span class="rmx-line-numbers">` inside
   * the `<pre>`, with one `<span>` per line.
   */
  function updateLineNumbers(pre) {
    const show = pre.hasAttribute('data-line-numbers')
    let gutter = pre.querySelector('.rmx-line-numbers')

    if (!show) {
      if (gutter) gutter.remove()
      pre.classList.remove('rmx-has-line-numbers')
      return
    }

    const code = pre.querySelector('code')
    if (!code) return

    const lineCount = (code.textContent.match(/\n/g) || []).length + 1

    if (!gutter) {
      gutter = document.createElement('span')
      gutter.className = 'rmx-line-numbers'
      gutter.setAttribute('aria-hidden', 'true')
      gutter.contentEditable = 'false'
      pre.insertBefore(gutter, pre.firstChild)
    }

    // Build line number spans
    let nums = ''
    for (let i = 1; i <= lineCount; i++) {
      nums += `<span class="rmx-line-number">${i}</span>`
    }
    gutter.innerHTML = nums
    pre.classList.add('rmx-has-line-numbers')
  }

  /**
   * Injects a copy-to-clipboard button into a `<pre>` block if one doesn't
   * already exist.
   */
  function ensureCopyButton(pre) {
    if (pre.querySelector('.rmx-code-copy-btn')) return
    const btn = document.createElement('button')
    btn.className = 'rmx-code-copy-btn'
    btn.type = 'button'
    btn.setAttribute('aria-label', 'Copy code')
    btn.contentEditable = 'false'
    btn.textContent = '⧉'
    pre.appendChild(btn)
  }

  /**
   * Highlights inline `<code>` elements (not inside `<pre>`) with
   * mini syntax highlighting when they have a `data-language` attribute.
   */
  function highlightInlineCode(engine) {
    const codes = engine.element.querySelectorAll('code[data-language]:not(pre code)')
    for (const code of codes) {
      if (code.classList.contains('rmx-inline-highlighted')) continue
      const language = code.getAttribute('data-language')
      const tokens = tokenize(code.textContent, language)
      if (!tokens) continue

      let html = ''
      for (const token of tokens) {
        if (token.type === 'plain') {
          html += escapeHTML(token.value)
        } else {
          html += `<span class="rmx-syn-${token.type}">${escapeHTML(token.value)}</span>`
        }
      }
      code.innerHTML = html
      code.classList.add('rmx-inline-highlighted')
    }
  }

  /**
   * Highlights all `<pre><code>` blocks in the editor that are not
   * currently focused and have not already been highlighted.
   */
  function highlightAll(engine) {
    const focusedPre = getFocusedPre()
    const pres = engine.element.querySelectorAll('pre')

    for (const pre of pres) {
      // Always ensure copy button and line numbers are present
      ensureCopyButton(pre)
      updateLineNumbers(pre)

      // Skip the block the user is actively editing
      if (pre === focusedPre) continue
      // Skip already-highlighted blocks that haven't changed
      if (pre.classList.contains('rmx-highlighted')) continue

      const code = pre.querySelector('code')
      if (!code) continue

      highlightCodeElement(code, engine)
    }

    // Highlight inline code spans
    highlightInlineCode(engine)
  }

  /**
   * Debounced wrapper around highlightAll to prevent excessive processing
   * during rapid typing or paste operations.
   */
  function scheduleHighlight(engine) {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => highlightAll(engine), HIGHLIGHT_DEBOUNCE_MS)
  }

  return createPlugin({
    name: 'syntaxHighlight',
    requiresFullAccess: true,

    commands: [
      {
        name: 'setCodeLanguage',
        execute(engine, { language } = {}) {
          if (!language) return false
          const pre = getCurrentCodeBlock(engine)
          if (!pre) return false
          const code = pre.querySelector('code')
          if (!code) return false

          code.setAttribute('data-language', language)
          // Remove highlighted flag so it gets re-processed
          pre.classList.remove('rmx-highlighted')
          highlightCodeElement(code, engine)
          engine.eventBus.emit('codeblock:language-change', { language, element: code })
          return true
        },
      },
      {
        name: 'getCodeLanguage',
        execute(engine) {
          const pre = getCurrentCodeBlock(engine)
          if (!pre) return null
          const code = pre.querySelector('code')
          if (!code) return null
          return code.getAttribute('data-language') || null
        },
      },
      {
        name: 'toggleLineNumbers',
        execute(engine, { element } = {}) {
          const pre = element || getCurrentCodeBlock(engine)
          if (!pre) return false
          if (pre.hasAttribute('data-line-numbers')) {
            pre.removeAttribute('data-line-numbers')
          } else {
            pre.setAttribute('data-line-numbers', '')
          }
          updateLineNumbers(pre)
          return true
        },
        meta: { icon: 'lineNumbers', tooltip: 'Toggle Line Numbers' },
      },
    ],

    init(engine) {
      // Highlight existing code blocks immediately
      highlightAll(engine)

      // Watch for DOM changes that might add or modify code blocks
      observer = new MutationObserver((mutations) => {
        let needsHighlight = false

        for (const mutation of mutations) {
          // New nodes added (paste, programmatic insert)
          if (mutation.type === 'childList') {
            for (const node of mutation.addedNodes) {
              if (node.nodeType === Node.ELEMENT_NODE) {
                if (node.matches?.('pre') || node.querySelector?.('pre')) {
                  needsHighlight = true
                  break
                }
              }
            }
          }

          // Text changed inside a code block (typing)
          if (mutation.type === 'characterData') {
            const pre = mutation.target.parentElement?.closest?.('pre')
            if (pre) {
              // Mark as needing re-highlight
              pre.classList.remove('rmx-highlighted')
              needsHighlight = true
            }
          }

          // Attribute changed (e.g. data-language set externally)
          if (mutation.type === 'attributes') {
            const target = mutation.target
            if (target.matches?.('code') && mutation.attributeName === 'data-language') {
              const pre = target.closest('pre')
              if (pre) {
                pre.classList.remove('rmx-highlighted')
                needsHighlight = true
              }
            }
          }

          if (needsHighlight) break
        }

        if (needsHighlight) {
          scheduleHighlight(engine)
        }
      })

      observer.observe(engine.element, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: ['data-language'],
      })

      // Copy-to-clipboard click handler (delegated)
      copyClickHandler = async (e) => {
        const btn = e.target.closest('.rmx-code-copy-btn')
        if (!btn) return
        const pre = btn.closest('pre')
        if (!pre) return
        const code = pre.querySelector('code')
        if (!code) return

        e.preventDefault()
        e.stopPropagation()

        try {
          await navigator.clipboard.writeText(code.textContent)
          btn.textContent = '✓'
          btn.classList.add('rmx-code-copy-success')
          setTimeout(() => {
            btn.textContent = '⧉'
            btn.classList.remove('rmx-code-copy-success')
          }, COPY_FEEDBACK_MS)
        } catch {
          // Fallback for insecure contexts
          const textarea = document.createElement('textarea')
          textarea.value = code.textContent
          textarea.style.position = 'fixed'
          textarea.style.opacity = '0'
          document.body.appendChild(textarea)
          textarea.select()
          if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(code.textContent).catch(() => {})
          } else {
            document.execCommand('copy')
          }
          document.body.removeChild(textarea)
          btn.textContent = '✓'
          btn.classList.add('rmx-code-copy-success')
          setTimeout(() => {
            btn.textContent = '⧉'
            btn.classList.remove('rmx-code-copy-success')
          }, COPY_FEEDBACK_MS)
        }
      }
      engine.element.addEventListener('click', copyClickHandler, true)

      // Re-highlight the block the user was typing in once they leave it
      blurHandler = (e) => {
        const pre = e.target?.closest?.('pre')
        if (pre && engine.element.contains(pre)) {
          pre.classList.remove('rmx-highlighted')
          const code = pre.querySelector('code')
          if (code) {
            highlightCodeElement(code, engine)
          }
          updateLineNumbers(pre)
        }
      }
      engine.element.addEventListener('focusout', blurHandler, true)

      // Listen for programmatic language changes via the eventBus
      languageChangeUnsub = engine.eventBus.on('codeblock:language-change', ({ language, element }) => {
        if (!element) return
        const pre = element.closest('pre')
        if (pre && engine.element.contains(pre)) {
          pre.classList.remove('rmx-highlighted')
          highlightCodeElement(element, engine)
        }
      })
    },

    destroy(engine) {
      // Clear debounce timer
      clearTimeout(debounceTimer)
      debounceTimer = null

      // Disconnect MutationObserver
      if (observer) {
        observer.disconnect()
        observer = null
      }

      // Remove blur listener
      if (blurHandler) {
        engine.element.removeEventListener('focusout', blurHandler, true)
        blurHandler = null
      }

      // Remove copy click handler
      if (copyClickHandler) {
        engine.element.removeEventListener('click', copyClickHandler, true)
        copyClickHandler = null
      }

      // Unsubscribe from eventBus
      if (languageChangeUnsub) {
        languageChangeUnsub()
        languageChangeUnsub = null
      }
    },
  })
}

/**
 * Escapes HTML special characters to prevent injection when
 * building highlighted markup from token values.
 */
// Task 261: escapeHTML imported from shared utils/escapeHTML.js
