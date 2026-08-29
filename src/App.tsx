import { TransactionListPage } from './features/transactions/components/TransactionListPage'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ErrorFallback } from './components/ErrorFallback'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="sticky top-0 z-40 bg-white shadow-md">
        <div className="page-container py-6">
          <h1 className="gradient-heading text-2xl sm:text-3xl md:text-4xl font-bold leading-tight">
            Transaction Hub
          </h1>
        </div>
      </header>

      <main className="page-container py-6 sm:py-8">
        <ErrorBoundary
          fallback={(error, reset) => (
            <ErrorFallback
              title="Something went wrong while rendering the transaction list."
              detail={error.message}
              onRetry={reset}
            />
          )}
        >
          <TransactionListPage />
        </ErrorBoundary>
      </main>
    </div>
  )
}

export default App
