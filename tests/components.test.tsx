import { act, fireEvent, screen, within } from '@testing-library/react'
import { CategoryFilter } from '../src/features/transactions/components/CategoryFilter'
import { PaginationControls } from '../src/features/transactions/components/PaginationControls'
import { AmountFilter } from '../src/features/transactions/components/AmountFilter'
import { GroupingToggle } from '../src/features/transactions/components/GroupingToggle'
import { FilterLogicToggle } from '../src/features/transactions/components/FilterLogicToggle'
import { FilterPanel } from '../src/features/transactions/components/FilterPanel'
import { ClearFiltersButton } from '../src/features/transactions/components/ClearFiltersButton'
import { EmptyState } from '../src/features/transactions/components/EmptyState'
import { DebouncedInput } from '../src/components/DebouncedInput'
import { ErrorBoundary } from '../src/components/ErrorBoundary'
import { ErrorFallback } from '../src/components/ErrorFallback'
import { renderWithStore } from './renderWithStore'
import { makeState } from './helpers'

describe('CategoryFilter', () => {
  it('opens and closes the panel from the toggle', async () => {
    const { user } = renderWithStore(<CategoryFilter />)
    const toggle = screen.getByRole('button', { expanded: false })

    // aria-controls only points at the panel while the panel exists in the DOM.
    expect(toggle).not.toHaveAttribute('aria-controls')

    await user.click(toggle)
    expect(screen.getByRole('group', { name: 'Category options' })).toBeInTheDocument()
    expect(toggle).toHaveAttribute('aria-controls', 'category-filter-panel')

    await user.click(toggle)
    expect(screen.queryByRole('group', { name: 'Category options' })).not.toBeInTheDocument()
    expect(toggle).not.toHaveAttribute('aria-controls')
  })

  it('closes on Escape and returns focus to the toggle', async () => {
    const { user } = renderWithStore(<CategoryFilter />)
    const toggle = screen.getByRole('button', { expanded: false })

    await user.click(toggle)
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('group', { name: 'Category options' })).not.toBeInTheDocument()
    expect(toggle).toHaveFocus()
  })

  it('closes when pointing outside the dropdown', async () => {
    const { user } = renderWithStore(
      <div>
        <CategoryFilter />
        <button type="button">outside</button>
      </div>,
    )

    await user.click(screen.getByRole('button', { expanded: false }))
    expect(screen.getByRole('group', { name: 'Category options' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'outside' }))
    expect(screen.queryByRole('group', { name: 'Category options' })).not.toBeInTheDocument()
  })

  it('records the selected categories in the store', async () => {
    const { user, store } = renderWithStore(<CategoryFilter />)

    await user.click(screen.getByRole('button', { expanded: false }))
    const panel = screen.getByRole('group', { name: 'Category options' })
    await user.click(within(panel).getByRole('checkbox', { name: 'Groceries' }))

    expect(store.getState().transactions.filters.categories).toEqual(['Groceries'])
  })
})

describe('PaginationControls', () => {
  const renderControls = (page: number, totalPages = 4) =>
    renderWithStore(
      <PaginationControls page={page} totalPages={totalPages} totalItems={100} />,
      makeState({ pagination: { page, pageSize: 25 } }),
    )

  it('lets the page field be cleared while editing', async () => {
    const { user } = renderControls(2)
    const input = screen.getByLabelText('Current page number')

    await user.clear(input)

    expect(input).toHaveValue(null)
  })

  it('commits a page number that is in range', () => {
    jest.useFakeTimers()
    try {
      const { store } = renderControls(2)
      const input = screen.getByLabelText('Current page number')

      act(() => {
        fireEvent.change(input, { target: { value: '3' } })
      })
      act(() => {
        jest.runAllTimers()
      })

      expect(store.getState().transactions.pagination.page).toBe(3)
    } finally {
      jest.useRealTimers()
    }
  })

  it('commits a multi-digit page once, not once per keystroke', () => {
    jest.useFakeTimers()
    try {
      const { store } = renderControls(2, 20)
      const input = screen.getByLabelText('Current page number')

      // Typing "12" one character at a time. Page 1 is itself valid, so without debouncing
      // the intermediate keystroke would commit and fire a query for the wrong page.
      for (const value of ['1', '12']) {
        act(() => {
          fireEvent.change(input, { target: { value } })
        })
      }
      expect(store.getState().transactions.pagination.page).toBe(2)

      act(() => {
        jest.runAllTimers()
      })
      expect(store.getState().transactions.pagination.page).toBe(12)
    } finally {
      jest.useRealTimers()
    }
  })

  it('ignores a page number beyond the last page', () => {
    jest.useFakeTimers()
    try {
      const { store } = renderControls(2)
      const input = screen.getByLabelText('Current page number')

      act(() => {
        fireEvent.change(input, { target: { value: '9' } })
      })
      act(() => {
        jest.runAllTimers()
      })

      expect(store.getState().transactions.pagination.page).toBe(2)
    } finally {
      jest.useRealTimers()
    }
  })

  it('disables Next when the page is at or past the last page', () => {
    renderControls(5, 4)
    expect(screen.getByRole('button', { name: 'Go to next page' })).toBeDisabled()
  })

  it('disables Previous on the first page', () => {
    renderControls(1)
    expect(screen.getByRole('button', { name: 'Go to previous page' })).toBeDisabled()
  })

  it('steps to the next page when Next is clicked', async () => {
    const { user, store } = renderControls(2)

    await user.click(screen.getByRole('button', { name: 'Go to next page' }))

    expect(store.getState().transactions.pagination.page).toBe(3)
  })

  it('steps to the previous page when Previous is clicked', async () => {
    const { user, store } = renderControls(3)

    await user.click(screen.getByRole('button', { name: 'Go to previous page' }))

    expect(store.getState().transactions.pagination.page).toBe(2)
  })

  it('records a new page size and returns to page 1', async () => {
    const { user, store } = renderControls(3)

    await user.selectOptions(screen.getByLabelText('Rows per page:'), '50')

    expect(store.getState().transactions.pagination.pageSize).toBe(50)
    expect(store.getState().transactions.pagination.page).toBe(1)
  })
})

