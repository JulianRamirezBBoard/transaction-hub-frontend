import { useAppDispatch, useAppSelector } from '../../../app/hooks'
import { selectFilters } from '../selectors'
import { setDateRangePreset, setCustomDateRange } from '../transactionsSlice'
import { DATE_PRESETS, DATE_PRESET_LABELS, MOBILE_DATE_PRESET_LABELS } from '../types'
import { DebouncedInput } from '../../../components/DebouncedInput'
import { RadioPillGroup } from '../../../components/RadioPillGroup'

export function DateRangeFilter() {
  const dispatch = useAppDispatch()
  const { preset, startDate, endDate } = useAppSelector(selectFilters).dateRange

  return (
    <fieldset className="border border-gray-300 rounded-lg p-4">
      <legend className="px-2 text-sm font-semibold text-gray-900">Date Range</legend>

      <div className="mb-4">
        <RadioPillGroup
          name="datePreset"
          label="Date range presets"
          options={DATE_PRESETS}
          value={preset}
          onChange={(value) => dispatch(setDateRangePreset(value))}
          getLabel={(value) => DATE_PRESET_LABELS[value]}
          getShortLabel={(value) => MOBILE_DATE_PRESET_LABELS[value]}
        />
      </div>

      {preset === 'custom' && (
        <div className="grid grid-cols-2 gap-3 mb-3">
          <DebouncedInput
            id="start-date"
            label="Start Date"
            type="date"
            describedBy="date-range-desc"
            value={startDate}
            onCommit={(value) => dispatch(setCustomDateRange({ startDate: value, endDate }))}
          />
          <DebouncedInput
            id="end-date"
            label="End Date"
            type="date"
            describedBy="date-range-desc"
            value={endDate}
            onCommit={(value) => dispatch(setCustomDateRange({ startDate, endDate: value }))}
          />
        </div>
      )}

      <small id="date-range-desc" className="text-sm text-gray-600">
        Filter transactions by date
      </small>
    </fieldset>
  )
}
