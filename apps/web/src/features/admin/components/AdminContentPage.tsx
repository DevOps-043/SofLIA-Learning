'use client'

import type { ReactNode } from 'react'
import { useState } from 'react'
import { BookOpen, Route } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { AdminWorkshopsPage } from './AdminWorkshopsPage'
import { AdminLearningPathsPage } from './AdminLearningPathsPage'

export type AdminContentTab = 'workshops' | 'learning-paths'

interface TabDef {
  id: AdminContentTab
  label: string
  icon: ReactNode
}

interface AdminContentPageProps {
  initialTab: AdminContentTab
}

export function AdminContentPage({ initialTab }: AdminContentPageProps) {
  const { t } = useTranslation('admin')
  const [activeTab, setActiveTab] = useState<AdminContentTab>(initialTab)
  const router = useRouter()
  const pathname = usePathname()

  const tabs: TabDef[] = [
    { id: 'workshops', label: t('navigation.workshops', 'Talleres'), icon: <BookOpen className="h-4 w-4" /> },
    { id: 'learning-paths', label: t('navigation.learningPaths', 'Rutas de aprendizaje'), icon: <Route className="h-4 w-4" /> },
  ]

  function handleTabChange(tab: AdminContentTab) {
    setActiveTab(tab)
    // Reflect the active tab in the URL so deep links / refreshes land on the right tab.
    const params = tab === 'learning-paths' ? '?tab=learning-paths' : ''
    router.replace(`${pathname}${params}`, { scroll: false })
  }

  return (
    <div className="min-h-screen">
      {/* Unified tab bar */}
      <div className="flex gap-1 border-b border-slate-200 px-4 pt-6 sm:px-6 lg:px-10 dark:border-white/10">
        {tabs.map(({ id, label, icon }) => {
          const isActive = activeTab === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => handleTabChange(id)}
              className={`-mb-px flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold transition-all ${
                isActive
                  ? 'border-[var(--color-accent)] text-slate-900 dark:text-white'
                  : 'border-transparent text-slate-500 dark:text-white/60'
              }`}
            >
              {icon}
              {label}
            </button>
          )
        })}
      </div>

      {/* Unmount the inactive tab so each page's own data fetching resets cleanly. */}
      {activeTab === 'workshops' && <AdminWorkshopsPage />}
      {activeTab === 'learning-paths' && <AdminLearningPathsPage />}
    </div>
  )
}
