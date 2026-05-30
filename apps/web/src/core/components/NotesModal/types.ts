export interface NoteDraft {
  content: string;
  tags: string[];
  title: string;
}

export interface ExistingNote extends NoteDraft {
  id: string;
  lessonId?: string;
}

export interface PersistNoteOptions {
  /** Autoguardado de mejor esfuerzo: los fallos no deben interrumpir al usuario. */
  silent?: boolean;
}

export interface NotesModalProps {
  initialNote?: ExistingNote | null;
  isEditing?: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: NoteDraft) => boolean | Promise<boolean>;
  /**
   * Persiste la nota (crear/actualizar) SIN cerrar el modal y devuelve el id
   * guardado. Habilita el autoguardado continuo y al cerrar. Si se omite, el
   * modal usa `onSave` como respaldo (sin autoguardado).
   */
  onPersist?: (
    note: NoteDraft,
    noteId: string,
    options?: PersistNoteOptions
  ) => Promise<string | null>;
  onDelete?: (id: string) => void | Promise<void>;
}
