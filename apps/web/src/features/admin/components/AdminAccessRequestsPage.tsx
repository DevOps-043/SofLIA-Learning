'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  UsersIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'

import { useAdminTheme } from '../hooks'
import {
  AdminButton,
  AdminIconButton,
  AdminInput,
  AdminMetricCard,
  AdminPageShell,
  AdminSectionHeader,
  AdminSelect,
  AdminStatusBadge,
  AdminSurface,
  AdminTableContainer,
  AdminToolbar,
} from './ui'

interface AccessRequest {
  id: string
  community_id: string
  requester_id: string
  status: 'pending' | 'approved' | 'rejected'
  note?: string
  created_at: string
  reviewed_at?: string
  community: {
    name: string
    slug: string
  }
  requester: {
    username: string
    email: string
    first_name?: string
    last_name?: string
  }
}

interface Stats {
  totalPending: number
  totalApproved: number
  totalRejected: number
  totalRequests: number
}

const defaultStats: Stats = {
  totalPending: 0,
  totalApproved: 0,
  totalRejected: 0,
  totalRequests: 0,
}

const statusFilters = ['all', 'pending', 'approved', 'rejected']

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function getRequesterName(request: AccessRequest) {
  const fullName = `${request.requester.first_name || ''} ${request.requester.last_name || ''}`.trim()
  return fullName || request.requester.username
}

function getStatusTone(status: AccessRequest['status']) {
  if (status === 'pending') return 'warning' as const
  if (status === 'approved') return 'success' as const
  return 'danger' as const
}