describe('AmountFilter', () => {
  it('dispatches once after typing settles rather than per keystroke', () => {
    jest.useFakeTimers()
    try {
      const { store } = renderWithStore(<AmountFilter />)
      const input = screen.getByLabelText('Min')

      // Four keystrokes, as if typing "1500" one character at a time.
      for (const value of ['1', '15', '150', '1500']) {
        act(() => {
          fireEvent.change(input, { target: { value } })
        })
      }

      // Nothing is committed while the user is still typing.
      expect(store.getState().transactions.filters.amountRange.min).toBeNull()

      act(() => {
        jest.runAllTimers()
      })
      expect(store.getState().transactions.filters.amountRange.min).toBe(1500)
    } finally {
      jest.useRealTimers()
    }
  })

  it('reflects a value set elsewhere in the app', () => {
    const { store } = renderWithStore(
      <AmountFilter />,
      makeState({
        filters: {
          logic: 'AND',
          dateRange: { preset: null, startDate: null, endDate: null },
          categories: [],
          amountRange: { min: -100, max: null },
        },
      }),
    )

    expect(screen.getByLabelText('Min')).toHaveValue(-100)
    expect(store.getState().transactions.filters.amountRange.min).toBe(-100)
  })

  it('clears the stored bound when the field is emptied', () => {
    jest.useFakeTimers()
    try {
      const { store } = renderWithStore(
        <AmountFilter />,
        makeState({
          filters: {
            logic: 'AND',
            dateRange: { preset: null, startDate: null, endDate: null },
            categories: [],
            amountRange: { min: -100, max: null },
          },
        }),
      )

      act(() => {
        fireEvent.change(screen.getByLabelText('Min'), { target: { value: '' } })
      })
      act(() => {
        jest.runAllTimers()
      })

      expect(store.getState().transactions.filters.amountRange.min).toBeNull()
    } finally {
      jest.useRealTimers()
    }
  })
})

