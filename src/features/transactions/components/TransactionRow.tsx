import type { TransactionCategory, TransactionKind, TransactionWithRunningTotal } from '../types'
import { formatCurrency } from '../format'
import { getTransactionKind } from '../logic'

interface TransactionRowProps {
  transaction: TransactionWithRunningTotal
}

/**
 * Typed as a total record over `TransactionCategory`, so adding a category without giving it
 * a colour is a compile error rather than a silent fall-through to grey.
 */
const CATEGORY_BADGE_CLASSES: Record<TransactionCategory, string> = {
  Salary: 'bg-category-salary/10 text-category-salary',
  Groceries: 'bg-category-groceries/10 text-category-groceries',
  Dining: 'bg-category-dining/10 text-category-dining',
  Transport: 'bg-category-transport/10 text-category-transport',
  Utilities: 'bg-category-utilities/10 text-category-utilities',
  Rent: 'bg-category-rent/10 text-category-rent',
  Entertainment: 'bg-category-entertainment/10 text-category-entertainment',
  Healthcare: 'bg-category-healthcare/10 text-category-healthcare',
  Shopping: 'bg-category-shopping/10 text-category-shopping',
  Subscriptions: 'bg-category-subscriptions/10 text-category-subscriptions',
  Travel: 'bg-category-travel/10 text-category-travel',
  Transfer: 'bg-category-transfer/10 text-category-transfer',
  Other: 'bg-category-other/10 text-category-other',
}

const AMOUNT_CLASSES: Record<TransactionKind, string> = {
  income: 'text-success-600 font-semibold',
  expense: 'text-danger-600 font-semibold',
  neutral: 'text-gray-700',
}

/** Spoken label so the credit/expense split does not depend on text colour alone. */
const KIND_LABELS: Record<TransactionKind, string> = {
  income: 'credit',
  expense: 'debit',
  neutral: 'no change',
}

export function TransactionRow({ transaction }: TransactionRowProps) {
  const kind = getTransactionKind(transaction.amount)

  return (
    <tr>
      <td>
        <time dateTime={transaction.date} className="text-gray-600">
          {transaction.date}
        </time>
      </td>
      <td className="text-gray-900">{transaction.description}</td>
      <td>
        <span className={`badge ${CATEGORY_BADGE_CLASSES[transaction.category]}`}>
          {transaction.category}
        </span>
      </td>
      <td className={`text-right ${AMOUNT_CLASSES[kind]}`}>
        <span className="sr-only">{KIND_LABELS[kind]} </span>
        {formatCurrency(transaction.amount)}
      </td>
      <td className="text-right text-gray-600">{formatCurrency(transaction.runningTotal)}</td>
    </tr>
  )
}
