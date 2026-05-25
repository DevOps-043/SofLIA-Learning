export type NoteShortcutAction =
  | 'bold'
  | 'italic'
  | 'redo'
  | 'save'
  | 'underline'
  | 'undo'
  | null

export function getNoteShortcutAction(event: {
  ctrlKey?: boolean
  key: string
  metaKey?: boolean
}): NoteShortcutAction {
  if (!event.ctrlKey && !event.metaKey) {
    return null
  }

  switch (event.key.toLowerCase()) {
    case 'b':
      return 'bold'
    case 'i':
      return 'italic'
    case 's':
      return 'save'
    case 'u':
      return 'underline'
    case 'y':
      return 'redo'
    case 'z':
      return 'undo'
    default:
      return null
  }
}
