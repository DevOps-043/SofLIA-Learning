'use client'

import { CourseSidebarPanel } from '@/features/courses/components/learn'
import type { LearnPageLogicResult } from '@/features/courses/hooks/useLearnPageLogic'
import type { StyleConfig } from '@/features/business-panel/contexts/OrganizationStylesContext'

interface CourseLearnSidebarProps {
  logic: LearnPageLogicResult;
  panelStyles?: StyleConfig | null;
}

export function CourseLearnSidebar({ logic, panelStyles }: CourseLearnSidebarProps) {
  return (
    <CourseSidebarPanel
      isOpen={logic.isLeftPanelOpen}
      isMobile={logic.isMobile}
      modules={logic.modules}
      currentLesson={logic.currentLesson}
      isMaterialCollapsed={logic.isMaterialCollapsed}
      isNotesCollapsed={logic.isNotesCollapsed}
      expandedLessons={logic.expandedLessons}
      expandedModules={logic.expandedModules}
      lessonsActivities={logic.lessonsActivities}
      lessonsMaterials={logic.lessonsMaterials}
      lessonsQuizStatus={logic.lessonsQuizStatus}
      savedNotes={logic.savedNotes}
      notesStats={logic.notesStats}
      onClose={logic.closeLeftPanel}
      onToggleMaterialCollapsed={logic.toggleMaterialCollapsed}
      onToggleNotesCollapsed={logic.toggleNotesCollapsed}
      onToggleLessonExpand={logic.toggleLessonExpand}
      onToggleModuleExpand={logic.toggleModuleExpand}
      onSelectActivity={logic.handleActivityShortcut}
      onSelectMaterial={({ materialId, lesson }) => logic.handleActivityShortcut({ activityId: materialId, contentType: 'material', lesson })}
      onSelectLesson={logic.handleLessonChange}
      onCreateNote={logic.openNewNoteModal}
      onEditNote={logic.openEditNoteModal}
      onDeleteNote={logic.handleDeleteNote}
      onOpenSidebar={logic.openLeftPanel}
      onOpenContentSection={logic.openContentSection}
      onOpenNotesSection={() => logic.openNotesSection({ collapseMaterials: true })}
      onOpenNewNote={() => { logic.openNotesSection({ collapseMaterials: true }); logic.openNewNoteModal() }}
      sidebarBg={panelStyles?.sidebar_background}
      sidebarBorderColor={panelStyles?.border_color}
      accentColor={panelStyles?.accent_color}
      notebookBasePath={logic.orgSlug ? `/${logic.orgSlug}/business-user/notebook` : undefined}
    />
  )
}
