'use client'

import { Fragment, useEffect, useMemo, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Loader2, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { BusinessUserAnalyticsPageClient } from '@/features/business-panel/components/business-user-analytics/BusinessUserAnalyticsPageClient'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'
import type { AdminUserOrganizationOption } from '../../services/admin-user-analytics/list-user-organizations'
import type { AdminUser } from '../../services/adminUsers.service'
import { getAdminUserDisplayConfig } from './service'

interface AdminUserStatsModalProps {
  user: AdminUser
  isOpen: boolean
  onClose: () => void
  organizationLabel?: string | null
  /** Organización filtrada en la página: define la selección inicial del selector. */
  defaultOrganizationId?: string | null
}

interface UserOrganizationsResponse {
  success: boolean
  organizations?: AdminUserOrganizationOption[]
}

export function AdminUserStatsModal({
  user,
  isOpen,
  onClose,
  organizationLabel,
  defaultOrganizationId,
}: AdminUserStatsModalProps) {
  const theme = useAdminPanelTheme()
  const { t } = useTranslation('admin')
  const { displayName } = getAdminUserDisplayConfig(user)

  const [organizations, setOrganizations] = useState<AdminUserOrganizationOption[]>([])
  const [orgsLoading, setOrgsLoading] = useState(false)
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null)

  // Carga las organizaciones del usuario al abrir y resuelve la selección inicial:
  // la organización filtrada en la página si el usuario pertenece a ella, si no la
  // primera. Se reinicia el estado al cerrar para no arrastrar datos entre usuarios.
  useEffect(() => {
    if (!isOpen) {
      setOrganizations([])
      setSelectedOrgId(null)
      return
    }

    let cancelled = false
    setOrgsLoading(true)
    fetch(`/api/admin/users/${user.id}/organizations`, { credentials: 'include', cache: 'no-store' })
      .then((response) => response.json() as Promise<UserOrganizationsResponse>)
      .then((data) => {
        if (cancelled) return
        const orgs = data.success ? data.organizations ?? [] : []
        setOrganizations(orgs)
        const preferred = defaultOrganizationId && orgs.some((org) => org.id === defaultOrganizationId)
          ? defaultOrganizationId
          : orgs[0]?.id ?? null
        setSelectedOrgId(preferred)
      })
      .catch(() => {
        if (!cancelled) setOrganizations([])
      })
      .finally(() => {
        if (!cancelled) setOrgsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [isOpen, user.id, defaultOrganizationId])

  // Nombre de la org seleccionada para rotular el PDF (cae al label de la página).
  const selectedOrgLabel = useMemo(
    () => organizations.find((org) => org.id === selectedOrgId)?.name ?? organizationLabel ?? null,
    [organizations, selectedOrgId, organizationLabel],
  )

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
                className="flex max-h-[92vh] w-full max-w-[1400px] transform flex-col overflow-hidden rounded-[28px] border shadow-2xl transition-all"
                style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}
              >
                <div
                  className="flex flex-shrink-0 items-center justify-between gap-3 border-b px-6 py-4"
                  style={{ borderColor: theme.borderColor }}
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: theme.subtextColor }}>
                      {t('users.stats.modalEyebrow')}
                    </p>
                    <h2 className="truncate text-lg font-bold" style={{ color: theme.textColor }}>
                      {t('users.stats.modalTitle', { name: displayName })}
                    </h2>
                  </div>

                  <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
                    {orgsLoading ? (
                      <span className="text-xs font-medium" style={{ color: theme.subtextColor }}>
                        {t('users.stats.organizationLoading')}
                      </span>
                    ) : organizations.length > 1 ? (
                      <label className="flex items-center gap-2">
                        <span className="sr-only">{t('users.stats.organizationLabel')}</span>
                        <select
                          value={selectedOrgId ?? ''}
                          onChange={(event) => setSelectedOrgId(event.target.value)}
                          aria-label={t('users.stats.organizationLabel')}
                          className="h-10 max-w-[220px] rounded-2xl border px-3 text-sm font-semibold focus:outline-none focus:ring-2"
                          style={{
                            backgroundColor: theme.inputBg,
                            borderColor: theme.borderColor,
                            color: theme.textColor,
                          }}
                        >
                          {organizations.map((org) => (
                            <option key={org.id} value={org.id}>
                              {org.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : organizations.length === 1 ? (
                      <span
                        className="inline-flex h-10 items-center rounded-2xl border px-3 text-sm font-semibold"
                        style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor, color: theme.textColor }}
                      >
                        {organizations[0].name}
                      </span>
                    ) : null}
                    <button
                      type="button"
                      onClick={onClose}
                      aria-label={t('users.stats.close')}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border transition-all"
                      style={{
                        backgroundColor: theme.inputBg,
                        borderColor: theme.borderColor,
                        color: theme.textColor,
                      }}
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6">
                  {orgsLoading ? (
                    <div className="flex min-h-[360px] items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin" style={{ color: theme.subtextColor }} />
                    </div>
                  ) : selectedOrgId ? (
                    <BusinessUserAnalyticsPageClient
                      embedded
                      showBackButton={false}
                      apiBasePath={`/api/admin/users/${user.id}/analytics`}
                      organizationId={selectedOrgId}
                      pdfExport={{ userLabel: displayName, organizationLabel: selectedOrgLabel }}
                    />
                  ) : (
                    <div
                      className="flex min-h-[360px] items-center justify-center text-sm"
                      style={{ color: theme.subtextColor }}
                    >
                      {t('users.stats.noOrganizations')}
                    </div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
