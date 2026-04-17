export const NOTES_EDITOR_STYLE_ID = 'notes-editor-styles';

export const NOTES_EDITOR_STYLE_CONTENT = `
  .notes-editor h1 {
    font-size: 2rem;
    font-weight: 700;
    margin: 0.5rem 0;
    color: inherit;
  }
  .notes-editor h2 {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0.875rem 0 0.5rem 0;
    color: inherit;
  }
  .notes-editor h3 {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0.75rem 0 0.5rem 0;
    color: inherit;
  }
  .notes-editor p {
    margin: 0.5rem 0;
  }
  .notes-editor ul,
  .notes-editor ol {
    margin: 0.5rem 0;
    padding-left: 1.5rem;
  }
  .notes-editor strong {
    font-weight: 700;
  }
  .notes-editor em {
    font-style: italic;
  }
  .notes-editor u {
    text-decoration: underline;
  }
  .notes-editor a {
    color: var(--color-primary);
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  .dark .notes-editor a {
    color: var(--color-accent);
  }
  .notes-editor a:hover {
    opacity: 0.85;
  }
`;

export type NoteShortcutAction =
  | 'bold'
  | 'italic'
  | 'redo'
  | 'save'
  | 'underline'
  | 'undo'
  | null;

export interface NotesHistoryState {
  canRedo: boolean;
  canUndo: boolean;
  history: string[];
  index: number;
}

export function createNotesHistoryState(initialContent = ''): NotesHistoryState {
  return {
    canRedo: false,
    canUndo: false,
    history: [initialContent],
    index: 0,
  };
}

export function pushNotesHistoryEntry(
  historyState: NotesHistoryState,
  content: string,
  maxEntries = 50
): NotesHistoryState {
  const currentValue = historyState.history[historyState.index] ?? '';

  if (content === currentValue) {
    return historyState;
  }

  const nextHistory = historyState.history
    .slice(0, historyState.index + 1)
    .concat(content);
  const trimmedHistory =
    nextHistory.length > maxEntries
      ? nextHistory.slice(nextHistory.length - maxEntries)
      : nextHistory;
  const nextIndex = trimmedHistory.length - 1;

  return {
    canRedo: false,
    canUndo: nextIndex > 0,
    history: trimmedHistory,
    index: nextIndex,
  };
}

export function stepNotesHistory(
  historyState: NotesHistoryState,
  direction: 'redo' | 'undo'
): NotesHistoryState {
  const delta = direction === 'undo' ? -1 : 1;
  const nextIndex = historyState.index + delta;

  if (nextIndex < 0 || nextIndex >= historyState.history.length) {
    return historyState;
  }

  return {
    canRedo: nextIndex < historyState.history.length - 1,
    canUndo: nextIndex > 0,
    history: historyState.history,
    index: nextIndex,
  };
}

export function addUniqueNoteTag(tags: string[], rawTag: string): string[] {
  const normalizedTag = rawTag.trim();

  if (!normalizedTag || tags.includes(normalizedTag)) {
    return tags;
  }

  return [...tags, normalizedTag];
}

export function removeNoteTag(tags: string[], tagToRemove: string): string[] {
  return tags.filter((tag) => tag !== tagToRemove);
}

export function hasNoteContent(content: string): boolean {
  return content.trim().length > 0;
}

export function getNoteShortcutAction(event: {
  ctrlKey?: boolean;
  key: string;
  metaKey?: boolean;
}): NoteShortcutAction {
  if (!event.ctrlKey && !event.metaKey) {
    return null;
  }

  switch (event.key.toLowerCase()) {
    case 'b':
      return 'bold';
    case 'i':
      return 'italic';
    case 's':
      return 'save';
    case 'u':
      return 'underline';
    case 'y':
      return 'redo';
    case 'z':
      return 'undo';
    default:
      return null;
  }
}

export function buildNotePdfFileName(
  title: string,
  date = new Date(),
  suffix = 'pdf'
): string {
  const sanitizedTitle = (title || 'nota')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, '_')
    .replace(/^_+|_+$/g, '');
  const datePart = date.toISOString().split('T')[0];

  return `${sanitizedTitle || 'nota'}_${datePart}.${suffix}`;
}

export function normalizeNoteLinkUrl(rawUrl: string): string | null {
  const trimmedUrl = rawUrl.trim();

  if (!trimmedUrl) {
    return null;
  }

  if (trimmedUrl.startsWith('#') || /^\/(?!\/)/.test(trimmedUrl)) {
    return trimmedUrl;
  }

  if (/^\/\//.test(trimmedUrl)) {
    return `https:${trimmedUrl}`;
  }

  if (/^(mailto:|tel:)/i.test(trimmedUrl)) {
    return trimmedUrl;
  }

  if (/^https?:\/\//i.test(trimmedUrl)) {
    return trimmedUrl;
  }

  if (/^[^\s@]+\.[^\s@]{2,}(?:[/?#].*)?$/i.test(trimmedUrl)) {
    return `https://${trimmedUrl}`;
  }

  return null;
}

export function escapeNoteLinkHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildNoteLinkHtml(url: string, text = url): string {
  const escapedUrl = escapeNoteLinkHtml(url);
  const escapedText = escapeNoteLinkHtml(text);

  return `<a href="${escapedUrl}" target="_blank" rel="noopener noreferrer">${escapedText}</a>`;
}
