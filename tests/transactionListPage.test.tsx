import { screen } from '@testing-library/react'
import { TransactionListPage } from '../src/features/transactions/components/TransactionListPage'
import { renderWithStore } from './renderWithStore'
import { makeState } from './helpers'

describe('TransactionListPage', () => {
  it('shows a loading message first, then the transaction table', async () => {
    renderWithStore(<TransactionListPage />)

    expect(screen.getByText('Loading transactions...')).toBeInTheDocument()

    expect(await screen.findAllByRole('table')).not.toHaveLength(0)
  })

  it('puts a plain-language range in the live region once the data arrives', async () => {
    renderWithStore(<TransactionListPage />)

    // 420 mock rows, 25 to a page, page 1.
    expect(await screen.findByText('Showing 1 to 25 of 420 transactions')).toBeInTheDocument()
  })

  it('shows the empty state when a filter matches nothing', async () => {
    renderWithStore(
      <TransactionListPage />,
      makeState({
        filters: {
          logic: 'AND',
          dateRange: { preset: null, startDate: null, endDate: null },
          categories: [],
          amountRange: { min: 1_000_000, max: null },
        },
      }),
    )

    expect(await screen.findByText('No transactions found')).toBeInTheDocument()
    expect(screen.getByText('Showing 0 to 0 of 0 transactions')).toBeInTheDocument()
  })
})
