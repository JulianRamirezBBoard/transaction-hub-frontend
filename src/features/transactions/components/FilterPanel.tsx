import { useAppSelector } from '../../../app/hooks'
import { selectFilters } from '../selectors'
import { hasActiveFilters } from '../logic'
import { DateRangeFilter } from './DateRangeFilter'
import { CategoryFilter } from './CategoryFilter'
import { AmountFilter } from './AmountFilter'
import { FilterLogicToggle } from './FilterLogicToggle'
import { ClearFiltersButton } from './ClearFiltersButton'

export function FilterPanel() {
  const filters = useAppSelector(selectFilters)

  return (
    // Filters apply as they change; there is nothing to submit, so Enter must not reload the page.
    <form
      className="card"
      aria-label="Transaction filters"
      onSubmit={(event) => event.preventDefault()}
    >
      <div className="card-body">
        <h3 className="card-title mb-4 sm:mb-6 text-lg sm:text-xl">Filters</h3>

        <div className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <DateRangeFilter />
            </div>

            <div>
              <CategoryFilter />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <AmountFilter />
            </div>

            <div>
              <FilterLogicToggle />
            </div>
          </div>
        </div>

        {hasActiveFilters(filters) && (
          <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
            <ClearFiltersButton />
          </div>
        )}
      </div>
    </form>
  )
}
