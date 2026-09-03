import { useState } from 'react'
import { useDebouncedCallback } from './useDebouncedCallback'

interface DebouncedDraftOptions<TExternal, TDraft> {
  delayMs: number
  /** The draft value to show whenever the external value changes on its own. */
  toDraft: (value: TExternal) => TDraft
}

/**
 * Holds a local draft that the user edits freely, commits it upward once typing pauses, and
 * re-syncs when the external value changes elsewhere (such as "Clear All Filters").
 *
 * `setDraft` updates the draft and schedules a commit. `resetDraft` snaps the draft back to
 * `toDraft(externalValue)` without scheduling a commit, so a caller can drop an in-progress
 * edit without cancelling a commit that is already pending.
 */
export const useDebouncedDraft = <TExternal, TDraft>(
  externalValue: TExternal,
  onCommit: (draft: TDraft) => void,
  { delayMs, toDraft }: DebouncedDraftOptions<TExternal, TDraft>,
): {
  draft: TDraft
  setDraft: (next: TDraft) => void
  resetDraft: () => void
} => {
  const [draft, setDraftState] = useState<TDraft>(() => toDraft(externalValue))
  const [syncedValue, setSyncedValue] = useState<TExternal>(externalValue)

  if (externalValue !== syncedValue) {
    setSyncedValue(externalValue)
    setDraftState(toDraft(externalValue))
  }

  const commit = useDebouncedCallback(onCommit, delayMs)

  const setDraft = (next: TDraft) => {
    setDraftState(next)
    commit(next)
  }

  const resetDraft = () => {
    setDraftState(toDraft(externalValue))
  }

  return { draft, setDraft, resetDraft }
}
