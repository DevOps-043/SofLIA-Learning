'use client'

import { motion } from 'framer-motion'
import { Loader2, UserPlus } from 'lucide-react'

import { JoinRequestCard } from './JoinRequestCard'
import { JoinRequestListRow } from './JoinRequestListRow'
import { ManagementTabEmptyState } from './ManagementTabEmptyState'
import type { BusinessUsersPageLogic, BusinessUsersTheme } from './users-page.types'

interface JoinRequestsPanelProps {
  logic: BusinessUsersPageLogic
  theme: BusinessUsersTheme
}

export function JoinRequestsPanel({ logic, theme }: JoinRequestsPanelProps) {
  if (logic.isJoinRequestsLoading) {
    return (
      <div key="loading-requests" className="rounded-3xl border p-12 text-center" style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}>
        <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin" style={{ color: theme.actionColor }} />
        <p style={{ color: theme.subtextColor }}>Cargando solicitudes...</p>
      </div>
    )
  }

  if (logic.joinRequestsError) {
    return (
      <div
        key="error-requests"
        className="rounded-3xl border p-6"
        style={{
          backgroundColor: `${theme.dangerColor}10`,
          borderColor: `${theme.dangerColor}20`,
          color: theme.dangerColor,
        }}
      >
        {logic.joinRequestsError}
      </div>
    )
  }

  if (logic.filteredJoinRequests.length === 0) {
    return (
      <ManagementTabEmptyState
        key="empty-requests"
        theme={theme}
        icon={<UserPlus className="h-16 w-16" />}
        title="No hay solicitudes pendientes"
        description="Las solicitudes para unirse a la organizacion apareceran aqui."
      />
    )
  }

  if (logic.viewMode === 'cards') {
    return (
      <motion.div key="grid-requests" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {logic.filteredJoinRequests.map((request, index) => (
          <JoinRequestCard key={request.id} request={request} index={index} isReviewing={logic.reviewingId === request.id} onApprove={() => logic.reviewJoinRequest(request.id, 'approve')} onReject={() => logic.reviewJoinRequest(request.id, 'reject')} />
        ))}
      </motion.div>
    )
  }

  return (
    <motion.div key="list-requests" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
      <div className="hidden grid-cols-5 gap-4 px-4 py-2 text-xs font-medium uppercase tracking-wider opacity-50 lg:grid">
        <div className="col-span-2">Solicitud</div>
        <div>Mensaje</div>
        <div>Estado</div>
        <div className="text-right">Acciones</div>
      </div>
      {logic.filteredJoinRequests.map((request, index) => (
        <JoinRequestListRow key={request.id} request={request} index={index} isReviewing={logic.reviewingId === request.id} onApprove={() => logic.reviewJoinRequest(request.id, 'approve')} onReject={() => logic.reviewJoinRequest(request.id, 'reject')} />
      ))}
    </motion.div>
  )
}
