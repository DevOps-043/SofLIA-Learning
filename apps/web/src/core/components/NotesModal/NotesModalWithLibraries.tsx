'use client';

import React, { useState } from 'react';
import type { NotesModalProps } from './types';
import { NotesModalLayout } from './shared/NotesModalLayout';
import { exportNotePdfWithJsPdf } from './shared/notes-pdf-jspdf.service';
import { useNotesEditorState } from './shared/useNotesEditorState';

export function NotesModalWithLibraries(props: NotesModalProps) {
  const editor = useNotesEditorState(props);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const handleExportPdf = async () => {
    try {
      setPdfError(null);
      await exportNotePdfWithJsPdf({
        content: editor.content,
        tags: editor.tags,
        title: editor.title,
      });
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : 'Error al exportar PDF');
    }
  };

  return (
    <>
      {pdfError && (
        <div className="fixed bottom-4 left-1/2 z-[9999] -translate-x-1/2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {pdfError}
        </div>
      )}
      <NotesModalLayout
        editor={editor}
        isEditing={Boolean(props.isEditing)}
        isOpen={props.isOpen}
        onClose={props.onClose}
        onExportPdf={handleExportPdf}
        onDelete={() => props.onDelete && props.initialNote?.id ? props.onDelete(props.initialNote.id) : undefined}
        variant="libraries"
      />
    </>
  );
}
