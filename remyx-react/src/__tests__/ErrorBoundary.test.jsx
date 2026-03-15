import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { EditorErrorBoundary } from '../components/ErrorBoundary.jsx'

// Suppress React error boundary console errors in tests
const originalConsoleError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('Error Boundary')) return
    if (typeof args[0] === 'string' && args[0].includes('The above error')) return
    originalConsoleError.call(console, ...args)
  }
})
afterAll(() => {
  console.error = originalConsoleError
})

const ThrowingComponent = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>Child content</div>
}

describe('EditorErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    render(
      <EditorErrorBoundary>
        <div>Normal content</div>
      </EditorErrorBoundary>
    )

    expect(screen.getByText('Normal content')).toBeTruthy()
  })

  it('renders default fallback UI when an error occurs', () => {
    render(
      <EditorErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </EditorErrorBoundary>
    )

    expect(screen.getByText('Something went wrong with the editor.')).toBeTruthy()
    expect(screen.getByText('Try again')).toBeTruthy()
  })

  it('renders custom fallback when provided', () => {
    const customFallback = <div>Custom error fallback</div>

    render(
      <EditorErrorBoundary fallback={customFallback}>
        <ThrowingComponent shouldThrow={true} />
      </EditorErrorBoundary>
    )

    expect(screen.getByText('Custom error fallback')).toBeTruthy()
    expect(screen.queryByText('Something went wrong with the editor.')).toBeNull()
  })

  it('calls onError callback when an error occurs', () => {
    const onError = jest.fn()

    render(
      <EditorErrorBoundary onError={onError}>
        <ThrowingComponent shouldThrow={true} />
      </EditorErrorBoundary>
    )

    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ componentStack: expect.any(String) })
    )
    expect(onError.mock.calls[0][0].message).toBe('Test error')
  })

  it('resets error state when "Try again" button is clicked', () => {
    const { rerender } = render(
      <EditorErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </EditorErrorBoundary>
    )

    expect(screen.getByText('Something went wrong with the editor.')).toBeTruthy()

    // Re-render with non-throwing child before clicking Try again
    rerender(
      <EditorErrorBoundary>
        <ThrowingComponent shouldThrow={false} />
      </EditorErrorBoundary>
    )

    fireEvent.click(screen.getByText('Try again'))

    expect(screen.getByText('Child content')).toBeTruthy()
    expect(screen.queryByText('Something went wrong with the editor.')).toBeNull()
  })

  it('has the rmx-error-boundary class on the fallback container', () => {
    const { container } = render(
      <EditorErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </EditorErrorBoundary>
    )

    expect(container.querySelector('.rmx-error-boundary')).toBeTruthy()
  })
})
