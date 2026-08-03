import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { apiSlice } from '../features/api/apiSlice'
import { transactionsReducer } from '../features/transactions/transactionsSlice'
import type { TransactionsState } from '../features/transactions/types'

/** Single definition of the store's shape; tests build their own instance from it. */
export function createAppStore(preloadedTransactions?: TransactionsState) {
  return configureStore({
    reducer: {
      [apiSlice.reducerPath]: apiSlice.reducer,
      transactions: transactionsReducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(apiSlice.middleware),
    preloadedState: preloadedTransactions ? { transactions: preloadedTransactions } : undefined,
  })
}

export const store = createAppStore()

// Only the app store refetches on focus/reconnect.
setupListeners(store.dispatch)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
