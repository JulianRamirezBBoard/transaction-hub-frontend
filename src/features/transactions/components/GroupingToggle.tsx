import { useAppDispatch, useAppSelector } from '../../../app/hooks'
import { selectGrouping } from '../selectors'
import { setGrouping } from '../transactionsSlice'
import { GROUPING_PERIOD_OPTIONS, GROUPING_PERIOD_LABELS } from '../types'
import { RadioPillGroup } from '../../../components/RadioPillGroup'

export function GroupingToggle() {
  const dispatch = useAppDispatch()
  const grouping = useAppSelector(selectGrouping)

  return (
    <fieldset className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 bg-white rounded-lg border border-gray-200 p-4">
      <legend className="sr-only">Grouping period</legend>
      <span
        aria-hidden="true"
        className="font-medium text-sm sm:text-base text-gray-700 whitespace-nowrap"
      >
        Group by:
      </span>
      <RadioPillGroup
        name="grouping"
        label="Group by"
        standalone={false}
        options={GROUPING_PERIOD_OPTIONS}
        value={grouping}
        onChange={(period) => dispatch(setGrouping(period))}
        getLabel={(period) => GROUPING_PERIOD_LABELS[period]}
      />
    </fieldset>
  )
}
