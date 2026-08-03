import { paginate, clampPage } from '../src/features/transactions/logic'
import type {
  TransactionWithRunningTotal,
  PaginationState,
  PageSizeOption,
} from '../src/features/transactions/types'
import { PAGE_SIZE_OPTIONS } from '../src/features/transactions/types'
import { makeRow } from './helpers'

function createRows(count: number): TransactionWithRunningTotal[] {
  return Array.from({ length: count }, (_, i) =>
    makeRow({ id: `txn-${i + 1}`, runningTotal: -(50 * (i + 1)) }),
  )
}

describe('paginate', () => {
  it.each(PAGE_SIZE_OPTIONS)('slices correctly at pageSize %i', (pageSize: PageSizeOption) => {
    const items = createRows(240)
    const result = paginate(items, { page: 2, pageSize })

    expect(result.items).toHaveLength(pageSize)
    expect(result.items[0].id).toBe(`txn-${pageSize + 1}`)
    expect(result.totalPages).toBe(Math.ceil(240 / pageSize))
  })

  it('returns the last page with fewer items', () => {
    const result = paginate(createRows(25), { page: 3, pageSize: 10 })
    expect(result.items).toHaveLength(5)
    expect(result.items[0].id).toBe('txn-21')
  })

  it('clamps a page below 1 and reports the page actually served', () => {
    const result = paginate(createRows(25), { page: 0, pageSize: 10 })
    expect(result.page).toBe(1)
    expect(result.items[0].id).toBe('txn-1')
  })

  it('clamps a page beyond totalPages and reports the page actually served', () => {
    const result = paginate(createRows(25), { page: 10, pageSize: 10 })
    expect(result.page).toBe(3)
    expect(result.totalPages).toBe(3)
    expect(result.items).toHaveLength(5)
    expect(result.items[0].id).toBe('txn-21')
  })

  it('handles a pageSize larger than the item count', () => {
    const pagination: PaginationState = { page: 1, pageSize: 50 }
    const result = paginate(createRows(10), pagination)
    expect(result.items).toHaveLength(10)
    expect(result.totalPages).toBe(1)
  })

  it('reports at least one page when there are no items', () => {
    const result = paginate([], { page: 1, pageSize: 10 })
    expect(result.totalPages).toBe(1)
    expect(result.items).toHaveLength(0)
  })
})

describe('clampPage', () => {
  it.each([
    [5, 10, 5],
    [0, 10, 1],
    [-3, 10, 1],
    [11, 10, 10],
    [2.7, 10, 2],
    [Number.NaN, 10, 1],
    [1, 0, 1],
  ])('clampPage(%p, %p) === %p', (page, totalPages, expected) => {
    expect(clampPage(page, totalPages)).toBe(expected)
  })
})
