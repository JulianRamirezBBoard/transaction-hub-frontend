import { useEffect, useRef, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../../app/hooks'
import { selectFilters } from '../selectors'
import { toggleCategory } from '../transactionsSlice'
import { TRANSACTION_CATEGORIES } from '../types'

const PANEL_ID = 'category-filter-panel'

export function CategoryFilter() {
  const dispatch = useAppDispatch()
  const { categories } = useAppSelector(selectFilters)
  const [isOpen, setIsOpen] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)

  // Escape restores focus to the toggle, so keyboard users aren't stranded at the document end.
  useEffect(() => {
    if (!isOpen) return

    const closeAndRestoreFocus = () => {
      setIsOpen(false)
      toggleRef.current?.focus()
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        closeAndRestoreFocus()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const summary = categories.length === 0 ? 'All categories' : `${categories.length} selected`

  return (
    <fieldset className="border border-gray-300 rounded-lg p-4">
      <legend className="px-2 text-sm font-semibold text-gray-900">Category</legend>

      <div className="relative" ref={containerRef}>
        <button
          ref={toggleRef}
          className="w-full px-4 py-2 text-left rounded-md border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-0"
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          aria-controls={PANEL_ID}
          aria-label={`Select transaction categories, ${summary}`}
        >
          {summary}
        </button>

        {isOpen && (
          <div
            id={PANEL_ID}
            className="absolute top-full left-0 right-0 mt-2 w-full bg-white border border-gray-300 rounded-md shadow-lg z-10"
            role="group"
            aria-label="Category options"
          >
            <ul className="max-h-48 overflow-y-auto">
              {TRANSACTION_CATEGORIES.map((category) => (
                <li key={category} className="border-b border-gray-100 last:border-b-0">
                  <label className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={categories.includes(category)}
                      onChange={() => dispatch(toggleCategory(category))}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <span className="text-gray-700 text-sm">{category}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </fieldset>
  )
}
