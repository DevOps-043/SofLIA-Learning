'use client'

import { Activity, MessageCircle, Play } from 'lucide-react'
import type { LearnPageLogicResult } from '@/features/courses/hooks/useLearnPageLogic'

const TAB_ICONS = { Play, Activity, MessageCircle } as const
const TAB_TOUR_IDS: Record<string, string> = {
  activities: 'course-learn--tab-activities',
  questions: 'course-learn--tab-questions',
  video: 'course-learn--tab-video',
}

export function LessonTabsBar({ logic }: { logic: LearnPageLogicResult }) {
  return (
    <div data-tour-id="course-learn--tabs" className="scrollbar-hide flex h-[56px] items-center gap-1 overflow-x-auto scroll-smooth rounded-t-xl border-b p-2 md:gap-2 md:p-3" style={{ background: 'var(--learn-card-bg)', borderColor: 'var(--learn-card-border)', scrollPaddingLeft: '0.5rem', scrollPaddingRight: '0.5rem', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}>
      <div className="flex min-w-max items-center gap-1 md:gap-2">
        {logic.tabs.map((tab) => {
          const Icon = TAB_ICONS[tab.icon as keyof typeof TAB_ICONS]
          const isActive = logic.activeTab === tab.id
          const shouldHideText = !isActive && logic.isMobile
          return (
            <button key={tab.id} data-tour-id={TAB_TOUR_IDS[tab.id]} onClick={() => logic.handleTabChange(tab.id)} className={`group relative flex shrink-0 items-center rounded-xl transition-all duration-200 ${shouldHideText ? 'px-2 py-2 hover:gap-2 hover:px-3' : 'min-w-fit gap-1 px-3 py-2 md:gap-2 md:px-4'} ${isActive ? 'shadow-lg' : 'text-gray-500 hover:bg-gray-200/50 hover:text-primary dark:text-white/60 dark:hover:bg-white/5 dark:hover:text-accent'}`} style={{ fontFamily: 'Inter, sans-serif', fontWeight: isActive ? 600 : 500, scrollSnapAlign: 'start', ...(isActive ? { backgroundColor: 'var(--learn-action)', color: 'var(--learn-on-action)' } : {}) }}>
              <Icon className="h-4 w-4 shrink-0" />
              <span className={`whitespace-nowrap text-xs font-medium transition-all duration-200 ease-in-out md:text-sm ${shouldHideText ? 'max-w-0 overflow-hidden opacity-0 group-hover:max-w-[200px] group-hover:opacity-100' : ''}`}>{tab.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
