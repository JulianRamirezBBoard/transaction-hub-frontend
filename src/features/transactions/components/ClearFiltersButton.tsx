import { useAppDispatch } from '../../../app/hooks'
import { clearAllFilters } from '../transactionsSlice'

export function ClearFiltersButton() {
  const dispatch = useAppDispatch()

  return (
    <button
      type="button"
      className="btn btn-secondary"
      onClick={() => dispatch(clearAllFilters())}
      aria-label="Clear all filters and reset to defaults"
    >
      Clear All Filters
    </button>
  )
}
