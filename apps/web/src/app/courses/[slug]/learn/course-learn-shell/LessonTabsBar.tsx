'use client'

import { Activity, MessageCircle, Play } from 'lucide-react'
import type { LearnPageLogicResult } from '@/features/courses/hooks/useLearnPageLogic'
import styles from './CourseLessonPanel.module.css'

const TAB_ICONS = { Play, Activity, MessageCircle } as const
const TAB_TOUR_IDS: Record<string, string> = {
  activities: 'course-learn--tab-activities',
  questions: 'course-learn--tab-questions',
  video: 'course-learn--tab-video',
}

export function LessonTabsBar({ logic }: { logic: LearnPageLogicResult }) {
  return (
    <div
      data-tour-id="course-learn--tabs"
      className={styles.tabsBar}
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      <div className={styles.tabsTrack}>
        {logic.tabs.map((tab) => {
          const Icon = TAB_ICONS[tab.icon as keyof typeof TAB_ICONS]
          const isActive = logic.activeTab === tab.id
          const shouldHideText = !isActive && logic.isMobile
          return (
            <button
              key={tab.id}
              type="button"
              data-tour-id={TAB_TOUR_IDS[tab.id]}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => logic.handleTabChange(tab.id)}
              className={`${styles.tab} ${isActive ? styles.tabActive : ''} ${
                shouldHideText ? styles.tabCompact : ''
              }`}
            >
              <span className={styles.tabIcon}>
                <Icon aria-hidden="true" />
              </span>
              <span className={styles.tabLabel}>{tab.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
