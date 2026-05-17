export interface PromptDraft {
  title: string;
  description: string;
  content: string;
  tags: string[];
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  use_cases: string[];
  tips: string[];
  category_id?: string;
}

export interface PromptPreviewPanelProps {
  draft: PromptDraft;
  onSave: (prompt: PromptDraft) => Promise<void>;
  onClose: () => void;
  onEdit?: (draft: PromptDraft) => void;
  isSaving?: boolean;
}

export interface PromptDraftEditorProps {
  draft: PromptDraft;
  isEditing: boolean;
  editedDraft: PromptDraft;
  onEditedDraftChange: (draft: PromptDraft) => void;
}
