import { configureStore } from '@reduxjs/toolkit'
import { apiSlice } from '../features/api/apiSlice'
import { transactionsReducer } from '../features/transactions/transactionsSlice'
import type { TransactionsState } from '../features/transactions/types'

/** Single definition of the store's shape; tests build their own instance from it. */
export const createAppStore = (preloadedTransactions?: TransactionsState) => {
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

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
