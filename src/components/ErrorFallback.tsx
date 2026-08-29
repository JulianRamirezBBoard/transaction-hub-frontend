import { useEffect, useRef } from 'react'

interface ErrorFallbackProps {
  /** The main, plain-language sentence shown to the user. */
  title: string
  /** Optional raw error text. Hidden when null, undefined, or empty. */
  detail?: string | null
  /** Called when the user clicks "Try again". */
  onRetry: () => void
}

/**
 * Shared error panel for the app-level ErrorBoundary and the transactions fetch error.
 * Announces itself with `role="alert"` and pulls keyboard focus onto the panel, so a
 * keyboard user is not dropped back to <body> when the panel replaces the content.
 */
export function ErrorFallback({ title, detail, onRetry }: ErrorFallbackProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    containerRef.current?.focus()
  }, [])

  const hasDetail = detail !== null && detail !== undefined && detail !== ''

  return (
    <div ref={containerRef} tabIndex={-1} className="alert alert-danger" role="alert">
      <div>
        <p className="mb-1">{title}</p>
        {hasDetail && <p className="mb-3 text-sm opacity-80">Details: {detail}</p>}
      </div>
      <button type="button" className="btn btn-secondary" onClick={onRetry}>
        Try again
      </button>
    </div>
  )
}
