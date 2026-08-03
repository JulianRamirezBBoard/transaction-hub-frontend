import type { TransactionGroupPage } from '../types'
import { formatCurrency } from '../format'
import { TransactionRow } from './TransactionRow'

interface TransactionGroupSectionProps {
  group: TransactionGroupPage
}

export function TransactionGroupSection({ group }: TransactionGroupSectionProps) {
  const { summary, transactions, continued } = group

  return (
    <section aria-labelledby={`period-${summary.periodKey}`}>
      <div className="card">
        <div className="card-header">
          <div className="mb-3 sm:mb-4">
            <h3 id={`period-${summary.periodKey}`} className="card-title text-base sm:text-lg">
              {summary.periodLabel}
              {continued && (
                <span className="text-gray-500 font-normal ml-2 text-sm">(continued)</span>
              )}
            </h3>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm">
            <div className="min-w-0">
              <div className="text-gray-600 truncate">Count:</div>
              <div className="font-semibold text-gray-900 truncate">{summary.transactionCount}</div>
            </div>
            <div className="min-w-0">
              <div className="text-gray-600 truncate">Total:</div>
              <div className="font-semibold text-gray-900 truncate">
                {formatCurrency(summary.totalAmount)}
              </div>
            </div>
            <div className="min-w-0">
              <div className="text-gray-600 truncate">Average:</div>
              <div className="font-semibold text-gray-900 truncate">
                {formatCurrency(summary.averageAmount)}
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Description</th>
                <th scope="col">Category</th>
                <th scope="col" className="text-right">
                  Amount
                </th>
                <th scope="col" className="text-right">
                  Running Total
                </th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((txn) => (
                <TransactionRow key={txn.id} transaction={txn} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
