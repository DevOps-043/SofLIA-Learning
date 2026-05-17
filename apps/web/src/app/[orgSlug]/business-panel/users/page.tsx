'use client'

import { useMemo } from 'react'
import { Joyride } from 'react-joyride'
import { useTranslation } from 'react-i18next'

import { ToastNotification } from '@/core/components/ToastNotification/ToastNotification'
import { useBusinessPanelTheme } from '@/features/business-panel/hooks/useBusinessPanelTheme'
import { useBusinessUsersPageLogic } from '@/features/business-panel/hooks/useBusinessUsersPageLogic'
import { ADMIN_USERS_TOUR_ID, getAdminUsersSteps } from '@/features/tours/config/business-panel/admin-users-steps'
import { useFeatureTour } from '@/features/tours/hooks/useFeatureTour'

import { BusinessUsersErrorBanner } from './components/BusinessUsersErrorBanner'
import { BusinessUsersLoadingState } from './components/BusinessUsersLoadingState'
import { UsersDynamicModals } from './components/UsersDynamicModals'
import { UsersFilterSection } from './components/UsersFilterSection'
import { UsersPageHeader } from './components/UsersPageHeader'
import { UsersPagination } from './components/UsersPagination'
import { UsersStatsGrid } from './components/UsersStatsGrid'
import { UsersTabContent } from './components/UsersTabContent'

export default function BusinessPanelUsersPage() {
  const { t } = useTranslation('business')
  const theme = useBusinessPanelTheme()
  const logic = useBusinessUsersPageLogic()
  const tourSteps = useMemo(() => getAdminUsersSteps(t), [t])
  const { joyrideProps } = useFeatureTour({
    tourId: ADMIN_USERS_TOUR_ID,
    steps: tourSteps,
    enabled: !logic.isLoading,
  })

  if (logic.isLoading) {
    return <BusinessUsersLoadingState />
  }

  return (
    <>
      {joyrideProps.run ? <Joyride {...joyrideProps} /> : null}
      <div
        className="space-y-6 p-4 sm:space-y-8 sm:p-6 lg:p-8"
        style={{ color: theme.textColor }}
      >
        <UsersPageHeader
          t={t}
          onDownloadTemplate={downloadUsersTemplate}
          onImportClick={() => logic.setIsImportModalOpen(true)}
          onInviteClick={() => logic.setIsUnifiedInviteModalOpen(true)}
          onAddClick={() => logic.setIsAddModalOpen(true)}
          onRefresh={logic.refetch}
          isRefreshing={logic.isLoading}
        />

        <BusinessUsersErrorBanner error={logic.error} theme={theme} />
        <UsersStatsGrid logic={logic} theme={theme} />
        <UsersFilterSection logic={logic} />
        <UsersTabContent logic={logic} theme={theme} />

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
    </>
  )
}

async function downloadUsersTemplate() {
  const response = await fetch('/api/business/users/template', { credentials: 'include' })
  if (!response.ok) return

  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'plantilla-importacion-usuarios.csv'
  anchor.click()
}
