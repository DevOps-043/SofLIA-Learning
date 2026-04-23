import type {
  LearnLesson,
  LearnModule,
  LearnNoteFormData,
} from "../../components/learn/types";

export type UseNotesManagementParams = {
  slug: string;
  modules: LearnModule[];
  currentLesson: LearnLesson | null;
  isNotesCollapsed: boolean;
  closeLia: () => void;
};

export type NotesStatsOperation = "create" | "update" | "delete";

export type SaveNoteRequest = {
  slug: string;
  lessonId: string;
  noteId?: string;
  noteData: LearnNoteFormData;
};

export const NOTE_DELETE_TIMEOUT_MS = 20000;
