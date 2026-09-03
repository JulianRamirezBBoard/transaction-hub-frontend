import { useDebouncedDraft } from '../hooks/useDebouncedDraft'

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
  const { draft, setDraft } = useDebouncedDraft<string | null, string>(
    value,
    (next) => onCommit(next === '' ? null : next),
    { delayMs, toDraft: (external) => external ?? '' },
  )

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
        onChange={(e) => setDraft(e.target.value)}
      />
    </div>
  )
}
