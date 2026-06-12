/**
 * Notebook Feature — Barrel Exports
 *
 * The Notebook ("Libro de Apuntes") feature lists the user's manual lesson
 * notes as a browsable, org-scoped collection.
 */

// Components
export { NotebookPageClient } from './components/NotebookPageClient'
export { NotebookHeader } from './components/NotebookHeader'
export { NotebookTabs } from './components/NotebookTabs'
export { NotebookNoteCard } from './components/NotebookNoteCard'
export { NotebookNoteModal } from './components/NotebookNoteModal'
export { NotebookEmptyState } from './components/NotebookEmptyState'
export { NotebookCourseFilter } from './components/NotebookCourseFilter'

// Hooks
export { useNotebookPageLogic } from './hooks/useNotebookPageLogic'

// Services (client)
export {
  getNotebookNotes,
  getNotebookCourses,
  updateNotebookNote,
} from './services/notebook.client.service'

// Types
export type {
  NotebookItem,
  NotebookManualNote,
  NotebookCourse,
  NotebookNotesResponse,
  NotebookCoursesResponse,
  NotebookNotesQueryParams,
  NotebookUpdateNoteInput,
  NotebookMutationResponse,
  NotebookTab,
  NotebookModalMode,
  NotebookModalState,
} from './types'

export { NOTEBOOK_DEFAULT_PAGE_SIZE, NOTEBOOK_MAX_PAGE_SIZE } from './types'
