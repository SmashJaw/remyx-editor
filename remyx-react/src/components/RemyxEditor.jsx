import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useEditorEngine } from '../hooks/useEditorEngine.js'
import { useSelection } from '../hooks/useSelection.js'
import { useModal } from '../hooks/useModal.js'
import { useContextMenu } from '../hooks/useContextMenu.js'
import { useRemyxConfig } from '../config/RemyxConfigProvider.jsx'
import { loadGoogleFonts, DEFAULT_TOOLBAR, DEFAULT_FONTS, DEFAULT_MENU_BAR } from '@remyx/core'
import { MenuBar, collectMenuBarCommands } from './MenuBar/MenuBar.jsx'
import { Toolbar } from './Toolbar/Toolbar.jsx'
import { EditArea } from './EditArea/EditArea.jsx'
import { FloatingToolbar } from './EditArea/FloatingToolbar.jsx'
import { ImageResizeHandles } from './EditArea/ImageResizeHandles.jsx'
import { TableControls } from './EditArea/TableControls.jsx'
import { StatusBar, WordCountButton } from './StatusBar/StatusBar.jsx'
import { ContextMenu } from './ContextMenu/ContextMenu.jsx'
import { LinkModal } from './Modals/LinkModal.jsx'
import { ImageModal } from './Modals/ImageModal.jsx'
import { TablePickerModal } from './Modals/TablePickerModal.jsx'
import { EmbedModal } from './Modals/EmbedModal.jsx'
import { FindReplacePanel } from './Modals/FindReplaceModal.jsx'
import { SourceModal } from './Modals/SourceModal.jsx'
import { ExportModal } from './Modals/ExportModal.jsx'
import { AttachmentModal } from './Modals/AttachmentModal.jsx'
import { ImportDocumentModal } from './Modals/ImportDocumentModal.jsx'

