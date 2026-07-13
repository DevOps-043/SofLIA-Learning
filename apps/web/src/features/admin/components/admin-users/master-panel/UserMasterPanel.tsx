'use client'

import { Fragment, useCallback, useEffect, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Loader2 } from 'lucide-react'
import { ToastNotification, type ToastType } from '@/core/components/ToastNotification/ToastNotification'
import { useAdminPanelTheme } from '../../../hooks/useAdminPanelTheme'
import { useAdminUserStatsFilters } from '../../../hooks/useAdminUserStatsFilters'
import type { AdminUser } from '../../../services/adminUsers.service'
import { MasterPanelHeader } from './MasterPanelHeader'
import { MasterPanelTabs } from './MasterPanelTabs'
import { useAccountTabLogic } from './hooks/useAccountTabLogic'
import { useMasterPanelData } from './hooks/useMasterPanelData'
import { useOrgCoursesTabLogic } from './hooks/useOrgCoursesTabLogic'
import { useOrgLearningPathsTabLogic } from './hooks/useOrgLearningPathsTabLogic'
import { useOrgSelection } from './hooks/useOrgSelection'
import { useOrganizationsTabLogic } from './hooks/useOrganizationsTabLogic'
import { useProfileTabLogic } from './hooks/useProfileTabLogic'
import { AccountTab } from './tabs/AccountTab'
import { OrgCoursesTab } from './tabs/OrgCoursesTab'
import { OrgLearningPathsTab } from './tabs/OrgLearningPathsTab'
import { OrganizationsTab } from './tabs/OrganizationsTab'
import { ProfileTab } from './tabs/ProfileTab'
import { StatsTab } from './tabs/StatsTab'
import type {
  MasterPanelTab,
  ShowToast,
  ToastState,
  UserMasterPanelData,
  UserMasterPanelProps,
} from './types'

export function UserMasterPanel({
  user,
  isOpen,
  initialTab = 'profile',
  defaultOrganizationId,
  organizationLabel,
  onClose,
  onUserSaved,
  onRequestDelete,
}: UserMasterPanelProps) {
  const theme = useAdminPanelTheme()

  const [activeTab, setActiveTab] = useState<MasterPanelTab>(initialTab)
  // Los tabs visitados permanecen montados (display:none): volver a un tab es
  // instantáneo, sin re-fetch de catálogos ni re-montaje del árbol de charts.
  const [visitedTabs, setVisitedTabs] = useState<Set<MasterPanelTab>>(
    () => new Set([initialTab]),
  )

  useEffect(() => {
    if (!isOpen) return
    setActiveTab(initialTab)
    setVisitedTabs(new Set([initialTab]))
  }, [isOpen, initialTab, user.id])

  const handleTabChange = useCallback((tab: MasterPanelTab) => {
    setActiveTab(tab)
    setVisitedTabs((prev) => {
      if (prev.has(tab)) return prev
      const next = new Set(prev)
      next.add(tab)
      return next
    })
  }, [])

  const [toast, setToast] = useState<ToastState>({ isOpen: false, message: '', type: 'success' })
  const showToast: ShowToast = useCallback(
    (message, type = 'success') => setToast({ isOpen: true, message, type }),
    [],
  )
  const hideToast = useCallback(() => setToast((prev) => ({ ...prev, isOpen: false })), [])

  const { data, isLoading, error, refetchSilent } = useMasterPanelData(user.id, isOpen)
  const { companies } = useAdminUserStatsFilters()
  const { orgOptions, selectedOrgId, setSelectedOrgId } = useOrgSelection(
    data.memberships,
    defaultOrganizationId,
  )

  const tabContentProps: TabContentProps = {
    user,
    data,
    isLoading,
    error,
    theme,
    companies,
    orgOptions,
    selectedOrgId,
    onOrgChange: setSelectedOrgId,
    organizationLabel,
    showToast,
    refetchSilent,
    onUserSaved,
    onRequestDelete: onRequestDelete ? () => onRequestDelete(user) : undefined,
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 backdrop-blur-sm" style={{ backgroundColor: theme.overlayBg }} />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                className="flex h-[92vh] w-full max-w-[1400px] transform flex-col overflow-hidden rounded-[28px] border shadow-2xl transition-all"
                style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}
              >
                <MasterPanelHeader user={user} theme={theme} onClose={onClose} />
                <MasterPanelTabs activeTab={activeTab} theme={theme} onTabChange={handleTabChange} />

                <div className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6">
                  {Array.from(visitedTabs).map((tab) => (
                    <div key={tab} className={tab === activeTab ? undefined : 'hidden'}>
                      <TabContent tab={tab} {...tabContentProps} />
                    </div>
                  ))}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>

        <ToastNotification
          isOpen={toast.isOpen}
          onClose={hideToast}
          message={toast.message}
          type={toast.type as ToastType}
          position="top-right"
        />
      </Dialog>
    </Transition>
  )
}

