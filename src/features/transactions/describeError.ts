/**
 * Pulls a human-readable message out of an RTK Query error without assuming its shape.
 * Handles a `FetchBaseQueryError` (`error` or string `data`, else the status) and a
 * `SerializedError` (`message`). Returns null for anything it cannot read, so the caller
 * shows only its own title rather than a stringified object.
 */
export const describeError = (error: unknown): string | null => {
  if (typeof error === 'string') {
    return error.trim() === '' ? null : error
  }
  if (error === null || typeof error !== 'object') {
    return null
  }
  if ('error' in error && typeof error.error === 'string') {
    return error.error
  }
  if ('data' in error && typeof error.data === 'string') {
    return error.data
  }
  if ('message' in error && typeof error.message === 'string') {
    return error.message
  }
  if ('status' in error) {
    return `Request failed (${String(error.status)})`
  }
  return null
}
