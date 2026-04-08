import { motion } from 'framer-motion'
import { BarChart3, BookOpen, FileText, GraduationCap, Star } from 'lucide-react'
import type { BusinessCourseDetailTabId } from '../../types/business-course-detail.types'

const BUSINESS_COURSE_TABS: Array<{
  id: BusinessCourseDetailTabId
  label: string
  icon: typeof BookOpen
}> = [
  { id: 'info', label: 'Informacion', icon: BookOpen },
  { id: 'content', label: 'Contenido', icon: FileText },
  { id: 'reviews', label: 'Resenas', icon: Star },
  { id: 'instructor', label: 'Instructor', icon: GraduationCap },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 }
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
  isDark,
  textColor,
  borderColor,
  accentColor
}: BusinessCourseDetailTabsProps) {
  return (
    <div className="flex overflow-x-auto border-b" style={{ scrollbarWidth: 'none', borderColor }}>
      {BUSINESS_COURSE_TABS.map(tab => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id

        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="group flex-1 flex items-center justify-center relative px-2 py-4 transition-all duration-300"
            style={{
              color: isActive ? accentColor : (isDark ? 'rgba(255,255,255,0.5)' : `${textColor}60`),
              backgroundColor: isActive ? `${accentColor}10` : 'transparent'
            }}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span
              className={`font-black uppercase tracking-[0.15em] text-[10px] whitespace-nowrap overflow-hidden transition-all duration-300 ease-out ${
                isActive ? 'max-w-[150px] ml-3 opacity-100' : 'max-w-0 opacity-0 ml-0 group-hover:max-w-[150px] group-hover:ml-3 group-hover:opacity-100'
              }`}
            >
              {tab.label}
            </span>
            {isActive ? (
              <motion.div layoutId="activeBusinessCourseTab" className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: accentColor }} />
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
