import { ClearFiltersButton } from './ClearFiltersButton'

export function EmptyState() {
  return (
    <section className="text-center py-12">
      <div className="alert alert-info inline-block">
        <h2 className="text-lg font-semibold mb-2">No transactions found</h2>
        <p className="text-gray-600 mb-4">
          Try adjusting your filters to find matching transactions.
        </p>
        <ClearFiltersButton />
      </div>
    </section>
  )
}
