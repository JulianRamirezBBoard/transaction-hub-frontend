import { act, render } from '@testing-library/react'
import { useDebouncedCallback } from '../src/hooks/useDebouncedCallback'

/** Test harness: exposes the debounced function so the test can call it directly. */
function Harness({ onCall }: { onCall: () => void }) {
  const debounced = useDebouncedCallback(onCall, 300)
  return (
    <button type="button" onClick={() => debounced()}>
      run
    </button>
  )
}

describe('useDebouncedCallback', () => {
  it('does not fire a pending call after the component unmounts', () => {
    jest.useFakeTimers()
    try {
      const onCall = jest.fn()
      const { getByRole, unmount } = render(<Harness onCall={onCall} />)

      act(() => {
        getByRole('button').click()
      })

      unmount()

      act(() => {
        jest.runAllTimers()
      })

      expect(onCall).not.toHaveBeenCalled()
    } finally {
      jest.useRealTimers()
    }
  })

  it('fires once after the delay when the component stays mounted', () => {
    jest.useFakeTimers()
    try {
      const onCall = jest.fn()
      const { getByRole } = render(<Harness onCall={onCall} />)

      act(() => {
        getByRole('button').click()
        getByRole('button').click()
      })
      act(() => {
        jest.advanceTimersByTime(300)
      })

      expect(onCall).toHaveBeenCalledTimes(1)
    } finally {
      jest.useRealTimers()
    }
  })
})
