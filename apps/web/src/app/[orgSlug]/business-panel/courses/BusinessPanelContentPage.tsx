'use client'

import type { ReactNode } from 'react'
import { useState } from 'react'
import { BookOpen, Route } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useBusinessPanelTheme } from '@/features/business-panel/hooks/useBusinessPanelTheme'
import { useTourStore } from '@/features/tours/tour.store'
import { CoursesPageContent } from './CoursesPageContent'
import { BusinessLearningPathsPage } from '@/features/business-panel/components/BusinessLearningPathsPage'

type ContentTab = 'courses' | 'paths'

interface TabDef {
  id: ContentTab
  label: string
  icon: ReactNode
}

interface BusinessPanelContentPageProps {
  initialTab: ContentTab
}

export function BusinessPanelContentPage({ initialTab }: BusinessPanelContentPageProps) {
  const [activeTab, setActiveTab] = useState<ContentTab>(initialTab)
  const theme = useBusinessPanelTheme()
  const stopTour = useTourStore((state) => state.stopTour)
  const router = useRouter()
  const pathname = usePathname()

  const tabs: TabDef[] = [
    { id: 'courses', label: 'Cursos', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'paths', label: 'Rutas de Aprendizaje', icon: <Route className="w-4 h-4" /> },
  ]

  function handleTabChange(tab: ContentTab) {
    // Stop any running tour before switching so Joyride doesn't fire TARGET_NOT_FOUND
    // events for the outgoing tab's elements, leaving a stale overlay or incorrectly
    // marking the tour as completed in the persisted store.
    stopTour()
    setActiveTab(tab)
    // Reflect the active tab in the URL so BusinessPanelHeader's useSearchParams()
    // picks up the correct tour restart action for the visible tab.
    const params = tab === 'paths' ? '?tab=paths' : ''
    router.replace(`${pathname}${params}`, { scroll: false })
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.panelBg }}>
      {/* Unified tab bar */}
      <div
        className="flex gap-1 px-6 lg:px-8 pt-6 border-b"
        style={{ borderColor: theme.borderColor }}
      >
        {tabs.map(({ id, label, icon }) => {
          const isActive = activeTab === id
          return (
            <button
              key={id}
              onClick={() => handleTabChange(id)}
              className="flex items-center gap-2 px-5 py-3 text-sm font-bold transition-all border-b-2 -mb-px"
              style={{
                color: isActive ? theme.actionColor : theme.mutedTextColor,
                borderBottomColor: isActive ? theme.actionColor : 'transparent',
              }}
            >
              {icon}
              {label}
            </button>
          )
        })}
      </div>

      {/* Unmount inactive tab so its tour can auto-start cleanly on each activation. */}
      {activeTab === 'courses' && <CoursesPageContent />}
      {activeTab === 'paths' && <BusinessLearningPathsPage />}
    </div>
  )
}
