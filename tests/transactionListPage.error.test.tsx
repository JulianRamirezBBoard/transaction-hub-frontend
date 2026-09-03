import { screen } from '@testing-library/react'

// One malformed row: its date fails validation deep in the pipeline, so the mock queryFn's
// try/catch turns it into an RTK Query error. This exercises the whole error path end to end.
jest.mock('../src/features/transactions/mockData', () => ({
  MOCK_TRANSACTIONS: [
    { id: 'bad-1', date: '07/15/2026', description: 'Broken', category: 'Other', amount: -10 },
  ],
}))

import { TransactionListPage } from '../src/features/transactions/components/TransactionListPage'
import { renderWithStore } from './renderWithStore'

describe('TransactionListPage error branch', () => {
  it('renders the error fallback with a readable detail when the query fails', async () => {
    renderWithStore(<TransactionListPage />)

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Could not load transactions.')
    expect(alert).toHaveTextContent(/Invalid date/)
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })
})
