'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Link2,
  Shield,
  Users,
  Calendar,
  Copy,
  Check,
  Trash2,
  Pause,
  Play,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  MoreVertical,
  Plus
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext'
import { useThemeStore } from '@/core/stores/themeStore'

interface BulkInviteLink {
  id: string
  token: string
  name: string | null
  max_uses: number
  current_uses: number
  role: string
  expires_at: string
  status: 'active' | 'paused' | 'expired' | 'exhausted'
  created_at: string
}

interface BusinessManageInviteLinksModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateNew: () => void
  organizationSlug?: string
}

export function BusinessManageInviteLinksModal({
  isOpen,
  onClose,
  onCreateNew,
  organizationSlug
}: BusinessManageInviteLinksModalProps) {
  const params = useParams()
  const orgSlug = organizationSlug || (params?.orgSlug as string)
  const { t } = useTranslation('business')
  const { styles } = useOrganizationStylesContext()
  const { resolvedTheme } = useThemeStore()
  const panelStyles = styles?.panel

  const isDark = resolvedTheme === 'dark'
  const textColor = isDark ? '#FFFFFF' : '#0F172A'
  const mutedText = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(15,23,42,0.6)'
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
  const inputBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'

  const primaryColor = panelStyles?.primary_button_color || '#0A2540'
  const accentColor = panelStyles?.accent_color || '#00D4B3'

  const [links, setLinks] = useState<BulkInviteLink[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close dropdown menu when clicking outside
  useEffect(() => {
    if (!openMenuId) return
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [openMenuId])

  const fetchLinks = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/${orgSlug}/business/invite-links`, {
        credentials: 'include'
      })
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || t('users.modals.manageLinks.errorLoad'))
      }

      setLinks(data.links || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : t('users.modals.manageLinks.errorLoad'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchLinks()
    }
  }, [isOpen])

  const getInviteUrl = (token: string) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    return `${baseUrl}/invite/${token}`
  }

  const handleCopy = async (link: BulkInviteLink) => {
    try {
      await navigator.clipboard.writeText(getInviteUrl(link.token))
      setCopiedId(link.id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleAction = async (linkId: string, action: 'pause' | 'resume' | 'delete') => {
    setActionLoading(linkId)
    setOpenMenuId(null)

    try {
      if (action === 'delete') {
        const response = await fetch(`/api/${orgSlug}/business/invite-links/${linkId}`, {
          method: 'DELETE',
          credentials: 'include'
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || t('users.modals.manageLinks.errorDelete'))
        }

        setLinks(prev => prev.filter(l => l.id !== linkId))
      } else {
        const response = await fetch(`/api/${orgSlug}/business/invite-links/${linkId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ action })
        })

        const data = await response.json()

        if (!response.ok || !data.success) {
          throw new Error(data.error || t('users.modals.manageLinks.errorUpdate'))
        }

        setLinks(prev => prev.map(l => l.id === linkId ? data.link : l))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('users.modals.manageLinks.errorOperation'))
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return {
          label: t('users.modals.manageLinks.status.active', 'Activo'),
          color: '#22C55E',
          bgColor: 'rgba(34, 197, 94, 0.1)',
          icon: CheckCircle
        }
      case 'paused':
        return {
          label: t('users.modals.manageLinks.status.paused', 'Pausado'),
          color: '#F59E0B',
          bgColor: 'rgba(245, 158, 11, 0.1)',
          icon: Pause
        }
      case 'expired':
        return {
          label: t('users.modals.manageLinks.status.expired', 'Expirado'),
          color: '#EF4444',
          bgColor: 'rgba(239, 68, 68, 0.1)',
          icon: Clock
        }
      case 'exhausted':
        return {
          label: t('users.modals.manageLinks.status.exhausted', 'Agotado'),
          color: '#6B7280',
          bgColor: 'rgba(107, 114, 128, 0.1)',
          icon: XCircle
        }
      default:
        return {
          label: status,
          color: mutedText,
          bgColor: inputBg,
          icon: AlertCircle
        }
    }
  }

  const roleLabels: Record<string, string> = {
    member: t('users.roles.member', 'Miembro'),
    admin: t('users.roles.admin', 'Administrador'),
    owner: t('users.roles.owner', 'Propietario')
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 flex items-center justify-center p-4"
        style={{ zIndex: 99999 }}
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="rounded-2xl shadow-2xl overflow-hidden border flex flex-col max-h-full"
            style={{ backgroundColor: isDark ? '#1a1f2e' : '#FFFFFF', borderColor }}
          >
            {/* Header */}
            <div
              className="p-6 border-b shrink-0"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}20, ${accentColor}10)`,
                borderColor
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="p-2 rounded-xl"
                    style={{ backgroundColor: `${accentColor}20` }}
                  >
                    <Link2 className="w-6 h-6" style={{ color: accentColor }} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold" style={{ color: textColor }}>
                      {t('users.modals.manageLinks.title', 'Enlaces de Invitación')}
                    </h3>
                    <p className="text-sm" style={{ color: mutedText }}>
                      {t('users.modals.manageLinks.subtitle', 'Administra los enlaces de invitación masiva')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchLinks}
                    disabled={isLoading}
                    className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
                    title={t('common.refresh', 'Actualizar')}
                  >
                    <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} style={{ color: mutedText }} />
                  </button>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
                    <X className="w-5 h-5" style={{ color: mutedText }} />
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <span className="text-sm text-red-400 flex-1">{error}</span>
                  <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              )}

              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl border animate-pulse"
                      style={{ backgroundColor: inputBg, borderColor }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-gray-300 dark:bg-gray-700" />
                        <div className="flex-1">
                          <div className="h-4 w-32 bg-gray-300 dark:bg-gray-700 rounded mb-2" />
                          <div className="h-3 w-48 bg-gray-300 dark:bg-gray-700 rounded" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : links.length === 0 ? (
                <div className="text-center py-12">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: inputBg }}
                  >
                    <Link2 className="w-8 h-8" style={{ color: mutedText }} />
                  </div>
                  <h4 className="text-lg font-semibold mb-2" style={{ color: textColor }}>
                    {t('users.modals.manageLinks.empty.title', 'No hay enlaces')}
                  </h4>
                  <p className="mb-6" style={{ color: mutedText }}>
                    {t('users.modals.manageLinks.empty.subtitle', 'Crea tu primer enlace de invitación masiva')}
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      onClose()
                      onCreateNew()
                    }}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium text-white inline-flex items-center gap-2"
                    style={{
                      backgroundColor: primaryColor,
                      boxShadow: `0 4px 15px ${primaryColor}40`,
                      color: '#FFFFFF'
                    }}
                  >
                    <Plus className="w-4 h-4" />
                    {t('users.buttons.createLink', 'Crear Enlace')}
                  </motion.button>
                </div>
              ) : (
                <div className="space-y-3">
                  {links.map((link) => {
                    const statusConfig = getStatusConfig(link.status)
                    const StatusIcon = statusConfig.icon
                    const isExpiredOrExhausted = link.status === 'expired' || link.status === 'exhausted'

                    return (
                      <motion.div
                        key={link.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-xl border transition-colors hover:border-opacity-50"
                        style={{
                          backgroundColor: inputBg,
                          borderColor,
                          opacity: isExpiredOrExhausted ? 0.7 : 1
                        }}
                      >
                        <div className="flex items-start gap-4">
                          {/* Icon */}
                          <div
                            className="p-2.5 rounded-lg shrink-0"
                            style={{ backgroundColor: statusConfig.bgColor }}
                          >
                            <Link2 className="w-5 h-5" style={{ color: statusConfig.color }} />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium truncate" style={{ color: textColor }}>
                                {link.name || t('users.modals.manageLinks.unnamed', 'Sin nombre')}
                              </h4>
                              <span
                                className="px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-1"
                                style={{ backgroundColor: statusConfig.bgColor, color: statusConfig.color }}
                              >
                                <StatusIcon className="w-3 h-3" />
                                {statusConfig.label}
                              </span>
                            </div>

                            {/* URL */}
                            <div className="flex items-center gap-2 mb-3">
                              <p
                                className="text-xs font-mono truncate flex-1"
                                style={{ color: mutedText }}
                              >
                                {getInviteUrl(link.token)}
                              </p>
                              <button
                                onClick={() => handleCopy(link)}
                                className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors shrink-0"
                                title={t('common.copy', 'Copiar')}
                              >
                                {copiedId === link.id ? (
                                  <Check className="w-4 h-4" style={{ color: accentColor }} />
                                ) : (
                                  <Copy className="w-4 h-4" style={{ color: mutedText }} />
                                )}
                              </button>
                              <a
                                href={getInviteUrl(link.token)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors shrink-0"
                                title={t('common.openInNewTab', 'Abrir en nueva pestaña')}
                              >
                                <ExternalLink className="w-4 h-4" style={{ color: mutedText }} />
                              </a>
                            </div>

                            {/* Stats */}
                            <div className="flex items-center gap-4 text-xs">
                              <div className="flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5" style={{ color: mutedText }} />
                                <span style={{ color: mutedText }}>
                                  {link.current_uses}/{link.max_uses} {t('users.modals.manageLinks.uses', 'usos')}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Shield className="w-3.5 h-3.5" style={{ color: mutedText }} />
                                <span style={{ color: mutedText }}>
                                  {roleLabels[link.role] || link.role}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" style={{ color: mutedText }} />
                                <span style={{ color: mutedText }}>
                                  {new Date(link.expires_at).toLocaleDateString('es-ES', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric'
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="relative shrink-0">
                            <button
                              onClick={() => setOpenMenuId(openMenuId === link.id ? null : link.id)}
                              disabled={actionLoading === link.id}
                              className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
                            >
                              {actionLoading === link.id ? (
                                <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                              ) : (
                                <MoreVertical className="w-5 h-5" style={{ color: mutedText }} />
                              )}
                            </button>

                            {/* Dropdown Menu */}
                            <AnimatePresence>
                              {openMenuId === link.id && (
                                <motion.div
                                  ref={menuRef}
                                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                  className="absolute right-0 top-full mt-1 w-40 rounded-xl border shadow-lg overflow-hidden"
                                  style={{ backgroundColor: isDark ? '#252b3b' : '#FFFFFF', borderColor, zIndex: 50 }}
                                >
                                  {link.status === 'active' && (
                                    <button
                                      onClick={() => handleAction(link.id, 'pause')}
                                      className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                      style={{ color: textColor }}
                                    >
                                      <Pause className="w-4 h-4" style={{ color: '#F59E0B' }} />
                                      {t('users.modals.manageLinks.actions.pause', 'Pausar')}
                                    </button>
                                  )}
                                  {link.status === 'paused' && (
                                    <button
                                      onClick={() => handleAction(link.id, 'resume')}
                                      className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                      style={{ color: textColor }}
                                    >
                                      <Play className="w-4 h-4" style={{ color: '#22C55E' }} />
                                      {t('users.modals.manageLinks.actions.resume', 'Reanudar')}
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleAction(link.id, 'delete')}
                                    className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-red-500/10 transition-colors text-red-500"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    {t('users.modals.manageLinks.actions.delete', 'Eliminar')}
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t flex items-center justify-between shrink-0" style={{ borderColor }}>
              <p className="text-sm" style={{ color: mutedText }}>
                {links.length} {links.length === 1 ? t('users.modals.manageLinks.linkSingular', 'enlace') : t('users.modals.manageLinks.linkPlural', 'enlaces')}
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                  style={{ color: mutedText }}
                >
                  {t('users.buttons.close', 'Cerrar')}
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    onClose()
                    onCreateNew()
                  }}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium text-white flex items-center gap-2"
                  style={{
                    backgroundColor: primaryColor,
                    boxShadow: `0 4px 15px ${primaryColor}40`,
                    color: '#FFFFFF'
                  }}
                >
                  <Plus className="w-4 h-4" />
                  {t('users.buttons.newLink', 'Nuevo Enlace')}
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </AnimatePresence>
  )
}
