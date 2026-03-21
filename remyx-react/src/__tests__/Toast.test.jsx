import { vi } from 'vitest'
import React from 'react'
import { render, screen, act } from '@testing-library/react'
import { renderHook } from '@testing-library/react'
import { Toast, useToast } from '../components/Toast/Toast.jsx'

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the message', () => {
    render(<Toast message="Saved!" />)
    expect(screen.getByText('Saved!')).toBeTruthy()
  })

  it('renders with correct type class', () => {
    const { container } = render(<Toast message="Done" type="success" />)
    expect(container.querySelector('.rmx-toast--success')).toBeTruthy()
  })

  it('defaults to info type', () => {
    const { container } = render(<Toast message="Info" />)
    expect(container.querySelector('.rmx-toast--info')).toBeTruthy()
  })

  it('has role="status" and aria-live="polite"', () => {
    render(<Toast message="Hello" />)
    const el = screen.getByRole('status')
    expect(el.getAttribute('aria-live')).toBe('polite')
  })

  it('auto-dismisses after duration', () => {
    const onDismiss = vi.fn()
    render(<Toast message="Bye" duration={2000} onDismiss={onDismiss} />)
    expect(screen.getByText('Bye')).toBeTruthy()

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('renders nothing when message is empty', () => {
    const { container } = render(<Toast message="" />)
    expect(container.innerHTML).toBe('')
  })

  it('sets animation duration style', () => {
    render(<Toast message="Test" duration={5000} />)
    const el = screen.getByRole('status')
    expect(el.style.animationDuration).toBe('5000ms')
  })

  it('clears timer on unmount', () => {
    const onDismiss = vi.fn()
    const { unmount } = render(<Toast message="Test" duration={3000} onDismiss={onDismiss} />)
    unmount()
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(onDismiss).not.toHaveBeenCalled()
  })
})

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns [null, showToast] initially', () => {
    const { result } = renderHook(() => useToast())
    const [toastEl, showToast] = result.current
    expect(toastEl).toBeNull()
    expect(typeof showToast).toBe('function')
  })

  it('showToast creates a toast element', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current[1]('Hello!', 'success')
    })

    const [toastEl] = result.current
    expect(toastEl).not.toBeNull()
  })

  it('toast element renders correctly', () => {
    function Wrapper() {
      const [toastEl, showToast] = useToast()
      React.useEffect(() => {
        showToast('Toast message', 'warning', 3000)
      }, [showToast])
      return <div>{toastEl}</div>
    }

    render(<Wrapper />)
    expect(screen.getByText('Toast message')).toBeTruthy()
  })

  it('toast auto-dismisses and clears state', () => {
    function Wrapper() {
      const [toastEl, showToast] = useToast()
      React.useEffect(() => {
        showToast('Auto dismiss', 'info', 1000)
      }, [showToast])
      return <div data-testid="wrapper">{toastEl}</div>
    }

    render(<Wrapper />)
    expect(screen.getByText('Auto dismiss')).toBeTruthy()

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    // After dismiss, the toast element should be null
    expect(screen.queryByText('Auto dismiss')).toBeNull()
  })

  it('showToast with different messages creates new toast', () => {
    function Wrapper() {
      const [toastEl, showToast] = useToast()
      return (
        <div>
          <button data-testid="show-first" onClick={() => showToast('First toast')}>Show First</button>
          <button data-testid="show-second" onClick={() => showToast('Second toast')}>Show Second</button>
          {toastEl}
        </div>
      )
    }

    render(<Wrapper />)

    act(() => {
      screen.getByTestId('show-first').click()
    })
    expect(screen.getByText('First toast')).toBeTruthy()

    act(() => {
      screen.getByTestId('show-second').click()
    })
    expect(screen.getByText('Second toast')).toBeTruthy()
  })
})
