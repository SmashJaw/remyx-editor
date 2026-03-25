import { vi, beforeAll } from 'vitest'
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'

// jsdom does not implement scrollIntoView
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn()
})
import { ContextMenu } from '../components/ContextMenu/ContextMenu.jsx'
import { DropZoneOverlay } from '../components/EditArea/DropZoneOverlay.jsx'
import { SaveStatus } from '../components/SaveStatus/SaveStatus.jsx'
import { RecoveryBanner } from '../components/RecoveryBanner/RecoveryBanner.jsx'
import { SlashCommandPalette } from '../components/SlashCommandPalette/SlashCommandPalette.jsx'
import { ModalOverlay } from '../components/Modals/ModalOverlay.jsx'

// ── ContextMenu ────────────────────────────────────────────────────────────

describe('ContextMenu', () => {
  it('renders nothing when not visible', () => {
    const { container } = render(
      <ContextMenu
        contextMenu={{ visible: false, x: 0, y: 0, items: [] }}
        onHide={vi.fn()}
      />
    )
    expect(container.innerHTML).toBe('')
  })

  it('renders menu items when visible', () => {
    const items = [
      { label: 'Cut', command: vi.fn() },
      { label: 'Copy', command: vi.fn() },
    ]

    render(
      <ContextMenu
        contextMenu={{ visible: true, x: 100, y: 200, items }}
        onHide={vi.fn()}
      />
    )

    expect(screen.getByText('Cut')).toBeTruthy()
    expect(screen.getByText('Copy')).toBeTruthy()
  })

  it('renders separators', () => {
    const items = [
      { label: 'Cut', command: vi.fn() },
      { separator: true },
      { label: 'Paste', command: vi.fn() },
    ]

    const { container } = render(
      <ContextMenu
        contextMenu={{ visible: true, x: 0, y: 0, items }}
        onHide={vi.fn()}
      />
    )

    expect(container.querySelector('.rmx-context-menu-separator')).toBeTruthy()
  })

  it('calls onHide after clicking an item', () => {
    const onHide = vi.fn()
    const command = vi.fn()
    const items = [{ label: 'Cut', command }]

    render(
      <ContextMenu
        contextMenu={{ visible: true, x: 0, y: 0, items }}
        onHide={onHide}
      />
    )

    fireEvent.click(screen.getByText('Cut'))
    expect(command).toHaveBeenCalled()
    expect(onHide).toHaveBeenCalled()
  })
})

// ── DropZoneOverlay ────────────────────────────────────────────────────────

