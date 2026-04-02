'use client';

import React from 'react';
import type { NotesModalProps } from './types';
import { NotesModalLayout } from './shared/NotesModalLayout';
import { exportNotePdfWithJsPdf } from './shared/notes-pdf-jspdf.service';
import { useNotesEditorState } from './shared/useNotesEditorState';

export function NotesModalWithLibraries(props: NotesModalProps) {
  const editor = useNotesEditorState(props);

  return (
    <NotesModalLayout
      editor={editor}
      isEditing={Boolean(props.isEditing)}
      isOpen={props.isOpen}
      onClose={props.onClose}
      onExportPdf={() =>
        exportNotePdfWithJsPdf({
          content: editor.content,
          tags: editor.tags,
          title: editor.title,
        })
      }
      variant="libraries"
    />
  );
}
