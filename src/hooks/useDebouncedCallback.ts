import { useEffect, useRef } from 'react'

/**
 * Defers `callback` until `delayMs` passes without another call, so fast-changing inputs
 * don't issue a query per keystroke. The callback lives in a ref so a re-render with a new
 * closure doesn't reset the timer.
 */
export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delayMs: number,
): (...args: Args) => void {
  const callbackRef = useRef(callback)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    callbackRef.current = callback
  })

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current)
    }
  }, [])

  return (...args: Args) => {
    if (timerRef.current !== null) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => callbackRef.current(...args), delayMs)
  }
}
