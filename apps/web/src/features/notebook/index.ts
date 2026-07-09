/**
 * Notebook Feature — Barrel Exports
 *
 * The Notebook ("Libro de Apuntes") organizes a user's lesson notes by
 * Course -> Lesson, with a TipTap rich-text editor and a dedicated note page.
 * All data is strictly scoped to the user's current organization.
 */

// Page-level clients
export { NotebookPageClient } from './components/NotebookPageClient'
export { NoteEditorPageClient } from './components/NoteEditorPageClient'

// Reusable building blocks
export { RichTextEditor } from './components/editor/RichTextEditor'
export { NoteContentView } from './components/NoteContentView'

// Hooks
export { useNotebookTree } from './hooks/useNotebookTree'
export { useNoteEditor } from './hooks/useNoteEditor'
export { useNoteEnrichment } from './hooks/useNoteEnrichment'

// Client service
export {
  fetchNotebookTree,
  fetchNotebookNote,
  fetchNotebookCourseOptions,
  fetchNoteEnrichmentState,
  createNotebookNote,
  updateNotebookNote,
  updateDerivedTask,
  deleteNotebookNote,
} from './services/notebook.client.service'

// Types
export type {
  NotebookTree,
  NotebookCourseNode,
  NotebookLessonNode,
  NotebookNoteSummary,
  NotebookNoteDetail,
  NotebookCourseOption,
  NotebookNoteEnrichment,
  NotebookNoteEnrichmentState,
  NotebookDerivedTask,
  NotebookDerivedTaskStatus,
  NotebookKnowledgeType,
  NotebookLifecycleStatus,
  CreateNotebookNoteInput,
  UpdateNotebookNoteInput,
} from './types'