export function AdminAccessRequestsPage() {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const theme = useAdminTheme()
  const [requests, setRequests] = useState<AccessRequest[]>([])
  const [stats, setStats] = useState<Stats>(defaultStats)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [processingId, setProcessingId] = useState<string | null>(null)

  const fetchRequests = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/communities/access-requests')

      if (!response.ok) {
        throw new Error(t('accessRequests.page.loadError'))
      }

      const data = await response.json()
      setRequests(data.requests || [])
      setStats(data.stats || defaultStats)
      setError(null)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t('accessRequests.page.unknownError'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleApprove = async (requestId: string, communityId: string) => {
    try {
      setProcessingId(requestId)
      const response = await fetch(`/api/admin/communities/${communityId}/access-requests/${requestId}/approve`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error(t('accessRequests.page.approveError'))
      }

      await fetchRequests()
    } catch (approveError) {
      setError(approveError instanceof Error ? approveError.message : t('accessRequests.page.approveError'))
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (requestId: string, communityId: string) => {
    try {
      setProcessingId(requestId)
      const response = await fetch(`/api/admin/communities/${communityId}/access-requests/${requestId}/reject`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error(t('accessRequests.page.rejectError'))
      }

      await fetchRequests()
    } catch (rejectError) {
      setError(rejectError instanceof Error ? rejectError.message : t('accessRequests.page.rejectError'))
    } finally {
      setProcessingId(null)
    }
  }

  const normalizedSearch = searchTerm.trim().toLowerCase()
  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      !normalizedSearch ||
      request.requester.username.toLowerCase().includes(normalizedSearch) ||
      request.requester.email.toLowerCase().includes(normalizedSearch) ||
      request.community.name.toLowerCase().includes(normalizedSearch)
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter

    return matchesSearch && matchesStatus
  })

  if (isLoading) {
    return (
      <AdminPageShell maxWidth="wide">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <ArrowPathIcon className="h-8 w-8 animate-spin" style={{ color: theme.action }} />
            <p className="text-sm font-medium" style={{ color: theme.textMuted }}>
              {t('accessRequests.page.loading')}
            </p>
          </div>
        </div>
      </AdminPageShell>
    )
  }

  if (error) {
    return (
      <AdminPageShell maxWidth="wide">
        <AdminSurface className="p-6 text-center">
          <p className="text-sm font-medium" style={{ color: theme.danger }}>
            {error}
          </p>
          <AdminButton className="mt-4" onClick={fetchRequests} icon={ArrowPathIcon}>
            {tc('actions.retry')}
          </AdminButton>
        </AdminSurface>
      </AdminPageShell>
    )
  }

  return (
    <AdminPageShell maxWidth="wide">
      <AdminSectionHeader
        size="page"
        title={t('accessRequests.page.title')}
        description={t('accessRequests.page.description')}
        actions={
          <AdminButton onClick={fetchRequests} icon={ArrowPathIcon} variant="secondary">
            {t('accessRequests.page.refresh')}
          </AdminButton>
        }
      />

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard icon={ClockIcon} label={t('accessRequests.page.stats.pending')} tone="warning" value={stats.totalPending} />
        <AdminMetricCard icon={CheckCircleIcon} label={t('accessRequests.page.stats.approved')} tone="primary" value={stats.totalApproved} />
        <AdminMetricCard icon={XCircleIcon} label={t('accessRequests.page.stats.rejected')} tone="danger" value={stats.totalRejected} />
        <AdminMetricCard icon={UsersIcon} label={t('accessRequests.page.stats.total')} tone="neutral" value={stats.totalRequests} />
      </div>

      <AdminToolbar>
        <div className="relative flex-1">
          <MagnifyingGlassIcon
            className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2"
            style={{ color: theme.textMuted }}
          />
          <AdminInput
            className="pl-10"
            placeholder={t('searchPlaceholders.accessRequests')}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
        <div className="relative w-full lg:w-64">
          <FunnelIcon
            className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2"
            style={{ color: theme.textMuted }}
          />
          <AdminSelect className="w-full pl-10" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            {statusFilters.map((status) => (
              <option key={status} value={status}>
                {t(`accessRequests.page.filters.${status}`)}
              </option>
            ))}
          </AdminSelect>
        </div>
      </AdminToolbar>

      <AdminTableContainer>
        <div className="overflow-auto">
          <table className="min-w-[980px] w-full text-left">
            <thead>
              <tr style={{ backgroundColor: theme.surfaceSubtle }}>
                {[
                  t('accessRequests.page.table.user'),
                  t('accessRequests.page.table.community'),
                  t('accessRequests.page.table.note'),
                  t('accessRequests.page.table.status'),
                  t('accessRequests.page.table.date'),
                  t('accessRequests.page.table.actions'),
                ].map((heading, index) => (
                  <th
                    key={heading}
                    className={`border-b px-4 py-3 text-xs font-bold uppercase tracking-wider ${index === 5 ? 'text-right' : 'text-left'}`}
                    style={{ borderColor: theme.divider, color: theme.textMuted }}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-sm" style={{ color: theme.textMuted }}>
                      {t('accessRequests.page.empty')}
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((request) => {
                    const requesterName = getRequesterName(request)

                    return (
                      <motion.tr
                        key={request.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        style={{ borderBottom: `1px solid ${theme.divider}` }}
                      >
                        <td className="px-4 py-4">
                          <div className="flex min-w-0 items-center gap-3">
                            <div
                              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                              style={{ backgroundColor: theme.primary, color: theme.inverseText }}
                            >
                              {requesterName.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold" style={{ color: theme.text }}>
                                {requesterName}
                              </p>
                              <p className="truncate text-xs" style={{ color: theme.textMuted }}>
                                {request.requester.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm font-semibold" style={{ color: theme.text }}>
                            {request.community.name}
                          </p>
                          <p className="text-xs" style={{ color: theme.textMuted }}>
                            /{request.community.slug}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="max-w-xs truncate text-sm" style={{ color: theme.textMuted }}>
                            {request.note || t('accessRequests.page.noNote')}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <AdminStatusBadge tone={getStatusTone(request.status)}>
                            {t(`accessRequests.page.status.${request.status}`)}
                          </AdminStatusBadge>
                        </td>
                        <td className="px-4 py-4 text-sm" style={{ color: theme.textMuted }}>
                          {formatDate(request.created_at)}
                        </td>
                        <td className="px-4 py-4">
                          {request.status === 'pending' ? (
                            <div className="flex items-center justify-end gap-2">
                              <AdminIconButton
                                icon={CheckCircleIcon}
                                label={t('accessRequests.page.actions.approve')}
                                disabled={processingId === request.id}
                                onClick={() => handleApprove(request.id, request.community_id)}
                              />
                              <AdminIconButton
                                icon={XCircleIcon}
                                label={t('accessRequests.page.actions.reject')}
                                disabled={processingId === request.id}
                                onClick={() => handleReject(request.id, request.community_id)}
                                tone="danger"
                              />
                            </div>
                          ) : (
                            <p className="text-right text-sm" style={{ color: theme.textMuted }}>
                              {request.reviewed_at
                                ? t('accessRequests.page.reviewedAt', { date: formatDate(request.reviewed_at) })
                                : t('accessRequests.page.processed')}
                            </p>
                          )}
                        </td>
                      </motion.tr>
                    )
                  })
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </AdminTableContainer>
    </AdminPageShell>
  )
}
