import { act, fireEvent, screen } from '@testing-library/react'
import { DateRangeFilter } from '../src/features/transactions/components/DateRangeFilter'
import { renderWithStore } from './renderWithStore'
import { makeState } from './helpers'

const withPreset = (preset: 'custom' | null) =>
  makeState({
    filters: {
      logic: 'AND',
      dateRange: { preset, startDate: null, endDate: null },
      categories: [],
      amountRange: { min: null, max: null },
    },
  })

describe('DateRangeFilter', () => {
  it('hides the custom start and end inputs until the "Custom" preset is chosen', () => {
    renderWithStore(<DateRangeFilter />, withPreset(null))

    expect(screen.queryByLabelText('Start Date')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('End Date')).not.toBeInTheDocument()
  })

  it('shows the custom inputs once "Custom" is selected', async () => {
    const { user } = renderWithStore(<DateRangeFilter />, withPreset(null))

    await user.click(screen.getByRole('radio', { name: /Custom/ }))

    expect(screen.getByLabelText('Start Date')).toBeInTheDocument()
    expect(screen.getByLabelText('End Date')).toBeInTheDocument()
  })

  it('records the typed start date as a custom range bound', () => {
    jest.useFakeTimers()
    try {
      const { store } = renderWithStore(<DateRangeFilter />, withPreset('custom'))

      act(() => {
        fireEvent.change(screen.getByLabelText('Start Date'), { target: { value: '2026-07-01' } })
      })
      act(() => {
        jest.runAllTimers()
      })

      expect(store.getState().transactions.filters.dateRange).toEqual({
        preset: 'custom',
        startDate: '2026-07-01',
        endDate: null,
      })
    } finally {
      jest.useRealTimers()
    }
  })
})
