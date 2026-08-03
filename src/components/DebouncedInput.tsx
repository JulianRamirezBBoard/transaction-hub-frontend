import { useState } from 'react'
import { useDebouncedCallback } from '../hooks/useDebouncedCallback'

interface DebouncedInputProps {
  id: string
  label: string
  type: 'number' | 'date'
  /** Committed value from the store. `null` renders as empty. */
  value: string | null
  /** Called once the user stops typing, with `null` for an empty field. */
  onCommit: (value: string | null) => void
  delayMs?: number
  placeholder?: string
  describedBy?: string
  step?: string
}

const DEFAULT_DELAY_MS = 300

/**
 * A labelled input that holds its own draft and reports upward only once the user pauses,
 * while still picking up changes made elsewhere (such as "Clear All Filters") immediately.
 */
export function DebouncedInput({
  id,
  label,
  type,
  value,
  onCommit,
  delayMs = DEFAULT_DELAY_MS,
  placeholder,
  describedBy,
  step,
}: DebouncedInputProps) {
  const [draft, setDraft] = useState(value ?? '')
  const [syncedValue, setSyncedValue] = useState(value)

  if (value !== syncedValue) {
    setSyncedValue(value)
    setDraft(value ?? '')
  }

  const commit = useDebouncedCallback(onCommit, delayMs)

  const handleChange = (next: string) => {
    setDraft(next)
    commit(next === '' ? null : next)
  }

  return (
    <div>
      <label htmlFor={id} className="form-label">
        {label}
      </label>
      <input
        id={id}
        type={type}
        className="form-input"
        value={draft}
        placeholder={placeholder}
        step={step}
        aria-describedby={describedBy}
        onChange={(e) => handleChange(e.target.value)}
      />
    </div>
  )
}
