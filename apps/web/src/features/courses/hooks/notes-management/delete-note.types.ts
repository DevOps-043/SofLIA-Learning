import type { Dispatch, SetStateAction } from "react";

import type {
  LearnEditableNote,
  LearnLesson,
  LearnSavedNote,
} from "../../components/learn/types";
import type { NotesStatsOperation } from "./types";

export type UseDeleteNoteActionParams = {
  slug: string;
  currentLesson: LearnLesson | null;
  editingNote: LearnEditableNote | null;
  noteToDelete: LearnSavedNote | null;
  savedNotes: LearnSavedNote[];
  closeDeleteNoteConfirm: () => void;
  closeNotesModal: () => void;
  loadCourseNotes: (courseSlug: string) => Promise<void>;
  loadNotesStats: (courseSlug: string) => Promise<void>;
  removeNoteFromLocalState: (noteId: string) => void;
  setIsDeleteNoteConfirmOpen: Dispatch<SetStateAction<boolean>>;
  setIsDeletingNote: Dispatch<SetStateAction<boolean>>;
  setNoteError: Dispatch<SetStateAction<string | null>>;
  setNoteToDelete: Dispatch<SetStateAction<LearnSavedNote | null>>;
  updateNotesStatsOptimized: (
    operation: NotesStatsOperation,
    lessonId?: string
  ) => Promise<void>;
};
