'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserIcon,
  UsersIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'

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

export function AdminAccessRequestsPage() {
  const { t } = useTranslation('admin')
  const [requests, setRequests] = useState<AccessRequest[]>([])
  const [stats, setStats] = useState<Stats>({
    totalPending: 0,
    totalApproved: 0,
    totalRejected: 0,
    totalRequests: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [processingId, setProcessingId] = useState<string | null>(null)

  // Cargar solicitudes
  const fetchRequests = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/communities/access-requests')

      if (!response.ok) {
        throw new Error('Error al cargar solicitudes')
      }

      const data = await response.json()
      setRequests(data.requests || [])
      setStats(data.stats || stats)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  // Aprobar solicitud
  const handleApprove = async (requestId: string, communityId: string) => {
    try {
      setProcessingId(requestId)
      const response = await fetch(
        `/api/admin/communities/${communityId}/access-requests/${requestId}/approve`,
        { method: 'POST' }
      )

      if (!response.ok) {
        throw new Error('Error al aprobar solicitud')
      }

      // Actualizar lista
      await fetchRequests()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al aprobar solicitud')
    } finally {
      setProcessingId(null)
    }
  }

  // Rechazar solicitud
  const handleReject = async (requestId: string, communityId: string) => {
    try {
      setProcessingId(requestId)
      const response = await fetch(
        `/api/admin/communities/${communityId}/access-requests/${requestId}/reject`,
        { method: 'POST' }
      )

      if (!response.ok) {
        throw new Error('Error al rechazar solicitud')
      }

      // Actualizar lista
      await fetchRequests()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al rechazar solicitud')
    } finally {
      setProcessingId(null)
    }
  }

  // Filtrar solicitudes
  const filteredRequests = requests.filter(request => {
    const matchesSearch =
      request.requester.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requester.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.community.name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || request.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente'
      case 'approved': return 'Aprobada'
      case 'rejected': return 'Rechazada'
      default: return status
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando solicitudes...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-800 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Error: {error}</p>
          <button
            onClick={fetchRequests}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-800">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Solicitudes de Acceso</h1>
              <p className="text-gray-400">Gestiona las solicitudes de acceso a comunidades privadas</p>
            </div>
            <button
              onClick={fetchRequests}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Actualizar
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-600/20 rounded-lg">
                <ClockIcon className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Pendientes</p>
                <p className="text-2xl font-bold text-white">{stats.totalPending}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center">
              <div className="p-3 bg-green-600/20 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Aprobadas</p>
                <p className="text-2xl font-bold text-white">{stats.totalApproved}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center">
              <div className="p-3 bg-red-600/20 rounded-lg">
                <XCircleIcon className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Rechazadas</p>
                <p className="text-2xl font-bold text-white">{stats.totalRejected}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center">
              <div className="p-3 bg-blue-600/20 rounded-lg">
                <UsersIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Total</p>
                <p className="text-2xl font-bold text-white">{stats.totalRequests}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-700 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('searchPlaceholders.accessRequests')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="relative">
              <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="all">Todos los estados</option>
                <option value="pending">Pendientes</option>
                <option value="approved">Aprobadas</option>
                <option value="rejected">Rechazadas</option>
              </select>
            </div>
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800 border-b border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Comunidad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Nota
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                <AnimatePresence>
                  {filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                        No se encontraron solicitudes
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map((request) => (
                      <motion.tr
                        key={request.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                              {request.requester.first_name?.charAt(0) || request.requester.username.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-white">
                                {request.requester.first_name && request.requester.last_name
                                  ? `${request.requester.first_name} ${request.requester.last_name}`
                                  : request.requester.username}
                              </div>
                              <div className="text-sm text-gray-400">{request.requester.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-white">{request.community.name}</div>
                          <div className="text-sm text-gray-400">/{request.community.slug}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-300 max-w-xs truncate">
                            {request.note || 'Sin nota'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(request.status)}`}>
                            {getStatusLabel(request.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          {new Date(request.created_at).toLocaleDateString('es-ES')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {request.status === 'pending' && (
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => handleApprove(request.id, request.community_id)}
                                disabled={processingId === request.id}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                              >
                                {processingId === request.id ? (
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <>
                                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                                    Aprobar
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => handleReject(request.id, request.community_id)}
                                disabled={processingId === request.id}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                              >
                                {processingId === request.id ? (
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <>
                                    <XCircleIcon className="h-4 w-4 mr-1" />
                                    Rechazar
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                          {request.status !== 'pending' && (
                            <span className="text-gray-500">
                              {request.reviewed_at
                                ? `Revisado ${new Date(request.reviewed_at).toLocaleDateString('es-ES')}`
                                : 'Procesado'}
                            </span>
                          )}
                        </td>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
