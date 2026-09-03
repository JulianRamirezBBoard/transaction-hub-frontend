import { useAppDispatch, useAppSelector } from '../../../app/hooks'
import { selectPagination } from '../selectors'
import { setPage, setPageSize } from '../transactionsSlice'
import { PAGE_SIZE_OPTIONS, isPageSizeOption } from '../types'
import { parseNumberOrNull } from '../format'
import { getPageItemRange } from '../logic'
import { useDebouncedDraft } from '../../../hooks/useDebouncedDraft'

const PAGE_INPUT_DELAY_MS = 300

interface PaginationControlsProps {
  /** The page actually being displayed, as reported by the query. */
  page: number
  totalPages: number
  totalItems: number
}

export function PaginationControls({ page, totalPages, totalItems }: PaginationControlsProps) {
  const dispatch = useAppDispatch()
  const { pageSize } = useAppSelector(selectPagination)

  // The field keeps its own draft so it can be cleared mid-edit instead of snapping back.
  // Debounced so typing "12" doesn't commit page 1 on the way. Invalid drafts never commit.
  const { draft, setDraft, resetDraft } = useDebouncedDraft<number, string | null>(
    page,
    (value) => {
      const parsed = parseNumberOrNull(value)
      if (parsed !== null && Number.isInteger(parsed) && parsed >= 1 && parsed <= totalPages) {
        dispatch(setPage(parsed))
      }
    },
    { delayMs: PAGE_INPUT_DELAY_MS, toDraft: () => null },
  )

  const { startItem, endItem } = getPageItemRange(page, pageSize, totalItems)

  return (
    <nav aria-label="Pagination" className="card">
      <div className="card-body">
        <div className="space-y-4 sm:space-y-0 sm:flex sm:flex-wrap sm:justify-between sm:items-center sm:gap-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 items-stretch sm:items-center">
            <button
              className="btn btn-secondary"
              onClick={() => dispatch(setPage(page - 1))}
              disabled={page <= 1}
              aria-label="Go to previous page"
            >
              Previous
            </button>

            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <label
                htmlFor="page-input"
                className="text-sm font-medium text-gray-700 whitespace-nowrap"
              >
                Page:
              </label>
              <input
                id="page-input"
                type="number"
                className="form-input w-16"
                min={1}
                max={totalPages}
                value={draft ?? String(page)}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={() => resetDraft()}
                aria-label="Current page number"
              />
              <span className="text-sm text-gray-600 whitespace-nowrap">of {totalPages}</span>
            </div>

            <button
              className="btn btn-secondary"
              onClick={() => dispatch(setPage(page + 1))}
              disabled={page >= totalPages}
              aria-label="Go to next page"
            >
              Next
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 items-stretch sm:items-center">
            <label
              htmlFor="page-size-select"
              className="text-sm font-medium text-gray-700 sm:whitespace-nowrap"
            >
              Rows per page:
            </label>
            <select
              id="page-size-select"
              className="form-select"
              value={pageSize}
              onChange={(e) => {
                const newSize = parseNumberOrNull(e.target.value)
                if (newSize !== null && isPageSizeOption(newSize)) {
                  dispatch(setPageSize(newSize))
                }
              }}
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>

          <div className="text-sm text-gray-700 text-center sm:text-left">
            Showing{' '}
            <strong>
              {startItem}-{endItem}
            </strong>{' '}
            of <strong>{totalItems}</strong>
          </div>
        </div>
      </div>
    </nav>
  )
}
