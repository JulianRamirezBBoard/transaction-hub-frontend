import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from '../../app/store'
import type { TransactionsQueryArgs } from './types'

const selectTransactionsState = (state: RootState) => state.transactions

export const selectFilters = (state: RootState) => selectTransactionsState(state).filters
export const selectGrouping = (state: RootState) => selectTransactionsState(state).grouping
export const selectPagination = (state: RootState) => selectTransactionsState(state).pagination

export const selectTransactionQueryArgs = createSelector(
  [selectFilters, selectGrouping, selectPagination],
  (filters, grouping, pagination): TransactionsQueryArgs => ({
    filters,
    grouping,
    pagination,
  }),
)
