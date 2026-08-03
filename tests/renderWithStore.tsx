import type { ReactElement, ReactNode } from 'react'
import { Provider } from 'react-redux'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createAppStore } from '../src/app/store'
import type { TransactionsState } from '../src/features/transactions/types'

/**
 * Renders against a real store built by the app's own factory, so tests exercise the same
 * wiring the app uses. Returns the store for asserting on resulting state.
 */
export function renderWithStore(ui: ReactElement, preloadedTransactions?: TransactionsState) {
  const store = createAppStore(preloadedTransactions)

  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  )

  return {
    store,
    user: userEvent.setup(),
    ...render(ui, { wrapper }),
  }
}