describe('GroupingToggle', () => {
  it('exposes both periods as reachable radios', () => {
    renderWithStore(<GroupingToggle />)

    // `sr-only` rather than `hidden`: both must stay in the accessibility tree and the tab order.
    expect(screen.getByRole('radio', { name: 'Monthly' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Weekly' })).not.toBeChecked()
    expect(screen.getAllByRole('radio')).toHaveLength(2)
  })

  it('records the selected period in the store', async () => {
    const { user, store } = renderWithStore(<GroupingToggle />)

    await user.click(screen.getByRole('radio', { name: 'Weekly' }))

    expect(store.getState().transactions.grouping).toBe('weekly')
  })
})

describe('RadioPillGroup', () => {
  it('names the group and marks only the selected option as checked', async () => {
    const { user, store } = renderWithStore(<FilterLogicToggle />)

    // The parent <fieldset> + <legend> is the single group; RadioPillGroup no longer adds its own.
    const group = screen.getByRole('group', { name: 'Filter Logic' })
    expect(within(group).getAllByRole('radio')).toHaveLength(2)
    expect(within(group).getByRole('radio', { name: /AND/ })).toBeChecked()

    await user.click(within(group).getByRole('radio', { name: /OR/ }))

    expect(store.getState().transactions.filters.logic).toBe('OR')
    expect(within(group).getByRole('radio', { name: /OR/ })).toBeChecked()
    expect(within(group).getByRole('radio', { name: /AND/ })).not.toBeChecked()
  })
})

describe('FilterPanel', () => {
  it('does not navigate when Enter is pressed in a field', () => {
    renderWithStore(<FilterPanel />)
    const form = screen.getByRole('form', { name: 'Transaction filters' })

    const submitEvent = new Event('submit', { bubbles: true, cancelable: true })
    form.dispatchEvent(submitEvent)

    expect(submitEvent.defaultPrevented).toBe(true)
  })

  const clearButton = () => screen.queryByRole('button', { name: /clear all filters/i })

  it('hides the Clear control when nothing narrows the results', () => {
    renderWithStore(<FilterPanel />)
    expect(clearButton()).not.toBeInTheDocument()
  })

  it('still hides the Clear control for the "Custom" preset with no dates set', () => {
    renderWithStore(
      <FilterPanel />,
      makeState({
        filters: {
          logic: 'AND',
          dateRange: { preset: 'custom', startDate: null, endDate: null },
          categories: [],
          amountRange: { min: null, max: null },
        },
      }),
    )
    expect(clearButton()).not.toBeInTheDocument()
  })

  it('shows the Clear control once a real filter is active', () => {
    renderWithStore(
      <FilterPanel />,
      makeState({
        filters: {
          logic: 'AND',
          dateRange: { preset: 'custom', startDate: '2026-07-01', endDate: null },
          categories: [],
          amountRange: { min: null, max: null },
        },
      }),
    )
    expect(clearButton()).toBeInTheDocument()
  })
})

describe('ErrorBoundary', () => {
  function Boom(): never {
    throw new Error('kaboom')
  }

  it('renders the fallback instead of blanking the subtree, and can recover', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
    let shouldThrow = true

    function Subject() {
      if (shouldThrow) {
        return <Boom />
      }
      return <p>recovered</p>
    }

    const { user } = renderWithStore(
      <ErrorBoundary
        fallback={(error, reset) => (
          <div>
            <p>{error.message}</p>
            <button type="button" onClick={reset}>
              Try again
            </button>
          </div>
        )}
      >
        <Subject />
      </ErrorBoundary>,
    )

    expect(screen.getByText('kaboom')).toBeInTheDocument()

    shouldThrow = false
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(screen.getByText('recovered')).toBeInTheDocument()

    consoleError.mockRestore()
  })
})

describe('DebouncedInput', () => {
  it('shows a value changed elsewhere without waiting for the debounce', () => {
    const onCommit = jest.fn()
    const { rerender } = renderWithStore(
      <DebouncedInput id="x" label="Amount" type="number" value="10" onCommit={onCommit} />,
    )

    expect(screen.getByLabelText('Amount')).toHaveValue(10)

    rerender(<DebouncedInput id="x" label="Amount" type="number" value="99" onCommit={onCommit} />)

    expect(screen.getByLabelText('Amount')).toHaveValue(99)
    // An external sync must not echo back as a commit.
    expect(onCommit).not.toHaveBeenCalled()
  })

  it('commits null once the field is cleared and typing settles', () => {
    jest.useFakeTimers()
    try {
      const onCommit = jest.fn()
      renderWithStore(
        <DebouncedInput id="x" label="Amount" type="number" value="10" onCommit={onCommit} />,
      )

      act(() => {
        fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '' } })
      })
      act(() => {
        jest.runAllTimers()
      })

      expect(onCommit).toHaveBeenCalledWith(null)
    } finally {
      jest.useRealTimers()
    }
  })
})

describe('ClearFiltersButton', () => {
  it('resets every filter dimension in the store', async () => {
    const { user, store } = renderWithStore(
      <ClearFiltersButton />,
      makeState({
        filters: {
          logic: 'OR',
          dateRange: { preset: 'custom', startDate: '2026-07-01', endDate: '2026-07-31' },
          categories: ['Groceries'],
          amountRange: { min: -100, max: null },
        },
      }),
    )

    await user.click(screen.getByRole('button', { name: /clear all filters/i }))

    expect(store.getState().transactions.filters).toEqual(makeState().filters)
  })
})

describe('EmptyState', () => {
  it('tells the user nothing matched and offers to clear the filters', () => {
    renderWithStore(<EmptyState />)

    expect(screen.getByText('No transactions found')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /clear all filters/i })).toBeInTheDocument()
  })
})

describe('ErrorFallback', () => {
  it('announces itself, takes focus, and shows the detail when there is one', () => {
    renderWithStore(
      <ErrorFallback
        title="Could not load transactions."
        detail="Server exploded"
        onRetry={() => {}}
      />,
    )

    const alert = screen.getByRole('alert')
    expect(alert).toHaveFocus()
    expect(within(alert).getByText(/Server exploded/)).toBeInTheDocument()
  })

  it('hides the detail line when the detail is null', () => {
    renderWithStore(
      <ErrorFallback title="Could not load transactions." detail={null} onRetry={() => {}} />,
    )

    expect(screen.queryByText(/Details:/)).not.toBeInTheDocument()
  })

  it('calls onRetry when the button is clicked', async () => {
    const onRetry = jest.fn()
    const { user } = renderWithStore(
      <ErrorFallback title="Could not load transactions." detail={null} onRetry={onRetry} />,
    )

    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
