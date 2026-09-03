import { render, screen, within } from '@testing-library/react'
import { TransactionRow } from '../src/features/transactions/components/TransactionRow'
import { TransactionGroupSection } from '../src/features/transactions/components/TransactionGroupSection'
import type {
  TransactionGroupPage,
  TransactionWithRunningTotal,
} from '../src/features/transactions/types'
import { makeRow } from './helpers'

const renderRow = (row: TransactionWithRunningTotal) =>
  render(
    <table>
      <tbody>
        <TransactionRow transaction={row} />
      </tbody>
    </table>,
  )

describe('TransactionRow', () => {
  it('formats the amount and the running total as currency', () => {
    renderRow(makeRow({ id: 'txn-1', amount: -44.45, runningTotal: -142.6 }))

    expect(screen.getByText('-$44.45')).toBeInTheDocument()
    expect(screen.getByText('-$142.60')).toBeInTheDocument()
  })

  it('marks an expense as a debit, in text as well as colour', () => {
    renderRow(makeRow({ id: 'txn-1', amount: -50, runningTotal: -123.45 }))
    const amountCell = screen.getByText('-$50.00').closest('td')

    expect(amountCell).toHaveClass('text-danger-600')
    expect(within(amountCell as HTMLElement).getByText('debit')).toBeInTheDocument()
  })

  it('marks income as a credit', () => {
    renderRow(makeRow({ id: 'txn-1', amount: 4500, runningTotal: 1234.56, category: 'Salary' }))
    const amountCell = screen.getByText('$4,500.00').closest('td')

    expect(amountCell).toHaveClass('text-success-600')
    expect(within(amountCell as HTMLElement).getByText('credit')).toBeInTheDocument()
  })

  it('gives the category its own badge class', () => {
    renderRow(makeRow({ id: 'txn-1', category: 'Dining' }))

    expect(screen.getByText('Dining')).toHaveClass('badge', 'text-category-dining')
  })
})

describe('TransactionGroupSection', () => {
  const group: TransactionGroupPage = {
    summary: {
      periodKey: '2026-07',
      periodLabel: 'July 2026',
      transactionCount: 2,
      totalAmount: -94.9,
      averageAmount: -47.45,
    },
    transactions: [
      makeRow({ id: 'txn-1', amount: -44.45, runningTotal: -44.45, periodKey: '2026-07' }),
      makeRow({ id: 'txn-2', amount: -50.45, runningTotal: -94.9, periodKey: '2026-07' }),
    ],
    continued: false,
  }

  it('names the table for assistive tech and lists the period summary as a description list', () => {
    render(<TransactionGroupSection group={group} />)

    expect(screen.getByRole('table', { name: 'Transactions for July 2026' })).toBeInTheDocument()

    const total = screen.getByText('Total').closest('div') as HTMLElement
    expect(within(total).getByText('-$94.90')).toBeInTheDocument()
  })

  it('shows a "(continued)" marker when the period started on an earlier page', () => {
    render(<TransactionGroupSection group={{ ...group, continued: true }} />)

    expect(screen.getByText('(continued)')).toBeInTheDocument()
  })
})
