import type {
  LearnLesson,
  LearnModule,
  LearnNoteFormData,
  LearnSavedNote,
} from "../../components/learn/types";

export type NotesStatsOperation = "create" | "update" | "delete";

export type UseNotesManagementParams = {
  slug: string;
  modules: LearnModule[];
  currentLesson: LearnLesson | null;
  isNotesCollapsed: boolean;
  closeLia: () => void;
};

export type SaveNoteHandler = (noteData: LearnNoteFormData) => Promise<boolean>;

export type CourseNotesLoader = (courseSlug: string) => Promise<void>;

export type NoteStateMutation = (noteData: unknown, lessonId: string) => void;

export type NoteRemoval = (noteId: string) => void;

export type DeleteNoteRequest = {
  note: LearnSavedNote;
  targetLessonId: string;
  slug: string;
};
