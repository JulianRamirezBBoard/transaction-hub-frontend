import { useId } from 'react'
import type { ReactNode } from 'react'

interface RadioPillGroupProps<T extends string> {
  /** Shared `name`, which is what makes these one group for the browser. */
  name: string
  /** Accessible name for the group. */
  label: string
  /** False when a parent `<fieldset>` + `<legend>` already groups and names these controls. */
  standalone?: boolean
  options: readonly T[]
  value: T | null
  onChange: (option: T) => void
  getLabel: (option: T) => ReactNode
  /** Used below the `sm` breakpoint, where the full label doesn't fit. */
  getShortLabel?: (option: T) => ReactNode
}

/**
 * Mutually exclusive options rendered as pill buttons. Real radio inputs with styled labels,
 * so keyboard navigation and screen-reader group semantics come for free.
 */
export function RadioPillGroup<T extends string>({
  name,
  label,
  standalone = true,
  options,
  value,
  onChange,
  getLabel,
  getShortLabel,
}: RadioPillGroupProps<T>) {
  // Prefix with a render-unique id so two groups that share a `name` never collide on `id`.
  const idPrefix = useId()
  const groupProps = standalone ? { role: 'group' as const, 'aria-label': label } : {}

  return (
    <div className="grid grid-cols-2 sm:flex sm:gap-2 gap-2" {...groupProps}>
      {options.map((option) => {
        const id = `${idPrefix}${name}-${option.toLowerCase()}`
        const isSelected = value === option

        return (
          <div key={option}>
            <input
              type="radio"
              // sr-only, not `hidden`: display:none would drop the radio out of the tab order.
              className="sr-only"
              id={id}
              name={name}
              value={option}
              checked={isSelected}
              onChange={() => onChange(option)}
            />
            <label
              htmlFor={id}
              className={`block px-3 sm:px-4 py-1.5 sm:py-2 rounded-md border text-xs sm:text-sm font-medium cursor-pointer transition-colors text-center ${
                isSelected
                  ? 'bg-primary-500 text-white border-primary-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {getShortLabel ? (
                <>
                  <span className="sm:hidden">{getShortLabel(option)}</span>
                  <span className="hidden sm:inline">{getLabel(option)}</span>
                </>
              ) : (
                getLabel(option)
              )}
            </label>
          </div>
        )
      })}
    </div>
  )
}
