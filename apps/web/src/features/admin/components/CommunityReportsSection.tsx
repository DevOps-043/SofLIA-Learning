'use client'

import { useEffect, useState } from 'react'
import { Clock, Eye, Filter, Flag, Loader2, XCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../hooks/useAdminPanelTheme'
import {
  PostReportsService,
  type PostReport,
  type ReportStatus,
  type ResolutionAction,
} from '@/features/communities/services/postReports.service'

interface CommunityReportsSectionProps {
  communitySlug: string
}

const statusOptions: Array<{ value: ReportStatus | 'all'; labelKey: string }> = [
  { value: 'all', labelKey: 'communityDetail.reports.statusFilter.all' },
  { value: 'pending', labelKey: 'communityDetail.reports.status.pending' },
  { value: 'reviewed', labelKey: 'communityDetail.reports.status.reviewed' },
  { value: 'resolved', labelKey: 'communityDetail.reports.status.resolved' },
  { value: 'ignored', labelKey: 'communityDetail.reports.status.ignored' },
]

const reasonLabelKeys: Record<string, string> = {
  harassment: 'communityDetail.reports.reasons.harassment',
  inappropriate: 'communityDetail.reports.reasons.inappropriate',
  misinformation: 'communityDetail.reports.reasons.misinformation',
  other: 'communityDetail.reports.reasons.other',
  spam: 'communityDetail.reports.reasons.spam',
  violence: 'communityDetail.reports.reasons.violence',
}

function getUserName(
  user:
    | {
        email?: string | null
        first_name?: string | null
        last_name?: string | null
        username?: string | null
      }
    | null
    | undefined,
  fallback: string,
) {
  if (!user) {
    return fallback
  }

  return (
    `${user.first_name || ''} ${user.last_name || ''}`.trim() ||
    user.username ||
    user.email ||
    fallback
  )
}

function getPostPreview(content: string, fallback: string) {
  if (!content) {
    return fallback
  }

  return content.length > 100 ? `${content.substring(0, 100)}...` : content
}

export function CommunityReportsSection({
  communitySlug,
}: CommunityReportsSectionProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminPanelTheme()
  const [reports, setReports] = useState<PostReport[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<ReportStatus | 'all'>('all')
  const [isResolving, setIsResolving] = useState(false)
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    offset: 0,
    hasMore: false,
  })

  const fetchReports = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await PostReportsService.getAdminReports(communitySlug, {
        limit: pagination.limit,
        offset: pagination.offset,
        status: selectedStatus === 'all' ? undefined : selectedStatus,
      })

      if (result.success) {
        setReports(result.reports)
        setPagination(result.pagination)
      } else {
        setError(t('communityDetail.reports.errors.loading'))
      }
    } catch {
      setError(t('communityDetail.reports.errors.connection'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void fetchReports()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus, communitySlug])

  const handleResolveReport = async (
    reportId: string,
    status: 'reviewed' | 'resolved' | 'ignored',
    resolutionAction?: ResolutionAction,
    resolutionNotes?: string,
  ) => {
    setIsResolving(true)
    try {
      const result = await PostReportsService.resolveReport(communitySlug, reportId, {
        resolution_action: resolutionAction,
        resolution_notes: resolutionNotes,
        status,
      })

      if (result.success) {
        setReports((prev) =>
          prev.map((report) => (report.id === reportId ? result.report! : report)),
        )
      } else {
        setError(result.error || t('communityDetail.reports.errors.resolving'))
      }
    } catch {
      setError(t('communityDetail.reports.errors.connection'))
    } finally {
      setIsResolving(false)
    }
  }

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleString(undefined, {
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      month: 'short',
      year: 'numeric',
    })

  const getStatusConfig = (status: ReportStatus) => {
    if (status === 'resolved') {
      return {
        bg: `${theme.successColor}14`,
        border: `${theme.successColor}26`,
        color: theme.successColor,
      }
    }

    if (status === 'reviewed') {
      return {
        bg: `${theme.secondaryColor}14`,
        border: `${theme.secondaryColor}26`,
        color: theme.secondaryColor,
      }
    }

    if (status === 'ignored') {
      return {
        bg: theme.inputBg,
        border: theme.borderColor,
        color: theme.subtextColor,
      }
    }

    return {
      bg: `${theme.warningColor}14`,
      border: `${theme.warningColor}26`,
      color: theme.warningColor,
    }
  }

  if (isLoading && reports.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2
          className="h-8 w-8 animate-spin"
          style={{ color: theme.primaryColor }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-bold" style={{ color: theme.textColor }}>
          {t('communityDetail.reports.title')}
        </h3>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" style={{ color: theme.subtextColor }} />
          <select
            className="rounded-xl border px-3 py-2 text-sm outline-none"
            onChange={(event) =>
              setSelectedStatus(event.target.value as ReportStatus | 'all')
            }
            style={{
              backgroundColor: theme.inputBg,
              borderColor: theme.borderColor,
              color: theme.textColor,
            }}
            value={selectedStatus}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.labelKey)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <div
          className="rounded-xl border p-4"
          style={{
            backgroundColor: `${theme.dangerColor}14`,
            borderColor: `${theme.dangerColor}26`,
          }}
        >
          <p className="text-sm" style={{ color: theme.dangerColor }}>
            {error}
          </p>
        </div>
      ) : null}

      {reports.length === 0 ? (
        <div className="py-12 text-center">
          <Flag
            className="mx-auto mb-4 h-12 w-12"
            style={{ color: theme.subtextColor }}
          />
          <p className="text-sm" style={{ color: theme.subtextColor }}>
            {selectedStatus === 'all'
              ? t('communityDetail.reports.emptyAll')
              : t('communityDetail.reports.emptyStatus', {
                  status: t(`communityDetail.reports.status.${selectedStatus}`),
                })}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => {
            const statusConfig = getStatusConfig(report.status)
            const reporterName = getUserName(
              report.reported_by,
              t('communityDetail.reports.unknownUser'),
            )
            const reviewerName = getUserName(
              report.reviewed_by,
              t('communityDetail.reports.unknownUser'),
            )

            return (
              <div
                className="rounded-2xl border p-4 transition-shadow"
                key={report.id}
                style={{
                  backgroundColor: theme.inputBg,
                  borderColor: theme.borderColor,
                }}
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span
                        className="inline-flex rounded-full border px-2 py-1 text-xs font-semibold"
                        style={{
                          backgroundColor: statusConfig.bg,
                          borderColor: statusConfig.border,
                          color: statusConfig.color,
                        }}
                      >
                        {t(`communityDetail.reports.status.${report.status}`)}
                      </span>
                      <span className="text-xs" style={{ color: theme.subtextColor }}>
                        {t(reasonLabelKeys[report.reason_category] || reasonLabelKeys.other)}
                      </span>
                    </div>

                    {report.post ? (
                      <div className="mb-3">
                        <p
                          className="mb-1 text-sm font-semibold"
                          style={{ color: theme.textColor }}
                        >
                          {t('communityDetail.reports.reportedPost')}
                        </p>
                        <p
                          className="text-sm italic"
                          style={{ color: theme.subtextColor }}
                        >
                          "{getPostPreview(
                            report.post.content || '',
                            t('communityDetail.reports.noContent'),
                          )}"
                        </p>
                      </div>
                    ) : null}

                    <div
                      className="mb-3 grid grid-cols-1 gap-4 text-sm md:grid-cols-2 xl:grid-cols-4"
                      style={{ color: theme.subtextColor }}
                    >
                      <div>
                        <span className="font-semibold">
                          {t('communityDetail.reports.reportedBy')}
                        </span>
                        <p style={{ color: theme.textColor }}>{reporterName}</p>
                      </div>
                      <div>
                        <span className="font-semibold">
                          {t('communityDetail.reports.date')}
                        </span>
                        <p style={{ color: theme.textColor }}>
                          {formatDate(report.created_at)}
                        </p>
                      </div>
                      {report.reviewed_by ? (
                        <div>
                          <span className="font-semibold">
                            {t('communityDetail.reports.reviewedBy')}
                          </span>
                          <p style={{ color: theme.textColor }}>{reviewerName}</p>
                        </div>
                      ) : null}
                      {report.reviewed_at ? (
                        <div>
                          <span className="font-semibold">
                            {t('communityDetail.reports.reviewDate')}
                          </span>
                          <p style={{ color: theme.textColor }}>
                            {formatDate(report.reviewed_at)}
                          </p>
                        </div>
                      ) : null}
                    </div>

                    {report.reason_details ? (
                      <div className="mb-3">
                        <p
                          className="mb-1 text-sm font-semibold"
                          style={{ color: theme.textColor }}
                        >
                          {t('communityDetail.reports.details')}
                        </p>
                        <p className="text-sm" style={{ color: theme.subtextColor }}>
                          {report.reason_details}
                        </p>
                      </div>
                    ) : null}

                    {report.resolution_notes ? (
                      <div className="mb-3">
                        <p
                          className="mb-1 text-sm font-semibold"
                          style={{ color: theme.textColor }}
                        >
                          {t('communityDetail.reports.resolutionNotes')}
                        </p>
                        <p className="text-sm" style={{ color: theme.subtextColor }}>
                          {report.resolution_notes}
                        </p>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2 xl:ml-4 xl:flex-col">
                    {report.status === 'pending' ? (
                      <>
                        <button
                          className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={isResolving}
                          onClick={() =>
                            handleResolveReport(
                              report.id,
                              'resolved',
                              'delete_post',
                              t('communityDetail.reports.notes.deleted'),
                            )
                          }
                          style={{
                            backgroundColor: theme.dangerColor,
                            color: theme.inverseTextColor,
                          }}
                          type="button"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          {t('communityDetail.reports.actions.deletePost')}
                        </button>
                        <button
                          className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={isResolving}
                          onClick={() =>
                            handleResolveReport(
                              report.id,
                              'resolved',
                              'hide_post',
                              t('communityDetail.reports.notes.hidden'),
                            )
                          }
                          style={{
                            backgroundColor: theme.warningColor,
                            color: theme.inverseTextColor,
                          }}
                          type="button"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          {t('communityDetail.reports.actions.hidePost')}
                        </button>
                        <button
                          className="flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={isResolving}
                          onClick={() =>
                            handleResolveReport(
                              report.id,
                              'ignored',
                              'ignore_report',
                            )
                          }
                          style={{
                            backgroundColor: theme.cardBg,
                            borderColor: theme.borderColor,
                            color: theme.subtextColor,
                          }}
                          type="button"
                        >
                          <Clock className="h-3.5 w-3.5" />
                          {t('communityDetail.reports.actions.ignore')}
                        </button>
                      </>
                    ) : (
                      <span className="text-xs" style={{ color: theme.subtextColor }}>
                        {report.resolution_action
                          ? t(
                              `communityDetail.reports.resolutionActions.${report.resolution_action}`,
                            )
                          : t('communityDetail.reports.resolutionActions.none')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {pagination.hasMore ? (
        <div className="pt-4 text-center">
          <button
            className="rounded-xl border px-4 py-2 text-sm font-semibold"
            onClick={() => {
              setPagination((prev) => ({
                ...prev,
                offset: prev.offset + prev.limit,
              }))
              void fetchReports()
            }}
            style={{
              backgroundColor: theme.cardBg,
              borderColor: theme.borderColor,
              color: theme.subtextColor,
            }}
            type="button"
          >
            {t('communityDetail.reports.loadMore')}
          </button>
        </div>
      ) : null}
    </div>
  )
}
