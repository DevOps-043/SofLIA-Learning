'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
  Monitor,
  Pencil,
  Play,
  User,
  Video,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import type { ReportProblemMetadata } from '../../../core/reporting/report-problem.contract'
import { SessionPlayer } from '../../../core/components/SessionPlayer/SessionPlayer'
import { SessionRecordingLoader } from '../../../core/components/SessionPlayer/SessionRecordingLoader'
import type { RecordingSession } from '../../../lib/rrweb/session-recorder'
import { AdminReporte } from '../services/adminReportes.service'
import { useAdminTheme } from '../hooks/useAdminTheme'
import {
  AdminButton,
  AdminStatusBadge,
  AdminSurface,
  AdminModalShell,
} from './ui'

interface ViewReporteModalProps {
  reporte: AdminReporte
  isOpen: boolean
  onClose: () => void
  onEdit: () => void
}

type BadgeTone = 'accent' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'

function getEstadoTone(estado: string | null | undefined): BadgeTone {
  switch (estado) {
    case 'pendiente':
      return 'warning'
    case 'en_revision':
    case 'en_progreso':
      return 'info'
    case 'resuelto':
      return 'success'
    case 'rechazado':
    case 'duplicado':
      return 'danger'
    default:
      return 'neutral'
  }
}

function getPrioridadTone(prioridad: string | null | undefined): BadgeTone {
  switch (prioridad) {
    case 'critica':
      return 'danger'
    case 'alta':
    case 'media':
      return 'warning'
    case 'baja':
      return 'info'
    default:
      return 'neutral'
  }
}

function getEstadoKey(estado: string | null | undefined) {
  switch (estado) {
    case 'pendiente':
      return 'pending'
    case 'en_revision':
      return 'inReview'
    case 'en_progreso':
      return 'inProgress'
    case 'resuelto':
      return 'resolved'
    case 'rechazado':
      return 'rejected'
    case 'duplicado':
      return 'duplicated'
    default:
      return 'unknown'
  }
}

function getPrioridadKey(prioridad: string | null | undefined) {
  switch (prioridad) {
    case 'critica':
      return 'critical'
    case 'alta':
      return 'high'
    case 'media':
      return 'medium'
    case 'baja':
      return 'low'
    default:
      return 'unknown'
  }
}

function getCategoriaKey(categoria: string) {
  switch (categoria) {
    case 'bug':
      return 'bug'
    case 'sugerencia':
      return 'suggestion'
    case 'contenido':
      return 'content'
    case 'performance':
      return 'performance'
    case 'ui-ux':
      return 'uiux'
    default:
      return 'other'
  }
}

function formatReporteDate(
  dateValue: string | null | undefined,
  fallback: string,
  options?: Intl.DateTimeFormatOptions,
) {
  if (!dateValue) {
    return fallback
  }

  return new Date(dateValue).toLocaleString([], options)
}

