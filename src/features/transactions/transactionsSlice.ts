import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type {
  FiltersState,
  TransactionCategory,
  GroupingPeriod,
  PaginationState,
  DatePreset,
  FilterLogic,
  PageSizeOption,
  TransactionsState,
} from './types'
import { clampPage } from './logic'

const initialFiltersState: FiltersState = {
  logic: 'AND',
  dateRange: {
    preset: null,
    startDate: null,
    endDate: null,
  },
  categories: [],
  amountRange: {
    min: null,
    max: null,
  },
}

const initialPaginationState: PaginationState = {
  page: 1,
  pageSize: 25,
}

const initialState: TransactionsState = {
  filters: initialFiltersState,
  grouping: 'monthly',
  pagination: initialPaginationState,
}

/**
 * Owns filters, grouping and pagination. Changing *what* is shown returns to page 1;
 * changing only *how* it is bucketed does not.
 */
export const transactionsSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    setDateRangePreset: (state, action: PayloadAction<DatePreset | null>) => {
      state.filters.dateRange.preset = action.payload
      // Concrete bounds are derived from the preset at query time, so clear any stale ones.
      state.filters.dateRange.startDate = null
      state.filters.dateRange.endDate = null
      state.pagination.page = 1
    },

    setCustomDateRange: (
      state,
      action: PayloadAction<{ startDate: string | null; endDate: string | null }>,
    ) => {
      state.filters.dateRange.preset = 'custom'
      state.filters.dateRange.startDate = action.payload.startDate
      state.filters.dateRange.endDate = action.payload.endDate
      state.pagination.page = 1
    },

    toggleCategory: (state, action: PayloadAction<TransactionCategory>) => {
      const idx = state.filters.categories.indexOf(action.payload)
      if (idx >= 0) {
        state.filters.categories.splice(idx, 1)
      } else {
        state.filters.categories.push(action.payload)
      }
      state.pagination.page = 1
    },

    setAmountRange: (state, action: PayloadAction<{ min: number | null; max: number | null }>) => {
      state.filters.amountRange = action.payload
      state.pagination.page = 1
    },

    setFilterLogic: (state, action: PayloadAction<FilterLogic>) => {
      state.filters.logic = action.payload
      state.pagination.page = 1
    },

    setGrouping: (state, action: PayloadAction<GroupingPeriod>) => {
      state.grouping = action.payload
    },

    setPage: (state, action: PayloadAction<number>) => {
      // The store can't know `totalPages`, so `paginate` applies the upper bound.
      state.pagination.page = clampPage(action.payload, Number.POSITIVE_INFINITY)
    },

    setPageSize: (state, action: PayloadAction<PageSizeOption>) => {
      state.pagination.pageSize = action.payload
      state.pagination.page = 1
    },

    /** Resets the filters only — the user's grouping and page-size choices are preserved. */
    clearAllFilters: (state) => {
      state.filters = initialFiltersState
      state.pagination.page = 1
    },
  },
})

export const {
  setDateRangePreset,
  setCustomDateRange,
  toggleCategory,
  setAmountRange,
  setFilterLogic,
  setGrouping,
  setPage,
  setPageSize,
  clearAllFilters,
} = transactionsSlice.actions

export const transactionsReducer = transactionsSlice.reducer
