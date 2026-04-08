export interface NoteDraft {
  content: string;
  tags: string[];
  title: string;
}

export interface ExistingNote extends NoteDraft {
  id: string;
}

export interface NotesModalProps {
  initialNote?: ExistingNote | null;
  isEditing?: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: NoteDraft) => void | Promise<void>;
  onDelete?: (id: string) => void | Promise<void>;
}