export function ViewReporteModal({ reporte, isOpen, onClose, onEdit }: ViewReporteModalProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminTheme()
  const [showPlayer, setShowPlayer] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const reportMetadata = useMemo<Partial<ReportProblemMetadata> | null>(() => {
    if (!reporte.metadata || typeof reporte.metadata !== 'object') {
      return null
    }

    return reporte.metadata as Partial<ReportProblemMetadata>
  }, [reporte.metadata])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const isRecordingUrl = useMemo(() => {
    if (!reporte.session_recording) {
      return false
    }

    return (
      reporte.session_recording.startsWith('http://') ||
      reporte.session_recording.startsWith('https://')
    )
  }, [reporte.session_recording])

  const session = useMemo<RecordingSession | null>(() => {
    if (!reporte.session_recording || isRecordingUrl) {
      return null
    }

    try {
      const binaryString = atob(reporte.session_recording)
      const bytes = new Uint8Array(binaryString.length)
      for (let index = 0; index < binaryString.length; index += 1) {
        bytes[index] = binaryString.charCodeAt(index)
      }

      return JSON.parse(new TextDecoder('utf-8').decode(bytes)) as RecordingSession
    } catch (error) {
      console.error('Error parsing report session recording:', error)
      return null
    }
  }, [reporte.session_recording, isRecordingUrl])

  const hasRecording = Boolean(reporte.session_recording)
  const notAvailable = t('reportsPage.modal.notAvailable')
  const statusLabel = t(`reportsPage.status.${getEstadoKey(reporte.estado)}`)
  const priorityLabel = t(`reportsPage.priorities.${getPrioridadKey(reporte.prioridad)}`)
  const categoryLabel = t(`reportsPage.categories.${getCategoriaKey(reporte.categoria)}`)

  return (
    <AdminModalShell
      isOpen={isOpen}
      onClose={onClose}
      icon={AlertTriangle}
      title={reporte.titulo}
      description={t('reportsPage.modal.reportId', { id: reporte.id.slice(0, 8) })}
      className="max-w-6xl"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <AdminButton onClick={onClose} variant="secondary">
            {t('reportsPage.modal.close')}
          </AdminButton>
          <AdminButton onClick={onEdit} icon={Pencil}>
            {t('reportsPage.modal.manageReport')}
          </AdminButton>
        </div>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <AdminSurface className="p-4">
            <div className="flex items-center gap-3">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                style={{ backgroundColor: theme.actionSurface, color: theme.action }}
              >
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: theme.textMuted }}>
                  {t('reportsPage.modal.category')}
                </p>
                <p className="truncate text-sm font-bold" style={{ color: theme.text }}>
                  {categoryLabel}
                </p>
              </div>
            </div>
          </AdminSurface>

          <AdminSurface className="space-y-4 p-4">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: theme.textMuted }}>
                {t('reportsPage.modal.status')}
              </p>
              <AdminStatusBadge className="w-full justify-center" tone={getEstadoTone(reporte.estado)}>
                <CheckCircle2 className="h-3.5 w-3.5" />
                {statusLabel}
              </AdminStatusBadge>
            </div>

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: theme.textMuted }}>
                {t('reportsPage.modal.priority')}
              </p>
              <AdminStatusBadge className="w-full justify-center" tone={getPrioridadTone(reporte.prioridad)}>
                {priorityLabel}
              </AdminStatusBadge>
            </div>
          </AdminSurface>

          {reporte.usuario ? (
            <AdminSurface className="p-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: theme.textMuted }}>
                {t('reportsPage.modal.reportedBy')}
              </p>
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                  style={{ backgroundColor: theme.action, color: theme.onAction }}
                >
                  {(reporte.usuario.display_name || reporte.usuario.username).charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold" style={{ color: theme.text }}>
                    {reporte.usuario.display_name || reporte.usuario.username}
                  </p>
                  <p className="truncate text-xs" style={{ color: theme.textMuted }}>
                    {reporte.usuario.email || notAvailable}
                  </p>
                </div>
              </div>
            </AdminSurface>
          ) : null}

          <AdminSurface className="space-y-3 p-4 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2" style={{ color: theme.textMuted }}>
                <Calendar className="h-4 w-4" />
                {t('reportsPage.modal.created')}
              </span>
              <span className="font-semibold" style={{ color: theme.text }}>
                {formatReporteDate(reporte.created_at, notAvailable, {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                })}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span style={{ color: theme.textMuted }}>{t('reportsPage.modal.time')}</span>
              <span className="font-semibold" style={{ color: theme.text }}>
                {formatReporteDate(reporte.created_at, notAvailable, {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </AdminSurface>
        </aside>

        <div className="min-w-0 space-y-5">
          <AdminSurface className="p-5">
            <SectionTitle icon={FileText} title={t('reportsPage.modal.description')} />
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6" style={{ color: theme.text }}>
              {reporte.descripcion}
            </p>
          </AdminSurface>

          {(reporte.pasos_reproducir || reporte.comportamiento_esperado) ? (
            <div className="grid gap-5 lg:grid-cols-2">
              {reporte.pasos_reproducir ? (
                <AdminSurface className="p-5">
                  <SectionTitle icon={AlertTriangle} title={t('reportsPage.modal.steps')} />
                  <p className="mt-3 whitespace-pre-wrap font-mono text-sm leading-6" style={{ color: theme.text }}>
                    {reporte.pasos_reproducir}
                  </p>
                </AdminSurface>
              ) : null}
              {reporte.comportamiento_esperado ? (
                <AdminSurface className="p-5">
                  <SectionTitle icon={CheckCircle2} title={t('reportsPage.modal.expectedBehavior')} />
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6" style={{ color: theme.text }}>
                    {reporte.comportamiento_esperado}
                  </p>
                </AdminSurface>
              ) : null}
            </div>
          ) : null}

          <AdminSurface className="overflow-hidden">
            <div className="border-b px-5 py-4" style={{ borderColor: theme.divider }}>
              <SectionTitle icon={Monitor} title={t('reportsPage.modal.technicalContext')} />
            </div>
            <div className="grid divide-y md:grid-cols-3 md:divide-x md:divide-y-0" style={{ borderColor: theme.divider }}>
              {reporte.pagina_url ? (
                <TechnicalItem label={t('reportsPage.modal.url')} icon={LinkIcon}>
                  <a
                    href={reporte.pagina_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-w-0 items-center gap-1 break-all text-sm font-semibold hover:underline"
                    style={{ color: theme.action }}
                  >
                    {safePathname(reporte.pagina_url)}
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  </a>
                </TechnicalItem>
              ) : null}
              {reporte.navegador ? (
                <TechnicalItem label={t('reportsPage.modal.browser')} icon={Monitor}>
                  {reporte.navegador}
                </TechnicalItem>
              ) : null}
              {reporte.screen_resolution ? (
                <TechnicalItem label={t('reportsPage.modal.resolution')} icon={Monitor}>
                  {reporte.screen_resolution}
                </TechnicalItem>
              ) : null}
            </div>
          </AdminSurface>

          {reportMetadata?.source || reportMetadata?.courseContext || reportMetadata?.irisSync ? (
            <AdminSurface className="p-5">
              <SectionTitle icon={User} title={t('reportsPage.modal.operationalContext')} />
              <div className="mt-4 grid gap-3 lg:grid-cols-3">
                {reportMetadata?.source ? (
                  <InfoCard label={t('reportsPage.modal.source')} value={reportMetadata.source} />
                ) : null}
                {reportMetadata?.courseContext ? (
                  <InfoCard
                    label={t('reportsPage.modal.courseLesson')}
                    value={reportMetadata.courseContext.courseTitle || t('reportsPage.modal.unknownCourse')}
                    detail={reportMetadata.courseContext.lessonTitle || t('reportsPage.modal.unknownLesson')}
                  />
                ) : null}
                {reportMetadata?.irisSync ? (
                  <InfoCard
                    label={t('reportsPage.modal.irisSync')}
                    value={reportMetadata.irisSync.status}
                    detail={reportMetadata.irisSync.externalIssueId || t('reportsPage.modal.noExternalIssue')}
                  />
                ) : null}
              </div>
            </AdminSurface>
          ) : null}

          {(reporte.screenshot_url || hasRecording) ? (
            <AdminSurface className="p-5">
              <SectionTitle icon={ImageIcon} title={t('reportsPage.modal.evidence')} />
              <div className="mt-4 space-y-4">
                {reporte.screenshot_url ? (
                  <div
                    className="overflow-hidden rounded-2xl border"
                    style={{ backgroundColor: theme.surfaceSubtle, borderColor: theme.border }}
                  >
                    <img
                      src={reporte.screenshot_url}
                      alt={t('reportsPage.modal.screenshotAlt')}
                      className="mx-auto max-h-[320px] w-full object-contain"
                    />
                    <div className="border-t p-3" style={{ borderColor: theme.divider }}>
                      <a
                        href={reporte.screenshot_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-semibold hover:underline"
                        style={{ color: theme.action }}
                      >
                        <ExternalLink className="h-4 w-4" />
                        {t('reportsPage.modal.viewOriginalImage')}
                      </a>
                    </div>
                  </div>
                ) : null}

                {hasRecording ? (
                  <div
                    className="rounded-2xl border p-4 text-center"
                    style={{ backgroundColor: theme.surfaceSubtle, borderColor: theme.border }}
                  >
                    {showPlayer && isMounted ? (
                      <div className="overflow-hidden rounded-xl border" style={{ borderColor: theme.border }}>
                        {isRecordingUrl ? (
                          <SessionRecordingLoader
                            key={`url-player-${reporte.id}`}
                            recordingUrl={reporte.session_recording!}
                            width="100%"
                            height="400px"
                            autoPlay={false}
                            showController
                            skipInactive
                            speed={1}
                          />
                        ) : session ? (
                          <SessionPlayer
                            key={`player-${reporte.id}-${showPlayer}`}
                            session={session}
                            width="100%"
                            height="400px"
                            autoPlay={false}
                            showController
                            skipInactive
                            speed={1}
                          />
                        ) : (
                          <p className="p-8 text-sm" style={{ color: theme.textMuted }}>
                            {t('reportsPage.modal.recordingLoadError')}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center py-4">
                        <div
                          className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                          style={{ backgroundColor: theme.actionSurface, color: theme.action }}
                        >
                          <Video className="h-7 w-7" />
                        </div>
                        <h3 className="text-lg font-bold" style={{ color: theme.text }}>
                          {t('reportsPage.modal.recordingAvailable')}
                        </h3>
                        <p className="mt-2 max-w-lg text-sm leading-6" style={{ color: theme.textMuted }}>
                          {t('reportsPage.modal.recordingDescription')}
                        </p>
                        <AdminButton className="mt-4" icon={Play} onClick={() => setShowPlayer(true)}>
                          {t('reportsPage.modal.playRecording')}
                        </AdminButton>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </AdminSurface>
          ) : null}

          {reporte.notas_admin ? (
            <AdminSurface className="p-5">
              <SectionTitle icon={Pencil} title={t('reportsPage.modal.adminNotes')} />
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6" style={{ color: theme.text }}>
                {reporte.notas_admin}
              </p>
            </AdminSurface>
          ) : null}
        </div>
      </div>
    </AdminModalShell>
  )
}

function safePathname(url: string) {
  try {
    return new URL(url).pathname
  } catch {
    return url
  }
}

function SectionTitle({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  const theme = useAdminTheme()

  return (
    <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest" style={{ color: theme.text }}>
      <span
        className="flex h-8 w-8 items-center justify-center rounded-xl"
        style={{ backgroundColor: theme.actionSurface, color: theme.action }}
      >
        <Icon className="h-4 w-4" />
      </span>
      {title}
    </h3>
  )
}

function TechnicalItem({
  children,
  icon: Icon,
  label,
}: {
  children: ReactNode
  icon: LucideIcon
  label: string
}) {
  const theme = useAdminTheme()

  return (
    <div className="min-w-0 p-4">
      <p className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest" style={{ color: theme.textMuted }}>
        <Icon className="h-3.5 w-3.5" />
        {label}
      </p>
      <div className="break-words text-sm font-semibold" style={{ color: theme.text }}>
        {children}
      </div>
    </div>
  )
}

function InfoCard({
  detail,
  label,
  value,
}: {
  detail?: ReactNode
  label: string
  value: ReactNode
}) {
  const theme = useAdminTheme()

  return (
    <div className="min-w-0 rounded-2xl border p-4" style={{ backgroundColor: theme.surfaceSubtle, borderColor: theme.border }}>
      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: theme.textMuted }}>
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-bold" style={{ color: theme.text }}>
        {value}
      </p>
      {detail ? (
        <p className="mt-1 break-words text-xs" style={{ color: theme.textMuted }}>
          {detail}
        </p>
      ) : null}
    </div>
  )
}
