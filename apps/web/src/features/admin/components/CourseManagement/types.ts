import { CourseSkill } from '@/features/courses/components/CourseSkillsSelector'
import { AdminModule } from '../../services/adminModules.service'
import { AdminLesson } from '../../services/adminLessons.service'

export interface CourseManagementPageProps {
  courseId: string
}

export type ActiveTab = 'modules' | 'config' | 'certificates' | 'preview' | 'stats'

export interface FeedbackMessage {
  type: 'success' | 'error'
  message: string
}

export interface ConfigData {
  title: string
  description: string
  category: string
  level: string
  duration_total_minutes: number
  price: number
  thumbnail_url: string
  slug: string
  instructor_id: string
}

export interface Instructor {
  id: string
  name: string
}

export const DEFAULT_CONFIG_DATA: ConfigData = {
  title: '',
  description: '',
  category: 'ia',
  level: 'beginner',
  duration_total_minutes: 60,
  price: 0,
  thumbnail_url: '',
  slug: '',
  instructor_id: ''
}

export type { AdminModule, AdminLesson, CourseSkill }
