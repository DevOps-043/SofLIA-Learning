import { CourseSidebarPanel } from '@/features/courses/components/learn';
import type { LearnPageLogicResult } from '@/features/courses/hooks/useLearnPageLogic';

interface CourseLearnSidebarProps {
  logic: LearnPageLogicResult;
}

export function CourseLearnSidebar({ logic }: CourseLearnSidebarProps) {
  return (
    <CourseSidebarPanel
      currentLesson={logic.currentLesson}
      expandedLessons={logic.expandedLessons}
      expandedModules={logic.expandedModules}
      isMaterialCollapsed={logic.isMaterialCollapsed}
      isMobile={logic.isMobile}
      isNotesCollapsed={logic.isNotesCollapsed}
      isOpen={logic.isLeftPanelOpen}
      learningPathState={logic.learningPathState}
      lessonsActivities={logic.lessonsActivities}
      lessonsMaterials={logic.lessonsMaterials}
      lessonsQuizStatus={logic.lessonsQuizStatus}
      modules={logic.modules}
      notesStats={logic.notesStats}
      onClose={logic.closeLeftPanel}
      onCreateNote={logic.openNewNoteModal}
      onDeleteNote={logic.handleDeleteNote}
      onEditNote={logic.openEditNoteModal}
      onOpenContentSection={logic.openContentSection}
      onOpenNewNote={() => {
        logic.openNotesSection({ collapseMaterials: true });
        logic.openNewNoteModal();
      }}
      onOpenNotesSection={() => logic.openNotesSection({ collapseMaterials: true })}
      onOpenSidebar={logic.openLeftPanel}
      onSelectLesson={logic.handleLessonChange}
      onToggleLessonExpand={logic.toggleLessonExpand}
      onToggleMaterialCollapsed={logic.toggleMaterialCollapsed}
      onToggleModuleExpand={logic.toggleModuleExpand}
      onToggleNotesCollapsed={logic.toggleNotesCollapsed}
      savedNotes={logic.savedNotes}
    />
  );
}
