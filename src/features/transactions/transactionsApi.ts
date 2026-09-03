import { apiSlice } from '../api/apiSlice'
import type { TransactionsQueryArgs, TransactionsQueryResult } from './types'
import { MOCK_TRANSACTIONS } from './mockData'
import {
  resolveFilters,
  applyFilters,
  groupTransactions,
  flattenGroups,
  paginate,
  buildPageGroups,
} from './logic'

const MOCK_NETWORK_DELAY_MS = 250

/**
 * Stands in for a server-side endpoint: filtering, grouping and pagination all happen here,
 * so the cache holds one page. A real backend replaces the `queryFn` body.
 */
export const transactionsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTransactions: builder.query<TransactionsQueryResult, TransactionsQueryArgs>({
      queryFn: async (args) => {
        try {
          await new Promise((resolve) => setTimeout(resolve, MOCK_NETWORK_DELAY_MS))

          // Relative presets resolve against the clock at query time, not at dispatch time.
          const filters = resolveFilters(args.filters, new Date())

          const filtered = applyFilters(MOCK_TRANSACTIONS, filters)
          const groups = groupTransactions(filtered, args.grouping)
          const flatRows = flattenGroups(groups)
          const { items, page, totalPages } = paginate(flatRows, args.pagination)
          const pageGroups = buildPageGroups(groups, items)

          return {
            data: { pageGroups, totalItems: flatRows.length, totalPages, page },
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to load transactions'
          return { error: { status: 'CUSTOM_ERROR' as const, error: message } }
        }
      },
    }),
  }),
})

export const { useGetTransactionsQuery } = transactionsApi
