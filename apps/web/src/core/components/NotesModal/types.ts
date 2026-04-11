export interface NoteDraft {
  content: string;
  tags: string[];
  title: string;
}

export interface ExistingNote extends NoteDraft {
  id: string;
  lessonId?: string;
}

export interface NotesModalProps {
  initialNote?: ExistingNote | null;
  isEditing?: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: NoteDraft) => boolean | Promise<boolean>;
  onDelete?: (id: string) => void | Promise<void>;
}
