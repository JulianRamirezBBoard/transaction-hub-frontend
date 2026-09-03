import { useAppSelector } from '../../../app/hooks'
import { useGetTransactionsQuery } from '../transactionsApi'
import { selectTransactionQueryArgs, selectPagination } from '../selectors'
import { describeError } from '../describeError'
import { getPageItemRange } from '../logic'
import { FilterPanel } from './FilterPanel'
import { GroupingToggle } from './GroupingToggle'
import { TransactionGroupSection } from './TransactionGroupSection'
import { PaginationControls } from './PaginationControls'
import { EmptyState } from './EmptyState'
import { ErrorFallback } from '../../../components/ErrorFallback'

export function TransactionListPage() {
  const queryArgs = useAppSelector(selectTransactionQueryArgs)
  const { pageSize } = useAppSelector(selectPagination)
  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetTransactionsQuery(queryArgs)

  const errorDetail = isError ? describeError(error) : null

  // The polite region always mounts a string. The alert owns the error wording, so stay quiet there.
  let statusMessage = ''
  if (isFetching && !isLoading) {
    statusMessage = 'Updating transactions'
  } else if (data && !isError) {
    const { startItem, endItem } = getPageItemRange(data.page, pageSize, data.totalItems)
    statusMessage = `Showing ${startItem} to ${endItem} of ${data.totalItems} transactions`
  }

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

      <div role="status" aria-live="polite">
        {isLoading ? (
          <div className="alert alert-info">
            <div className="animate-pulse">Loading transactions...</div>
          </div>
        ) : (
          <span className="sr-only">{statusMessage}</span>
        )}
      </div>

      {!isLoading && isFetching && (
        <p className="text-sm text-gray-500 animate-pulse" aria-hidden="true">
          Updating...
        </p>
      )}

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
