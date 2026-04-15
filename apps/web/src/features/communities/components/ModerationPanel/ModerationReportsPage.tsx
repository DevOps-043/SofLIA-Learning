'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Flag, Eye, CheckCircle, XCircle, Clock, Filter, Loader2, Shield } from 'lucide-react'
import { PostReportsService, PostReport, ReportStatus, ResolutionAction } from '../../services/postReports.service'

interface ModerationReportsPageProps {
  communitySlug: string
}

const STATUS_OPTIONS: Array<{ value: ReportStatus | 'all'; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'reviewed', label: 'Revisados' },
  { value: 'resolved', label: 'Resueltos' },
  { value: 'ignored', label: 'Ignorados' },
]

const REASON_LABELS: Record<string, string> = {
  spam: 'Spam',
  inappropriate: 'Contenido inapropiado',
  harassment: 'Acoso o bullying',
  misinformation: 'Desinformación',
  violence: 'Violencia',
  other: 'Otro',
}

const STATUS_LABELS: Record<ReportStatus, string> = {
  pending: 'Pendiente',
  reviewed: 'Revisado',
  resolved: 'Resuelto',
  ignored: 'Ignorado',
}

const STATUS_COLORS: Record<ReportStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-800',
  reviewed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-800',
  resolved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-800',
  ignored: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-gray-800',
}

export function ModerationReportsPage({ communitySlug }: ModerationReportsPageProps) {
  const router = useRouter()
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

      const result = await PostReportsService.getReports(communitySlug, {
        status: selectedStatus === 'all' ? undefined : selectedStatus,
        limit: pagination.limit,
        offset: pagination.offset,
      })

      if (result.success) {
        setReports(result.reports || [])
        setPagination(result.pagination || {
          total: 0,
          limit: pagination.limit,
          offset: pagination.offset,
          hasMore: false,
        })
      } else {
        console.error('❌ Reports fetch failed:', result)
        setError('Error al cargar reportes')
      }
    } catch (err) {
      console.error('❌ Error fetching reports:', err)
      setError('Error de conexión')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [selectedStatus, communitySlug])

  const handleResolveReport = async (
    reportId: string,
    status: 'reviewed' | 'resolved' | 'ignored',
    resolutionAction?: ResolutionAction,
    resolutionNotes?: string
  ) => {
    setIsResolving(true)
    try {

      const result = await PostReportsService.resolveReport(communitySlug, reportId, {
        status,
        resolution_action: resolutionAction,
        resolution_notes: resolutionNotes,
      })

      if (result.success && result.report) {
        // Actualizar el reporte en la lista
        setReports((prev) =>
          prev.map((r) => (r.id === reportId ? result.report! : r))
        )
        // Recargar para actualizar contadores y filtros
        await fetchReports()

      } else {
        console.error('❌ Resolve failed:', result.error)
        setError(result.error || 'Error al resolver el reporte')
      }
    } catch (err) {
      console.error('❌ Error resolving report:', err)
      setError('Error de conexión. Por favor intenta nuevamente.')
    } finally {
      setIsResolving(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getPostPreview = (content: string) => {
    if (!content) return 'Sin contenido'
    return content.length > 100 ? content.substring(0, 100) + '...' : content
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0F1419]">
      {/* Header */}
      <div className="bg-white dark:bg-[#1E2329] border-b border-gray-200 dark:border-[#0A2540]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push(`/communities/${communitySlug}`)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Panel de Moderación
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Gestiona los reportes de tu comunidad
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white dark:bg-[#1E2329] rounded-xl border border-gray-200 dark:border-[#0A2540]/30 p-6 mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Reportes de Posts
            </h2>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as ReportStatus | 'all')}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        {isLoading && reports.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
            <Flag className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              {selectedStatus === 'all'
                ? 'No hay reportes en esta comunidad'
                : `No hay reportes ${STATUS_LABELS[selectedStatus as ReportStatus].toLowerCase()}`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div
                key={report.id}
                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${STATUS_COLORS[report.status]}`}
                      >
                        {STATUS_LABELS[report.status]}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {REASON_LABELS[report.reason_category] || report.reason_category}
                      </span>
                    </div>

                    {report.post && (
                      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Post reportado:
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                          "{getPostPreview(report.post.content || '')}"
                        </p>
                        {report.post.author && (
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                            Por: {report.post.author.first_name && report.post.author.last_name
                              ? `${report.post.author.first_name} ${report.post.author.last_name}`
                              : report.post.author.username || report.post.author.email || 'Usuario desconocido'}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                      <div>
                        <span className="font-medium">Reportado por:</span>
                        <p className="text-gray-900 dark:text-white">
                          {report.reported_by?.first_name && report.reported_by?.last_name
                            ? `${report.reported_by.first_name} ${report.reported_by.last_name}`
                            : report.reported_by?.username || report.reported_by?.email || 'Usuario desconocido'}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium">Fecha:</span>
                        <p className="text-gray-900 dark:text-white">
                          {formatDate(report.created_at)}
                        </p>
                      </div>
                      {report.reviewed_by && (
                        <div>
                          <span className="font-medium">Revisado por:</span>
                          <p className="text-gray-900 dark:text-white">
                            {report.reviewed_by.first_name && report.reviewed_by.last_name
                              ? `${report.reviewed_by.first_name} ${report.reviewed_by.last_name}`
                              : report.reviewed_by.username || report.reviewed_by.email || 'Usuario desconocido'}
                          </p>
                        </div>
                      )}
                      {report.reviewed_at && (
                        <div>
                          <span className="font-medium">Fecha de revisión:</span>
                          <p className="text-gray-900 dark:text-white">
                            {formatDate(report.reviewed_at)}
                          </p>
                        </div>
                      )}
                    </div>

                    {report.reason_details && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Detalles del reporte:
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {report.reason_details}
                        </p>
                      </div>
                    )}

                    {report.resolution_notes && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Notas de resolución:
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {report.resolution_notes}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    {report.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleResolveReport(report.id, 'resolved', 'delete_post', 'Post eliminado por violar las normas')}
                          disabled={isResolving}
                          className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          <XCircle className="w-4 h-4" />
                          Eliminar Post
                        </button>
                        <button
                          onClick={() => handleResolveReport(report.id, 'resolved', 'hide_post', 'Post oculto por violar las normas')}
                          disabled={isResolving}
                          className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          Ocultar Post
                        </button>
                        <button
                          onClick={() => handleResolveReport(report.id, 'ignored', 'ignore_report')}
                          disabled={isResolving}
                          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          <Clock className="w-4 h-4" />
                          Ignorar
                        </button>
                      </>
                    )}
                    {report.status !== 'pending' && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 text-right">
                        {report.resolution_action === 'delete_post' && 'Post eliminado'}
                        {report.resolution_action === 'hide_post' && 'Post oculto'}
                        {report.resolution_action === 'ignore_report' && 'Reporte ignorado'}
                        {report.resolution_action === 'warn_user' && 'Usuario advertido'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {pagination.hasMore && (
          <div className="text-center pt-6">
            <button
              onClick={() => {
                setPagination((prev) => ({ ...prev, offset: prev.offset + prev.limit }))
                fetchReports()
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
            >
              Cargar más
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

