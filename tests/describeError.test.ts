import { describeError } from '../src/features/transactions/describeError'

describe('describeError', () => {
  it('returns null when there is no error', () => {
    expect(describeError(null)).toBeNull()
    expect(describeError(undefined)).toBeNull()
  })

  it('passes a non-empty plain string through, but treats a blank string as no message', () => {
    expect(describeError('boom')).toBe('boom')
    expect(describeError('')).toBeNull()
    expect(describeError('   ')).toBeNull()
  })

  it('returns null for shapes it cannot read, rather than a stringified object', () => {
    expect(describeError(404)).toBeNull()
    expect(describeError(true)).toBeNull()
    expect(describeError({ some: 'unknown shape' })).toBeNull()
    // A SerializedError can arrive with no message at all.
    expect(describeError({ name: 'Error', code: 'ERR_X' })).toBeNull()
  })

  it('reads the custom-error message an RTK Query queryFn returns', () => {
    expect(describeError({ status: 'CUSTOM_ERROR', error: 'Failed to load transactions' })).toBe(
      'Failed to load transactions',
    )
  })

  it('reads string data from a FetchBaseQueryError', () => {
    expect(describeError({ status: 500, data: 'Server exploded' })).toBe('Server exploded')
  })

  it('falls back to the status when a FetchBaseQueryError carries no readable body', () => {
    expect(describeError({ status: 503, data: { detail: 'unavailable' } })).toBe(
      'Request failed (503)',
    )
  })

  it('reads the message from a SerializedError', () => {
    expect(describeError({ name: 'Error', message: 'Something broke' })).toBe('Something broke')
  })
})
