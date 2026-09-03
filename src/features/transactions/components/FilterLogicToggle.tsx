import { useAppDispatch, useAppSelector } from '../../../app/hooks'
import { selectFilters } from '../selectors'
import { setFilterLogic } from '../transactionsSlice'
import { FILTER_LOGIC_OPTIONS, FILTER_LOGIC_LABELS } from '../types'
import { RadioPillGroup } from '../../../components/RadioPillGroup'

export function FilterLogicToggle() {
  const dispatch = useAppDispatch()
  const filters = useAppSelector(selectFilters)

  return (
    <fieldset className="border border-gray-300 rounded-lg p-4">
      <legend className="px-2 text-sm font-semibold text-gray-900">Filter Logic</legend>

      <RadioPillGroup
        name="filterLogic"
        label="Filter logic"
        standalone={false}
        options={FILTER_LOGIC_OPTIONS}
        value={filters.logic}
        onChange={(option) => dispatch(setFilterLogic(option))}
        getLabel={(option) => FILTER_LOGIC_LABELS[option]}
        getShortLabel={(option) => option}
      />
    </fieldset>
  )
}