describe('DropZoneOverlay', () => {
  it('renders nothing when not visible', () => {
    const { container } = render(<DropZoneOverlay visible={false} fileTypes={[]} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders overlay when visible with file types', () => {
    const { container } = render(<DropZoneOverlay visible={true} fileTypes={['Files']} />)
    expect(container.querySelector('.rmx-drop-zone-overlay')).toBeTruthy()
    expect(screen.getByText('Drop files here')).toBeTruthy()
  })

  it('renders content drop label when no file types', () => {
    render(<DropZoneOverlay visible={true} fileTypes={['text/html']} />)
    expect(screen.getByText('Drop content here')).toBeTruthy()
  })
})

// ── SaveStatus ─────────────────────────────────────────────────────────────

describe('SaveStatus', () => {
  it('renders saved status', () => {
    render(<SaveStatus saveStatus="saved" />)
    expect(screen.getByText('Saved')).toBeTruthy()
  })

  it('renders saving status', () => {
    render(<SaveStatus saveStatus="saving" />)
    // "Saving…" contains an ellipsis character
    expect(screen.getByRole('status').textContent).toContain('Saving')
  })

  it('renders unsaved status', () => {
    render(<SaveStatus saveStatus="unsaved" />)
    expect(screen.getByText('Unsaved changes')).toBeTruthy()
  })

  it('renders error status', () => {
    render(<SaveStatus saveStatus="error" />)
    expect(screen.getByText('Save failed')).toBeTruthy()
  })

  it('has the correct CSS class for status', () => {
    const { container } = render(<SaveStatus saveStatus="saved" />)
    expect(container.querySelector('.rmx-save-status--saved')).toBeTruthy()
  })
})

// ── RecoveryBanner ─────────────────────────────────────────────────────────

describe('RecoveryBanner', () => {
  it('renders nothing when recoveryData is null', () => {
    const { container } = render(
      <RecoveryBanner recoveryData={null} onRecover={vi.fn()} onDismiss={vi.fn()} />
    )
    expect(container.innerHTML).toBe('')
  })

  it('renders banner when recoveryData is provided', () => {
    render(
      <RecoveryBanner
        recoveryData={{ recoveredContent: '<p>test</p>', timestamp: Date.now() - 5000 }}
        onRecover={vi.fn()}
        onDismiss={vi.fn()}
      />
    )

    expect(screen.getByRole('alert')).toBeTruthy()
    expect(screen.getByText('Restore')).toBeTruthy()
    expect(screen.getByText('Dismiss')).toBeTruthy()
  })

  it('calls onRecover when Restore is clicked', () => {
    const onRecover = vi.fn()
    render(
      <RecoveryBanner
        recoveryData={{ recoveredContent: '<p>test</p>', timestamp: Date.now() }}
        onRecover={onRecover}
        onDismiss={vi.fn()}
      />
    )

    fireEvent.click(screen.getByText('Restore'))
    expect(onRecover).toHaveBeenCalledTimes(1)
  })

  it('calls onDismiss when Dismiss is clicked', () => {
    const onDismiss = vi.fn()
    render(
      <RecoveryBanner
        recoveryData={{ recoveredContent: '<p>test</p>', timestamp: Date.now() }}
        onRecover={vi.fn()}
        onDismiss={onDismiss}
      />
    )

    fireEvent.click(screen.getByText('Dismiss'))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })
})

// ── SlashCommandPalette ────────────────────────────────────────────────────

describe('SlashCommandPalette', () => {
  it('renders nothing when not visible', () => {
    const { container } = render(
      <SlashCommandPalette
        visible={false}
        position={{ top: 0, left: 0 }}
        filteredItems={[]}
        selectedIndex={0}
        setSelectedIndex={vi.fn()}
        selectItem={vi.fn()}
      />
    )
    expect(container.innerHTML).toBe('')
  })

  it('renders nothing when filteredItems is null', () => {
    const { container } = render(
      <SlashCommandPalette
        visible={true}
        position={{ top: 0, left: 0 }}
        filteredItems={null}
        selectedIndex={0}
        setSelectedIndex={vi.fn()}
        selectItem={vi.fn()}
      />
    )
    expect(container.innerHTML).toBe('')
  })

  it('renders "No matching commands" when filteredItems is empty', () => {
    render(
      <SlashCommandPalette
        visible={true}
        position={{ top: 10, left: 20 }}
        filteredItems={[]}
        selectedIndex={0}
        setSelectedIndex={vi.fn()}
        selectItem={vi.fn()}
      />
    )
    expect(screen.getByText('No matching commands')).toBeTruthy()
  })

  it('renders items grouped by category', () => {
    const items = [
      { id: 'h1', label: 'Heading 1', description: 'Big heading', category: 'Headings', icon: 'H1' },
      { id: 'bold', label: 'Bold', description: 'Bold text', category: 'Formatting', icon: 'B' },
    ]

    render(
      <SlashCommandPalette
        visible={true}
        position={{ top: 0, left: 0 }}
        filteredItems={items}
        selectedIndex={0}
        setSelectedIndex={vi.fn()}
        selectItem={vi.fn()}
      />
    )

    expect(screen.getByText('Headings')).toBeTruthy()
    expect(screen.getByText('Formatting')).toBeTruthy()
    expect(screen.getByText('Heading 1')).toBeTruthy()
    expect(screen.getByText('Bold')).toBeTruthy()
  })

  it('calls selectItem when an item is clicked', () => {
    const selectItem = vi.fn()
    const items = [
      { id: 'h1', label: 'Heading 1', description: 'Big heading', category: 'Headings', icon: 'H1' },
    ]

    render(
      <SlashCommandPalette
        visible={true}
        position={{ top: 0, left: 0 }}
        filteredItems={items}
        selectedIndex={0}
        setSelectedIndex={vi.fn()}
        selectItem={selectItem}
      />
    )

    fireEvent.click(screen.getByText('Heading 1'))
    expect(selectItem).toHaveBeenCalledWith(items[0])
  })
})

// ── ModalOverlay ───────────────────────────────────────────────────────────

describe('ModalOverlay', () => {
  it('renders nothing when not open', () => {
    const { container } = render(
      <ModalOverlay title="Test" open={false} onClose={vi.fn()}>
        <p>Content</p>
      </ModalOverlay>
    )
    expect(container.innerHTML).toBe('')
  })

  it('renders dialog when open', () => {
    render(
      <ModalOverlay title="Test Modal" open={true} onClose={vi.fn()}>
        <p>Modal content</p>
      </ModalOverlay>
    )

    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(screen.getByText('Test Modal')).toBeTruthy()
    expect(screen.getByText('Modal content')).toBeTruthy()
  })

  it('calls onClose when overlay is clicked', () => {
    const onClose = vi.fn()
    render(
      <ModalOverlay title="Test" open={true} onClose={onClose}>
        <p>Content</p>
      </ModalOverlay>
    )

    // Click the overlay (the outermost div)
    fireEvent.click(document.querySelector('.rmx-modal-overlay'))
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn()
    render(
      <ModalOverlay title="Test" open={true} onClose={onClose}>
        <p>Content</p>
      </ModalOverlay>
    )

    fireEvent.keyDown(document.querySelector('.rmx-modal-overlay'), { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })

  it('does not close when modal content is clicked', () => {
    const onClose = vi.fn()
    render(
      <ModalOverlay title="Test" open={true} onClose={onClose}>
        <p>Content</p>
      </ModalOverlay>
    )

    fireEvent.click(document.querySelector('.rmx-modal'))
    expect(onClose).not.toHaveBeenCalled()
  })
})
