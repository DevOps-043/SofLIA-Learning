import type { AdminModule } from '../../../admin/services/adminModules.service'
import type { AdminLesson } from '../../../admin/services/adminLessons.service'
import type { CourseSkill } from '../../../courses/components/CourseSkillsSelector'
import type { Dispatch, SetStateAction, FormEvent, ChangeEvent } from 'react'

export type ActiveTab = 'modules' | 'config' | 'certificates' | 'preview' | 'stats'

export interface ConfigData {
  title: string
  description: string
  category: string
  level: string
  duration_total_minutes: number
  price: number
  thumbnail_url: string
  slug: string
}

export interface InstructorModulesTabProps {
  modules: AdminModule[]
  modulesLoading: boolean
  expandedModules: Set<string>
  expandedLessons: Set<string>
  toggleModule: (moduleId: string) => void
  toggleLesson: (lessonId: string) => void
  lessons: AdminLesson[]
  materials: { material_id: string; lesson_id: string; material_title: string; material_type: string }[]
  activities: { activity_id: string; lesson_id: string; activity_title: string; activity_type: string }[]
  setSelectedModule: (m: AdminModule | null) => void
  setShowModuleModal: (v: boolean) => void
  setDeletingModule: (m: AdminModule | null) => void
  setShowDeleteModuleModal: (v: boolean) => void
  setSelectedLesson: (l: AdminLesson | null) => void
  setShowLessonModal: (v: boolean) => void
  setEditingModuleId: (id: string | null) => void
  setEditingLessonId: (id: string | null) => void
  setEditingActivityId: (id: string | null) => void
  setDeletingLesson: (l: AdminLesson | null) => void
  setShowDeleteLessonModal: (v: boolean) => void
  setShowMaterialModal: (v: boolean) => void
  setShowActivityModal: (v: boolean) => void
}

export interface InstructorConfigTabProps {
  courseId: string
  configData: ConfigData
  setConfigData: Dispatch<SetStateAction<ConfigData>>
  handleConfigChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  handleSaveConfig: (e: FormEvent<HTMLFormElement>) => void
  savingConfig: boolean
  courseSkills: CourseSkill[]
  setCourseSkills: (skills: CourseSkill[]) => void
  savingSkills: boolean
}

export interface InstructorPreviewTabProps {
  workshopPreview: {
    title: string
    description: string
    category?: string
    level: string
    duration_total_minutes: number
    price: number
    thumbnail_url?: string
    slug?: string
  } | null
  previewLoading: boolean
}

export interface InstructorStatsTabProps {
  modules: AdminModule[]
  userStats: Record<string, unknown> | null
  enrolledUsers: Record<string, unknown>[]
  statsLoading: boolean
  chartData: Record<string, unknown> | null
}

export interface DeleteModuleModalProps {
  deletingModule: AdminModule
  onCancel: () => void
  onConfirm: () => Promise<void>
}

export interface DeleteLessonModalProps {
  deletingLesson: AdminLesson
  onCancel: () => void
  onConfirm: () => Promise<void>
}