export default function RemyxEditor(props) {
  const { config: configName, ...componentProps } = props

  // Resolve config from provider context (if any)
  const resolvedConfig = useRemyxConfig(configName)

  // Merge: resolved config as defaults, component props override where explicitly provided
  const merged = resolvedConfig
    ? Object.keys({ ...resolvedConfig, ...componentProps }).reduce((acc, key) => {
        acc[key] = componentProps[key] !== undefined ? componentProps[key] : resolvedConfig[key]
        return acc
      }, {})
    : componentProps

  // Destructure with defaults from the merged config
  const {
    attachTo,
    value,
    defaultValue,
    onChange,
    toolbar,
    menuBar: menuBarProp,
    theme = 'light',
    placeholder = '',
    height = 300,
    minHeight,
    maxHeight,
    readOnly = false,
    plugins,
    onReady,
    onFocus,
    onBlur,
    className = '',
    style,
    uploadHandler,
    outputFormat = 'html',
    floatingToolbar: showFloatingToolbar = true,
    contextMenu: showContextMenu = true,
    fonts,
    googleFonts,
    statusBar = 'bottom',
    customTheme,
    toolbarItemTheme,
    sanitize,
    shortcuts,
  } = merged

  // Resolve menu bar config
  const menuBarConfig = menuBarProp === true ? DEFAULT_MENU_BAR
    : Array.isArray(menuBarProp) ? menuBarProp
    : null

  // Auto-deduplicate toolbar: remove items that are in the menu bar
  // Only when user didn't explicitly pass a toolbar prop
  const effectiveToolbar = useMemo(() => {
    if (!menuBarConfig || props.toolbar !== undefined) return toolbar
    // Use the toolbar from config or fall back to DEFAULT_TOOLBAR
    const baseToolbar = toolbar || DEFAULT_TOOLBAR
    const menuCommands = collectMenuBarCommands(menuBarConfig)
    return baseToolbar
      .map(group => group.filter(item => typeof item !== 'string' || !menuCommands.has(item)))
      .filter(group => group.length > 0)
  }, [menuBarConfig, toolbar, props.toolbar])

  const editAreaRef = useRef(null)
  const editorRootRef = useRef(null)
  const [editorRect, setEditorRect] = useState(null)

  // Load Google Fonts and merge into font list
  useEffect(() => {
    if (googleFonts && googleFonts.length > 0) {
      loadGoogleFonts(googleFonts)
    }
  }, [googleFonts])

  const mergedFonts = useMemo(() => {
    if (!googleFonts || googleFonts.length === 0) return fonts
    // Extract clean font names (strip weight specs like ":wght@400;700")
    const googleFontNames = googleFonts.map(f => f.split(':')[0])
    const base = fonts || DEFAULT_FONTS
    const existing = new Set(base.map(f => f.toLowerCase()))
    const newFonts = googleFontNames.filter(f => !existing.has(f.toLowerCase()))
    return [...base, ...newFonts]
  }, [fonts, googleFonts])

  // --- attachTo: portal-based attachment to existing textarea/div ---
  const [portalContainer, setPortalContainer] = useState(null)
  const [attachedInitialContent, setAttachedInitialContent] = useState(undefined)
  const attachCleanupRef = useRef(null)

  useEffect(() => {
    const target = attachTo?.current
    if (!target) {
      setPortalContainer(null)
      return
    }

    const tag = target.tagName.toLowerCase()
    const isFormElement = tag === 'textarea' || tag === 'input'

    // Read initial content from the target element
    if (value === undefined && defaultValue === undefined) {
      const initial = isFormElement ? (target.value || '') : (target.innerHTML || '')
      setAttachedInitialContent(initial)
    }

    // Create portal container div
    const container = document.createElement('div')

    if (isFormElement) {
      // Hide the original form element and insert the editor after it
      target.style.display = 'none'
      target.parentNode.insertBefore(container, target.nextSibling)

      // Wire up form submit to sync value
      const form = target.closest('form')
      const syncToForm = () => {
        // Value is kept in sync via onChange handler below
      }
      if (form) {
        form.addEventListener('submit', syncToForm)
      }

      attachCleanupRef.current = () => {
        target.style.display = ''
        if (container.parentNode) container.parentNode.removeChild(container)
        if (form) form.removeEventListener('submit', syncToForm)
      }
    } else {
      // For divs/other elements: save original content, render editor inside
      const originalContent = target.innerHTML
      target.innerHTML = ''
      target.appendChild(container)

      attachCleanupRef.current = () => {
        target.innerHTML = originalContent
      }
    }

    setPortalContainer(container)

    return () => {
      if (attachCleanupRef.current) {
        attachCleanupRef.current()
        attachCleanupRef.current = null
      }
      setPortalContainer(null)
    }
  }, [attachTo]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync changes back to the attached element
  const handleChange = useCallback((html) => {
    if (attachTo?.current) {
      const tag = attachTo.current.tagName.toLowerCase()
      if (tag === 'textarea' || tag === 'input') {
        attachTo.current.value = html
      }
    }
    onChange?.(html)
  }, [attachTo, onChange])

  // Determine the effective value and onChange
  const effectiveValue = value !== undefined ? value : attachedInitialContent
  const effectiveOnChange = attachTo ? handleChange : onChange

  const { engine, ready } = useEditorEngine(editAreaRef, {
    value: attachTo ? effectiveValue : value,
    defaultValue: attachTo ? undefined : defaultValue,
    onChange: effectiveOnChange,
    outputFormat,
    placeholder,
    readOnly,
    plugins,
    onReady,
    onFocus,
    onBlur,
    uploadHandler,
    sanitize,
    shortcuts,
  }, portalContainer) // pass portalContainer as readyTrigger for deferred init

  const selectionState = useSelection(engine)
  const { modals, openModal, closeModal } = useModal()
  const { contextMenu, hideContextMenu } = useContextMenu(engine, editAreaRef)

  // Track editor rect for positioning overlays
  useEffect(() => {
    if (!editorRootRef.current) return
    const updateRect = () => {
      const rect = editorRootRef.current?.getBoundingClientRect()
      if (rect) setEditorRect(rect)
    }
    updateRect()
    window.addEventListener('resize', updateRect)
    window.addEventListener('scroll', updateRect, true)
    return () => {
      window.removeEventListener('resize', updateRect)
      window.removeEventListener('scroll', updateRect, true)
    }
  }, [ready])

  // Handle source mode toggle
  const [sourceMode, setSourceMode] = useState(false)
  useEffect(() => {
    if (!engine) return
    const unsub = engine.eventBus.on('mode:change', ({ sourceMode: sm }) => {
      setSourceMode(sm)
      if (sm) {
        openModal('source')
      }
    })
    return unsub
  }, [engine, openModal])

  // Handle find replace shortcut
  useEffect(() => {
    if (!engine) return
    const handleKeyDown = (e) => {
      const mod = navigator.platform.includes('Mac') ? e.metaKey : e.ctrlKey
      if (mod && e.key === 'f') {
        e.preventDefault()
        openModal('findReplace')
      }
    }
    engine.element?.addEventListener('keydown', handleKeyDown)
    return () => engine.element?.removeEventListener('keydown', handleKeyDown)
  }, [engine, openModal])

  const handleOpenModal = useCallback((name, data) => {
    openModal(name, data)
  }, [openModal])

  const editAreaStyle = {
    minHeight: minHeight || height,
    maxHeight: maxHeight || undefined,
    height: maxHeight ? undefined : height,
    overflowY: maxHeight ? 'auto' : 'auto',
  }

  const editorTree = (
    <div
      ref={editorRootRef}
      className={`rmx-editor rmx-theme-${theme} ${className}`}
      style={customTheme ? { ...customTheme, ...style } : style}
    >
      {menuBarConfig && (
        <MenuBar
          config={menuBarConfig}
          engine={engine}
          selectionState={selectionState}
          onOpenModal={handleOpenModal}
        />
      )}

      <Toolbar
        config={effectiveToolbar || toolbar}
        engine={engine}
        selectionState={selectionState}
        onOpenModal={handleOpenModal}
        fonts={mergedFonts}
        statusBarMode={statusBar}
        wordCountButton={statusBar === 'popup' ? <WordCountButton engine={engine} /> : null}
        toolbarItemTheme={toolbarItemTheme}
      />

      {statusBar === 'top' && <StatusBar engine={engine} position="top" />}

      <div className="rmx-editor-body" style={{ position: 'relative' }}>
        <EditArea
          ref={editAreaRef}
          style={editAreaStyle}
          readOnly={readOnly}
        />

        {showFloatingToolbar && (
          <FloatingToolbar
            visible={selectionState.hasSelection}
            selectionRect={selectionState.selectionRect}
            engine={engine}
            selectionState={selectionState}
            editorRect={editorRect}
            onOpenModal={handleOpenModal}
          />
        )}

        {selectionState.focusedImage && (
          <ImageResizeHandles
            image={selectionState.focusedImage}
            engine={engine}
            editorRect={editorRect}
          />
        )}

        {selectionState.focusedTable && (
          <TableControls
            table={selectionState.focusedTable}
            engine={engine}
            editorRect={editorRect}
          />
        )}

        <FindReplacePanel
          open={modals.findReplace.open}
          onClose={() => closeModal('findReplace')}
          engine={engine}
        />
      </div>

      {statusBar === 'bottom' && <StatusBar engine={engine} />}

      {showContextMenu && (
        <ContextMenu
          contextMenu={contextMenu}
          onHide={hideContextMenu}
          onOpenModal={handleOpenModal}
        />
      )}

      <LinkModal
        open={modals.link.open}
        onClose={() => closeModal('link')}
        engine={engine}
        data={modals.link.data}
      />
      <ImageModal
        open={modals.image.open}
        onClose={() => closeModal('image')}
        engine={engine}
      />
      <AttachmentModal
        open={modals.attachment?.open}
        onClose={() => closeModal('attachment')}
        engine={engine}
      />
      <ImportDocumentModal
        open={modals.importDocument?.open}
        onClose={() => closeModal('importDocument')}
        engine={engine}
      />
      <TablePickerModal
        open={modals.table.open}
        onClose={() => closeModal('table')}
        engine={engine}
      />
      <EmbedModal
        open={modals.embed.open}
        onClose={() => closeModal('embed')}
        engine={engine}
      />
      <SourceModal
        open={modals.source.open}
        onClose={() => {
          closeModal('source')
          if (engine?.isSourceMode) {
            engine.isSourceMode = false
            engine.eventBus.emit('mode:change', { sourceMode: false })
          }
        }}
        engine={engine}
      />
      <ExportModal
        open={modals.export.open}
        onClose={() => closeModal('export')}
        engine={engine}
      />
    </div>
  )

  // When attachTo is provided, render via portal into the target's location
  if (attachTo) {
    if (!portalContainer) return null
    return createPortal(editorTree, portalContainer)
  }

  return editorTree
}
