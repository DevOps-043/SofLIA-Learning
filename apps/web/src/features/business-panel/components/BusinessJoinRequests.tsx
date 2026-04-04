'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  UserPlus,
  Check,
  X,
  Loader2,
  Mail,
  Briefcase,
  MessageSquare,
  Clock,
  Users
} from 'lucide-react'
import { useJoinRequests } from '../hooks/useJoinRequests'
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext'

export function BusinessJoinRequests() {
  const { requests, count, isLoading, error, reviewRequest, reviewingId } = useJoinRequests()
  const { effectiveStyles } = useOrganizationStylesContext()
  const panelStyles = effectiveStyles?.panel

  const primaryColor = panelStyles?.accent_color || '#00D4B3'

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-center">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${primaryColor}20` }}
          >
            <UserPlus className="w-5 h-5" style={{ color: primaryColor }} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Solicitudes de Unión</h2>
            <p className="text-sm text-gray-400">{count} solicitudes pendientes</p>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {requests.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 rounded-2xl border border-white/5 bg-gray-800/30"
        >
          <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg font-medium mb-1">No hay solicitudes pendientes</p>
          <p className="text-gray-500 text-sm">Las solicitudes de nuevos miembros aparecerán aquí</p>
        </motion.div>
      )}

      {/* Requests list */}
      <AnimatePresence>
        {requests.map((request) => {
          const user = request.users
          const displayName = user
            ? [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username
            : 'Usuario'
          const initials = user
            ? (user.first_name?.[0] || user.email[0]).toUpperCase()
            : 'U'
          const isReviewing = reviewingId === request.id

          return (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-5 rounded-xl border border-white/5 bg-gray-800/50"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0"
                    style={{ backgroundColor: `${primaryColor}30` }}
                  >
                    {user?.avatar_url ? (
                      <img src={user.avatar_url} alt={displayName} className="w-full h-full rounded-xl object-cover" />
                    ) : (
                      <span style={{ color: primaryColor }}>{initials}</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="space-y-1.5">
                    <h3 className="text-white font-semibold">{displayName}</h3>

                    <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                      <Mail className="w-3.5 h-3.5" />
                      <span>{user?.email}</span>
                    </div>

                    {request.job_title && (
                      <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                        <Briefcase className="w-3.5 h-3.5" />
                        <span>{request.job_title}</span>
                      </div>
                    )}

                    {request.message && (
                      <div className="flex items-start gap-1.5 text-gray-400 text-sm mt-2">
                        <MessageSquare className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                        <span className="italic">&ldquo;{request.message}&rdquo;</span>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 text-gray-500 text-xs mt-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(request.created_at).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => reviewRequest(request.id, 'approve')}
                    disabled={isReviewing}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {isReviewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Aprobar
                  </button>
                  <button
                    onClick={() => reviewRequest(request.id, 'reject')}
                    disabled={isReviewing}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                    Rechazar
                  </button>
                </div>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
