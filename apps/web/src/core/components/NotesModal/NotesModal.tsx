'use client';

import React from 'react';
import type { NotesModalProps } from './types';
import { NotesModalLayout } from './shared/NotesModalLayout';
import { exportNotePdfWithCanvas } from './shared/notes-pdf-html2canvas.service';
import { useNotesEditorState } from './shared/useNotesEditorState';

export function NotesModal(props: NotesModalProps) {
  const editor = useNotesEditorState(props);

  return (
    <NotesModalLayout
      editor={editor}
      isEditing={Boolean(props.isEditing)}
      isOpen={props.isOpen}
      onClose={props.onClose}
      onExportPdf={() =>
        exportNotePdfWithCanvas({
          content: editor.content,
          tags: editor.tags,
          title: editor.title,
        })
      }
      onDelete={() => props.onDelete && props.initialNote?.id ? props.onDelete(props.initialNote.id) : undefined}
      variant="native"
    />
  );
}
