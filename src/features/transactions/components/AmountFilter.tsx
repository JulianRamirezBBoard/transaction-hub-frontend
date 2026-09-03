import { useAppDispatch, useAppSelector } from '../../../app/hooks'
import { selectFilters } from '../selectors'
import { setAmountRange } from '../transactionsSlice'
import { parseNumberOrNull } from '../format'
import { DebouncedInput } from '../../../components/DebouncedInput'

export function AmountFilter() {
  const dispatch = useAppDispatch()
  const { min, max } = useAppSelector(selectFilters).amountRange

  return (
    <fieldset className="border border-gray-300 rounded-lg p-4">
      <legend className="px-2 text-sm font-semibold text-gray-900">Amount Range</legend>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <DebouncedInput
          id="amount-min"
          label="Min"
          type="number"
          step="0.01"
          placeholder="0"
          describedBy="amount-range-desc"
          value={min === null ? null : String(min)}
          onCommit={(value) => dispatch(setAmountRange({ min: parseNumberOrNull(value), max }))}
        />
        <DebouncedInput
          id="amount-max"
          label="Max"
          type="number"
          step="0.01"
          placeholder="0"
          describedBy="amount-range-desc"
          value={max === null ? null : String(max)}
          onCommit={(value) => dispatch(setAmountRange({ min, max: parseNumberOrNull(value) }))}
        />
      </div>

      <small id="amount-range-desc" className="text-sm text-gray-600">
        Filter by transaction amount
      </small>
    </fieldset>
  )
}
