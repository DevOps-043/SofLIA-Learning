'use client'

import { BookOpen, FileText, User } from 'lucide-react'
import type { CourseDetailTabId } from '../../types/course-detail.types'

interface CourseDetailTabsProps {
  activeTab: CourseDetailTabId
  onChange: (tab: CourseDetailTabId) => void
}

const tabs = [
  { id: 'info' as const, label: 'Informacion', icon: BookOpen },
  { id: 'content' as const, label: 'Contenido', icon: FileText },
  { id: 'instructor' as const, label: 'Instructor', icon: User },
]

export function CourseDetailTabs({ activeTab, onChange }: CourseDetailTabsProps) {
  return (
    <div className="flex border-b border-gray-200 dark:border-slate-700">
      {tabs.map(tab => {
        const Icon = tab.icon
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex-1 px-6 py-4 flex items-center justify-center gap-2 transition-colors ${
              activeTab === tab.id
                ? 'bg-primary/20 text-primary border-b-2 border-primary'
                : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-700/50'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="font-semibold">{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}
