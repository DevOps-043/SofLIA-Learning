export interface NotesHistoryState {
  canRedo: boolean
  canUndo: boolean
  history: string[]
  index: number
}

export function createNotesHistoryState(initialContent = ''): NotesHistoryState {
  return {
    canRedo: false,
    canUndo: false,
    history: [initialContent],
    index: 0,
  }
}

export function pushNotesHistoryEntry(
  historyState: NotesHistoryState,
  content: string,
  maxEntries = 50,
): NotesHistoryState {
  const currentValue = historyState.history[historyState.index] ?? ''

  if (content === currentValue) {
    return historyState
  }

  const nextHistory = historyState.history
    .slice(0, historyState.index + 1)
    .concat(content)
  const trimmedHistory = nextHistory.length > maxEntries
    ? nextHistory.slice(nextHistory.length - maxEntries)
    : nextHistory
  const nextIndex = trimmedHistory.length - 1

  return {
    canRedo: false,
    canUndo: nextIndex > 0,
    history: trimmedHistory,
    index: nextIndex,
  }
}

export function stepNotesHistory(
  historyState: NotesHistoryState,
  direction: 'redo' | 'undo',
): NotesHistoryState {
  const delta = direction === 'undo' ? -1 : 1
  const nextIndex = historyState.index + delta

  if (nextIndex < 0 || nextIndex >= historyState.history.length) {
    return historyState
  }

  return {
    canRedo: nextIndex < historyState.history.length - 1,
    canUndo: nextIndex > 0,
    history: historyState.history,
    index: nextIndex,
  }
}
