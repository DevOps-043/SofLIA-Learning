'use client'

import type { CSSProperties } from 'react'
import { useState } from 'react'
import { BookOpen, LibraryBig, Route, type LucideIcon } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useBusinessPanelTheme } from '@/features/business-panel/hooks/useBusinessPanelTheme'
import { useTourStore } from '@/features/tours/tour.store'
import { CoursesPageContent } from './CoursesPageContent'
import { BusinessLearningPathsPage } from '@/features/business-panel/components/BusinessLearningPathsPage'
import styles from './ContentPanel.module.css'

type ContentTab = 'courses' | 'paths'

interface TabDef {
  id: ContentTab
  label: string
  icon: LucideIcon
}

interface BusinessPanelContentPageProps {
  initialTab: ContentTab
}

type ContentPanelVariables = CSSProperties & Record<`--content-${string}`, string>

export function BusinessPanelContentPage({ initialTab }: BusinessPanelContentPageProps) {
  const [activeTab, setActiveTab] = useState<ContentTab>(initialTab)
  const theme = useBusinessPanelTheme()
  const stopTour = useTourStore((state) => state.stopTour)
  const router = useRouter()
  const pathname = usePathname()

  const tabs: TabDef[] = [
    { id: 'courses', label: 'Cursos', icon: BookOpen },
    { id: 'paths', label: 'Rutas de aprendizaje', icon: Route },
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

  const contentPanelVariables: ContentPanelVariables = {
    '--content-accent': theme.accentColor,
    '--content-action': theme.actionColor,
    '--content-border': theme.borderColor,
    '--content-card': theme.cardBg,
    '--content-danger': theme.dangerColor,
    '--content-divider': theme.dividerColor,
    '--content-input': theme.inputBg,
    '--content-muted': theme.mutedTextColor,
    '--content-on-action': theme.onActionColor,
    '--content-primary': theme.primaryColor,
    '--content-secondary': theme.secondaryColor,
    '--content-subtext': theme.subtextColor,
    '--content-success': theme.successColor,
    '--content-text': theme.textColor,
    '--content-warning': theme.warningColor,
  }

  return (
    <div className={styles.page} style={contentPanelVariables}>
      <div className={styles.pageStack}>
        <nav className={styles.sectionNav} aria-label="Secciones de contenido">
          <div className={styles.sectionNavLabel}>
            <span className={styles.sectionNavLabelIcon} aria-hidden="true">
              <LibraryBig />
            </span>
            <span className={styles.sectionNavCopy}>
              <span className={styles.sectionNavEyebrow}>Centro de aprendizaje</span>
              <strong>Contenido</strong>
              <span className={styles.sectionNavDescription}>Catálogo, rutas y asignaciones</span>
            </span>
          </div>

          <div className={styles.sectionTabs} role="tablist" aria-label="Tipo de contenido">
            {tabs.map(({ id, label, icon: Icon }) => {
              const isActive = activeTab === id
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`content-panel-${id}`}
                  onClick={() => handleTabChange(id)}
                  className={`${styles.sectionTab} ${isActive ? styles.sectionTabActive : ''}`}
                >
                  <span className={styles.sectionTabIcon} aria-hidden="true">
                    <Icon />
                  </span>
                  <span>{label}</span>
                </button>
              )
            })}
          </div>
        </nav>

        <div
          id={`content-panel-${activeTab}`}
          role="tabpanel"
          className={styles.contentBody}
        >
          {/* Unmount inactive tab so its tour can auto-start cleanly on each activation. */}
          {activeTab === 'courses' && <CoursesPageContent />}
          {activeTab === 'paths' && <BusinessLearningPathsPage />}
        </div>
      </div>
    </div>
  )
}