interface TabContentProps {
  user: AdminUser
  data: UserMasterPanelData
  isLoading: boolean
  error: string | null
  theme: ReturnType<typeof useAdminPanelTheme>
  companies: Array<{ value: string; label: string }>
  orgOptions: Array<{ value: string; label: string }>
  selectedOrgId: string
  onOrgChange: (organizationId: string) => void
  organizationLabel?: string | null
  showToast: ShowToast
  refetchSilent: () => Promise<void>
  onUserSaved: () => Promise<void>
  onRequestDelete?: () => void
}

/**
 * Perfil y Cuenta solo dependen del usuario ya cargado en el directorio, así
 * que se pintan de inmediato; únicamente los tabs org-scoped esperan (o
 * muestran error de) la carga del agregado.
 */
function TabContent({ tab, ...props }: TabContentProps & { tab: MasterPanelTab }) {
  if (tab === 'profile') return <ProfileTabView {...props} />
  if (tab === 'account') return <AccountTabView {...props} />

  if (props.isLoading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: props.theme.subtextColor }} />
      </div>
    )
  }
  if (props.error) {
    return (
      <div
        className="flex min-h-[360px] items-center justify-center text-sm"
        style={{ color: props.theme.dangerColor }}
      >
        {props.error}
      </div>
    )
  }

  switch (tab) {
    case 'organizations':
      return <OrganizationsTabView {...props} />
    case 'courses':
      return <OrgCoursesTabView {...props} />
    case 'learningPaths':
      return <OrgLearningPathsTabView {...props} />
    case 'stats':
      return (
        <StatsTab
          user={props.user}
          orgOptions={props.orgOptions}
          selectedOrgId={props.selectedOrgId}
          onOrgChange={props.onOrgChange}
          organizationLabel={props.organizationLabel}
        />
      )
    default:
      return null
  }
}

function ProfileTabView({ user, showToast, onUserSaved }: TabContentProps) {
  const logic = useProfileTabLogic({ user, showToast, onUserSaved })
  return <ProfileTab {...logic} />
}

function AccountTabView({ user, showToast, onUserSaved, onRequestDelete }: TabContentProps) {
  const logic = useAccountTabLogic({ user, showToast, onUserSaved })
  return <AccountTab {...logic} onRequestDelete={onRequestDelete} />
}

function OrganizationsTabView({ user, data, companies, showToast, refetchSilent }: TabContentProps) {
  const logic = useOrganizationsTabLogic({
    userId: user.id,
    memberships: data.memberships,
    companyOptions: companies,
    showToast,
    refetchSilent,
  })
  return <OrganizationsTab {...logic} />
}

function OrgCoursesTabView({
  user,
  data,
  orgOptions,
  selectedOrgId,
  onOrgChange,
  showToast,
  refetchSilent,
}: TabContentProps) {
  const logic = useOrgCoursesTabLogic({
    userId: user.id,
    selectedOrgId,
    courseAssignments: data.courseAssignments,
    showToast,
    refetchSilent,
  })
  return (
    <OrgCoursesTab {...logic} orgOptions={orgOptions} selectedOrgId={selectedOrgId} onOrgChange={onOrgChange} />
  )
}

function OrgLearningPathsTabView({
  user,
  data,
  orgOptions,
  selectedOrgId,
  onOrgChange,
  showToast,
  refetchSilent,
}: TabContentProps) {
  const logic = useOrgLearningPathsTabLogic({
    userId: user.id,
    selectedOrgId,
    learningPathAssignments: data.learningPathAssignments,
    showToast,
    refetchSilent,
  })
  return (
    <OrgLearningPathsTab
      {...logic}
      orgOptions={orgOptions}
      selectedOrgId={selectedOrgId}
      onOrgChange={onOrgChange}
    />
  )
}
