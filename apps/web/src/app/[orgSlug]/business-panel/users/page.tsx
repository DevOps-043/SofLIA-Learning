'use client'

import type { CSSProperties } from 'react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { ToastNotification } from '@/core/components/ToastNotification/ToastNotification'
import { useBusinessPanelTheme } from '@/features/business-panel/hooks/useBusinessPanelTheme'
import { useBusinessUsersPageLogic } from '@/features/business-panel/hooks/useBusinessUsersPageLogic'
import { useTour } from '@/features/tours'
import { businessPanelUsersTour } from '@/features/tours/config/business-panel-users.tour'

import { BusinessUsersErrorBanner } from './components/BusinessUsersErrorBanner'
import { BusinessUsersLoadingState } from './components/BusinessUsersLoadingState'
import { UsersDynamicModals } from './components/UsersDynamicModals'
import { UsersFilterSection } from './components/UsersFilterSection'
import { UsersPageHeader } from './components/UsersPageHeader'
import { UsersPagination } from './components/UsersPagination'
import { UsersStatsGrid } from './components/UsersStatsGrid'
import { UsersTabContent } from './components/UsersTabContent'
import styles from './components/UsersPanel.module.css'

type UsersPanelVariables = CSSProperties & Record<`--users-${string}`, string>

export default function BusinessPanelUsersPage() {
  const { t } = useTranslation('business')
  const theme = useBusinessPanelTheme()
  const logic = useBusinessUsersPageLogic()
  const { autoStartIfNeeded } = useTour(businessPanelUsersTour)

  useEffect(() => {
    if (!logic.isInitialLoading) {
      return autoStartIfNeeded()
    }
  }, [autoStartIfNeeded, logic.isInitialLoading])

  // Solo el arranque en frío sustituye la página entera. Cambiar de pestaña
  // recarga el recurso, pero la cabecera, las estadísticas y los filtros deben
  // permanecer montados: desmontarlos se percibe como recargar toda la página.
  if (logic.isInitialLoading) {
    return <BusinessUsersLoadingState />
  }

  const usersPanelVariables: UsersPanelVariables = {
    '--users-accent': theme.accentColor,
    '--users-action': theme.actionColor,
    '--users-border': theme.borderColor,
    '--users-card': theme.cardBg,
    '--users-danger': theme.dangerColor,
    '--users-divider': theme.dividerColor,
    '--users-input': theme.inputBg,
    '--users-muted': theme.mutedTextColor,
    '--users-on-action': theme.onActionColor,
    '--users-primary': theme.primaryColor,
    '--users-secondary': theme.secondaryColor,
    '--users-subtext': theme.subtextColor,
    '--users-success': theme.successColor,
    '--users-text': theme.textColor,
    '--users-warning': theme.warningColor,
  }

  return (
    <>
      <div
        className={styles.page}
        style={usersPanelVariables}
      >
        <div className={styles.pageStack}>
          <UsersPageHeader
            t={t}
            onExportUsers={() => void downloadUsersCsv()}
            onImportClick={() => logic.setIsImportModalOpen(true)}
            onInviteClick={() => logic.setIsUnifiedInviteModalOpen(true)}
            onAddClick={() => logic.setIsAddModalOpen(true)}
            onRefresh={logic.refetch}
            isRefreshing={logic.isLoading}
          />
          <BusinessUsersErrorBanner error={logic.error} theme={theme} />
          <UsersStatsGrid logic={logic} theme={theme} />
          <UsersFilterSection logic={logic} />
          <UsersTabContent logic={logic} theme={theme} isLoading={logic.isResourceLoading} />

          {logic.activeTab !== 'requests' && logic.activePagination.totalPages > 1 ? (
            <UsersPagination
              page={logic.activePagination.page}
              totalPages={logic.activePagination.totalPages}
              total={logic.activePagination.total}
              onPageChange={(page) => {
                const resource =
                  logic.activeTab === 'invitations' || logic.activeTab === 'links'
                    ? logic.activeTab
                    : 'users'
                logic.setResourcePage(resource, page)
              }}
            />
          ) : null}

          <UsersDynamicModals logic={logic} />
          <ToastNotification
            isOpen={logic.toast.isOpen}
            onClose={() => logic.setToast({ ...logic.toast, isOpen: false })}
            message={logic.toast.message}
            type={logic.toast.type}
          />
        </div>
      </div>
    </>
  )
}

async function downloadUsersCsv() {
  const response = await fetch('/api/business/users/template', { credentials: 'include' })
  if (!response.ok) return

  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'usuarios-organizacion.csv'
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  window.URL.revokeObjectURL(url)
}
