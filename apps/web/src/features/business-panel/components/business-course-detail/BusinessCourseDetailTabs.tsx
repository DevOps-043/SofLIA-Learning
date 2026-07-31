import { BookOpen, FileText, GraduationCap, Star } from 'lucide-react'
import type { BusinessCourseDetailTabId } from '../../types/business-course-detail.types'
import styles from './BusinessCourseDetail.module.css'

const BUSINESS_COURSE_TABS: Array<{
  id: BusinessCourseDetailTabId
  label: string
  icon: typeof BookOpen
}> = [
  { id: 'info', label: 'Información', icon: BookOpen },
  { id: 'content', label: 'Contenido', icon: FileText },
  { id: 'reviews', label: 'Reseñas', icon: Star },
  { id: 'instructor', label: 'Instructor', icon: GraduationCap },
]

interface BusinessCourseDetailTabsProps {
  activeTab: BusinessCourseDetailTabId
  setActiveTab: (tab: BusinessCourseDetailTabId) => void
  isDark: boolean
  textColor: string
  borderColor: string
  accentColor: string
}

export function BusinessCourseDetailTabs({
  activeTab,
  setActiveTab,
}: BusinessCourseDetailTabsProps) {
  return (
    <div className={styles.tabs} role="tablist" aria-label="Información del curso">
      {BUSINESS_COURSE_TABS.map(tab => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => setActiveTab(tab.id)}
            className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
          >
            <span className={styles.tabIcon} aria-hidden="true">
              <Icon />
            </span>
            <span>{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}
