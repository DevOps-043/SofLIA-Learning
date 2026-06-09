import { describe, expect, it } from 'vitest';
import {
  addUniqueNoteTag,
  buildNotePdfFileName,
  buildNoteLinkHtml,
  createNotesHistoryState,
  escapeNoteLinkHtml,
  getNoteShortcutAction,
  hasNoteContent,
  normalizeNoteLinkUrl,
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

  it('ignores empty HTML markup when checking note content', () => {
    expect(hasNoteContent('<br>')).toBe(false);
    expect(hasNoteContent('<div><br></div>')).toBe(false);
    expect(hasNoteContent('<p>&nbsp;</p>')).toBe(false);
    expect(hasNoteContent('<ul><li></li></ul>')).toBe(false);
    expect(hasNoteContent('<div>hola</div>')).toBe(true);
    expect(hasNoteContent('<a href="https://x.com">enlace</a>')).toBe(true);
  });

  it('builds deterministic PDF file names from the note title', () => {
    expect(
      buildNotePdfFileName(
        'Mi Nota Final',
        new Date('2026-03-31T10:00:00.000Z')
      )
    ).toBe('mi_nota_final_2026-03-31.pdf');
  });

  it('normalizes note link URLs and rejects unsafe protocols', () => {
    expect(normalizeNoteLinkUrl('example.com/recurso')).toBe(
      'https://example.com/recurso'
    );
    expect(normalizeNoteLinkUrl('https://soflia.ai')).toBe('https://soflia.ai');
    expect(normalizeNoteLinkUrl('/courses/demo/learn')).toBe(
      '/courses/demo/learn'
    );
    expect(normalizeNoteLinkUrl('mailto:hola@soflia.ai')).toBe(
      'mailto:hola@soflia.ai'
    );
    expect(normalizeNoteLinkUrl('javascript:alert(1)')).toBeNull();
  });

  it('escapes link HTML before inserting it into the editor', () => {
    expect(escapeNoteLinkHtml('"Hola" & <script>')).toBe(
      '&quot;Hola&quot; &amp; &lt;script&gt;'
    );
    expect(buildNoteLinkHtml('https://example.com?a=1&b=2', 'Click aqui')).toBe(
      '<a href="https://example.com?a=1&amp;b=2" target="_blank" rel="noopener noreferrer">Click aqui</a>'
    );
  });
});
