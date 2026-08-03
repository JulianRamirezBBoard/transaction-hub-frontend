import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react'

/** `fakeBaseQuery` because every endpoint supplies its own `queryFn`; there is no server yet. */
export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fakeBaseQuery(),
  endpoints: () => ({}),
})
