import { describe, expect, it } from 'vitest';
import {
  addUniqueNoteTag,
  buildNotePdfFileName,
  createNotesHistoryState,
  getNoteShortcutAction,
  hasNoteContent,
  pushNotesHistoryEntry,
  removeNoteTag,
  stepNotesHistory,
} from '../shared/notes-modal.utils';

describe('notes-modal.utils', () => {
  it('adds unique tags and ignores blanks or duplicates', () => {
    expect(addUniqueNoteTag(['alpha'], ' beta ')).toEqual(['alpha', 'beta']);
    expect(addUniqueNoteTag(['alpha'], 'alpha')).toEqual(['alpha']);
    expect(addUniqueNoteTag(['alpha'], '   ')).toEqual(['alpha']);
  });

  it('removes an existing tag', () => {
    expect(removeNoteTag(['alpha', 'beta'], 'alpha')).toEqual(['beta']);
  });

  it('tracks history entries without duplicating consecutive values', () => {
    const initialState = createNotesHistoryState('uno');
    const nextState = pushNotesHistoryEntry(initialState, 'dos');
    const unchangedState = pushNotesHistoryEntry(nextState, 'dos');

    expect(nextState.history).toEqual(['uno', 'dos']);
    expect(nextState.index).toBe(1);
    expect(nextState.canUndo).toBe(true);
    expect(unchangedState).toBe(nextState);
  });

  it('moves backward and forward through note history', () => {
    const historyState = pushNotesHistoryEntry(
      pushNotesHistoryEntry(createNotesHistoryState('uno'), 'dos'),
      'tres'
    );

    const previousState = stepNotesHistory(historyState, 'undo');
    const restoredState = stepNotesHistory(previousState, 'redo');

    expect(previousState.index).toBe(1);
    expect(previousState.canRedo).toBe(true);
    expect(restoredState.index).toBe(2);
    expect(restoredState.canUndo).toBe(true);
  });

  it('maps keyboard shortcuts to note actions', () => {
    expect(getNoteShortcutAction({ ctrlKey: true, key: 's' })).toBe('save');
    expect(getNoteShortcutAction({ metaKey: true, key: 'z' })).toBe('undo');
    expect(getNoteShortcutAction({ ctrlKey: false, key: 's' })).toBeNull();
  });

  it('checks whether a note has meaningful content', () => {
    expect(hasNoteContent(' hola ')).toBe(true);
    expect(hasNoteContent('   ')).toBe(false);
  });

  it('builds deterministic PDF file names from the note title', () => {
    expect(
      buildNotePdfFileName(
        'Mi Nota Final',
        new Date('2026-03-31T10:00:00.000Z')
      )
    ).toBe('mi_nota_final_2026-03-31.pdf');
  });
});
