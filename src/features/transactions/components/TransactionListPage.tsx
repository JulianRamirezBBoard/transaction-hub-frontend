import { useAppSelector } from '../../../app/hooks'
import { useGetTransactionsQuery } from '../transactionsApi'
import { selectTransactionQueryArgs } from '../selectors'
import { FilterPanel } from './FilterPanel'
import { GroupingToggle } from './GroupingToggle'
import { TransactionGroupSection } from './TransactionGroupSection'
import { PaginationControls } from './PaginationControls'
import { EmptyState } from './EmptyState'
import { ErrorFallback } from '../../../components/ErrorFallback'

export function TransactionListPage() {
  const queryArgs = useAppSelector(selectTransactionQueryArgs)
  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetTransactionsQuery(queryArgs)

  const errorDetail = isError ? describeError(error) : null

  return (
    <div className="space-y-4 sm:space-y-6">
      <section aria-labelledby="filters-heading" className="space-y-4">
        <h2 id="filters-heading" className="sr-only">
          Filters
        </h2>
        <FilterPanel />
      </section>

      <section aria-labelledby="grouping-heading">
        <h2 id="grouping-heading" className="sr-only">
          Grouping Options
        </h2>
        <GroupingToggle />
      </section>

      <div role="status" aria-live="polite" aria-busy={isFetching}>
        {isLoading && (
          <div className="alert alert-info">
            <div className="animate-pulse">Loading transactions...</div>
          </div>
        )}
      </div>

      {isError && (
        <ErrorFallback
          title="Could not load transactions."
          detail={errorDetail}
          onRetry={() => refetch()}
        />
      )}

      {data && data.totalItems === 0 && <EmptyState />}

      {data && data.totalItems > 0 && (
        <section aria-labelledby="transactions-heading" className="space-y-4">
          <h2 id="transactions-heading" className="sr-only">
            Transactions
          </h2>

          <div className="space-y-3 sm:space-y-4">
            {data.pageGroups.map((group) => (
              <TransactionGroupSection key={group.summary.periodKey} group={group} />
            ))}
          </div>

          <PaginationControls
            page={data.page}
            totalPages={data.totalPages}
            totalItems={data.totalItems}
          />
        </section>
      )}
    </div>
  )
}

/** Pulls a human-readable message out of an RTK Query error without assuming its shape. */
function describeError(error: unknown): string | null {
  if (error === null || typeof error !== 'object') return null
  if ('error' in error && typeof error.error === 'string') return error.error
  if ('message' in error && typeof error.message === 'string') return error.message
  return null
}
