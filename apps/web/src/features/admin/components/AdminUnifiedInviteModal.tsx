'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Mail,
  Link2,
  Shield,
  Send,
  Sparkles,
  Briefcase,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Users,
  Calendar,
  Copy,
  Check,
  List,
  Trash2,
  Pause,
  Play,
  ExternalLink,
  RefreshCw,
  Clock,
  XCircle,
  MoreVertical,
  Plus
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useThemeStore } from '@/core/stores/themeStore'
import { inviteUserAction } from '@/features/auth/actions/invitation'

interface AdminUnifiedInviteModalProps {
  isOpen: boolean
  onClose: () => void
  onInviteSent?: () => void
  onLinkCreated?: () => void
  organizationId: string
  organizationSlug?: string
  primaryColor?: string
  accentColor?: string
}

type InviteMode = 'individual' | 'bulk' | 'manage'
type ModalStatus = 'idle' | 'loading' | 'success' | 'error'

interface CreatedLink {
  id: string
  token: string
  name: string | null
  max_uses: number
  role: string
  expires_at: string
}

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

export function AdminUnifiedInviteModal({
  isOpen,
  onClose,
  onInviteSent,
  onLinkCreated,
  organizationId,
  organizationSlug,
  primaryColor = '#0A2540',
  accentColor = '#00D4B3'
}: AdminUnifiedInviteModalProps) {
  const { t } = useTranslation('business')
  const { resolvedTheme } = useThemeStore()

  const isDark = resolvedTheme === 'dark'
  const textColor = isDark ? '#FFFFFF' : '#0F172A'
  const mutedText = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(15,23,42,0.6)'
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
  const inputBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'

  // State
  const [mode, setMode] = useState<InviteMode>('individual')
  const [status, setStatus] = useState<ModalStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  // Individual invite form
  const [individualForm, setIndividualForm] = useState({
    email: '',
    role: 'member' as 'owner' | 'admin' | 'member',
    position: '',
    customMessage: ''
  })
  const [successEmail, setSuccessEmail] = useState<string | null>(null)

  // Bulk invite form
  const [bulkForm, setBulkForm] = useState({
    name: '',
    maxUses: 100,
    role: 'member' as 'owner' | 'admin' | 'member',
    expiresAt: ''
  })
  const [createdLink, setCreatedLink] = useState<CreatedLink | null>(null)
  const [copied, setCopied] = useState(false)

  // Manage links state
  const [links, setLinks] = useState<BulkInviteLink[]>([])
  const [isLoadingLinks, setIsLoadingLinks] = useState(false)
  const [linksError, setLinksError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  // Set default expiration date for bulk invite
  useEffect(() => {
    if (isOpen && !bulkForm.expiresAt) {
      const defaultExpiry = new Date()
      defaultExpiry.setDate(defaultExpiry.getDate() + 7)
      setBulkForm(prev => ({
        ...prev,
        expiresAt: defaultExpiry.toISOString().slice(0, 16)
      }))
    }
  }, [isOpen])

  // Fetch links when switching to manage mode
  useEffect(() => {
    if (isOpen && mode === 'manage') {
      fetchLinks()
    }
  }, [isOpen, mode])

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setMode('individual')
      setStatus('idle')
      setError(null)
      setIndividualForm({ email: '', role: 'member', position: '', customMessage: '' })
      setBulkForm({ name: '', maxUses: 100, role: 'member', expiresAt: '' })
      setSuccessEmail(null)
      setCreatedLink(null)
      setCopied(false)
      setLinks([])
      setLinksError(null)
      setOpenMenuId(null)
    }
  }, [isOpen])

  const roleLabels = {
    member: {
      label: t('users.roles.member', 'Miembro'),
      desc: t('users.modals.invite.roleDesc.member', 'Acceso básico a la plataforma')
    },
    admin: {
      label: t('users.roles.admin', 'Administrador'),
      desc: t('users.modals.invite.roleDesc.admin', 'Puede gestionar usuarios y contenido')
    },
    owner: {
      label: t('users.roles.owner', 'Propietario'),
      desc: t('users.modals.invite.roleDesc.owner', 'Control total de la organización')
    }
  }

  // Fetch links for manage tab
  const fetchLinks = async () => {
    setIsLoadingLinks(true)
    setLinksError(null)
    try {
      const response = await fetch(`/api/admin/companies/${organizationId}/invite-links`, {
        credentials: 'include'
      })
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al cargar enlaces')
      }

      setLinks(data.links || [])
    } catch (err) {
      setLinksError(err instanceof Error ? err.message : 'Error al cargar enlaces')
    } finally {
      setIsLoadingLinks(false)
    }
  }

  // Individual invite submit
  const handleIndividualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setError(null)

    try {
      if (!organizationId) {
        throw new Error('No se encontró la organización')
      }

      const result = await inviteUserAction({
        email: individualForm.email,
        role: individualForm.role,
        organizationId,
        position: individualForm.position || undefined,
        customMessage: individualForm.customMessage || undefined
      })

      if (result.error) {
        throw new Error(result.error)
      }

      setStatus('success')
      setSuccessEmail(individualForm.email)

      setTimeout(() => {
        onInviteSent?.()
        onClose()
      }, 2000)
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Error al enviar invitación')
    }
  }

  // Bulk invite submit
  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setError(null)

    try {
      const response = await fetch(`/api/admin/companies/${organizationId}/invite-links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: bulkForm.name || null,
          maxUses: bulkForm.maxUses,
          role: bulkForm.role,
          expiresAt: bulkForm.expiresAt
        })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al crear el enlace')
      }

      setCreatedLink(data.link)
      setStatus('success')
      onLinkCreated?.()
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Error al crear el enlace')
    }
  }

  const getInviteUrl = (token?: string) => {
    const t = token || createdLink?.token
    if (!t) return ''
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    return `${baseUrl}/invite/${t}`
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getInviteUrl())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleCopyLink = async (link: BulkInviteLink) => {
    try {
      await navigator.clipboard.writeText(getInviteUrl(link.token))
      setCopiedId(link.id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleLinkAction = async (linkId: string, action: 'pause' | 'resume' | 'delete') => {
    setActionLoading(linkId)
    setOpenMenuId(null)

    try {
      if (action === 'delete') {
        const response = await fetch(`/api/admin/companies/${organizationId}/invite-links/${linkId}`, {
          method: 'DELETE',
          credentials: 'include'
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Error al eliminar')
        }

        setLinks(prev => prev.filter(l => l.id !== linkId))
      } else {
        const response = await fetch(`/api/admin/companies/${organizationId}/invite-links/${linkId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ action })
        })

        const data = await response.json()

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Error al actualizar')
        }

        setLinks(prev => prev.map(l => l.id === linkId ? data.link : l))
      }
    } catch (err) {
      setLinksError(err instanceof Error ? err.message : 'Error en la operación')
    } finally {
      setActionLoading(null)
    }
  }

  const handleCreateAnother = () => {
    setStatus('idle')
    setCreatedLink(null)
    setBulkForm({ name: '', maxUses: 100, role: 'member', expiresAt: '' })
    const defaultExpiry = new Date()
    defaultExpiry.setDate(defaultExpiry.getDate() + 7)
    setBulkForm(prev => ({
      ...prev,
      expiresAt: defaultExpiry.toISOString().slice(0, 16)
    }))
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return { label: t('users.modals.manageLinks.status.active', 'Activo'), color: '#22C55E', bgColor: 'rgba(34, 197, 94, 0.1)', icon: CheckCircle }
      case 'paused':
        return { label: t('users.modals.manageLinks.status.paused', 'Pausado'), color: '#F59E0B', bgColor: 'rgba(245, 158, 11, 0.1)', icon: Pause }
      case 'expired':
        return { label: t('users.modals.manageLinks.status.expired', 'Expirado'), color: '#EF4444', bgColor: 'rgba(239, 68, 68, 0.1)', icon: Clock }
      case 'exhausted':
        return { label: t('users.modals.manageLinks.status.exhausted', 'Agotado'), color: '#6B7280', bgColor: 'rgba(107, 114, 128, 0.1)', icon: XCircle }
      default:
        return { label: status, color: mutedText, bgColor: inputBg, icon: AlertCircle }
    }
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
            className="rounded-2xl shadow-2xl overflow-hidden border flex flex-col max-h-full bg-white dark:bg-[#1a1f2e] border-gray-100 dark:border-white/10"
          >
            {/* Header */}
            <div
              className="p-6 border-b shrink-0 border-gray-100 dark:border-white/10"
              style={{
                background: isDark 
                    ? `linear-gradient(135deg, ${primaryColor}40, ${accentColor}20)` 
                    : `linear-gradient(135deg, ${primaryColor}10, ${accentColor}05)`,
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="p-2 rounded-xl bg-accent/20"
                  >
                    {mode === 'individual' ? (
                      <Mail className="w-6 h-6" style={{ color: accentColor }} />
                    ) : mode === 'bulk' ? (
                      <Link2 className="w-6 h-6" style={{ color: accentColor }} />
                    ) : (
                      <List className="w-6 h-6" style={{ color: accentColor }} />
                    )}
                  </motion.div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {t('users.modals.unified.title', 'Invitar Usuarios')}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-[#8899A6]">
                      {mode === 'manage' 
                        ? t('users.modals.unified.subtitleManage', 'Gestiona tus enlaces de invitación')
                        : t('users.modals.unified.subtitle', 'Elige cómo quieres invitar')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400 dark:text-[#8899A6]" />
                </button>
              </div>

              {/* Mode Tabs */}
              {status !== 'success' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => { setMode('individual'); setError(null); setStatus('idle') }}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all border-2 ${
                      mode === 'individual'
                        ? 'bg-primary/10 dark:bg-primary/30 border-primary text-primary dark:text-white'
                        : 'bg-gray-50 dark:bg-white/5 border-transparent text-gray-500 dark:text-[#8899A6]'
                    }`}
                    style={{
                      borderColor: mode === 'individual' ? primaryColor : 'transparent',
                      color: mode === 'individual' ? (isDark ? '#FFFFFF' : primaryColor) : undefined
                    }}
                  >
                    <Mail className="w-4 h-4" />
                    <span className="hidden sm:inline">{t('users.modals.unified.tabs.individual', 'Individual')}</span>
                    <span className="sm:hidden">Email</span>
                  </button>
                  <button
                    onClick={() => { setMode('bulk'); setError(null); setStatus('idle') }}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all border-2 ${
                      mode === 'bulk'
                        ? 'bg-primary/10 dark:bg-primary/30 border-primary text-primary dark:text-white'
                        : 'bg-gray-50 dark:bg-white/5 border-transparent text-gray-500 dark:text-[#8899A6]'
                    }`}
                    style={{
                      borderColor: mode === 'bulk' ? primaryColor : 'transparent',
                      color: mode === 'bulk' ? (isDark ? '#FFFFFF' : primaryColor) : undefined
                    }}
                  >
                    <Link2 className="w-4 h-4" />
                    <span className="hidden sm:inline">{t('users.modals.unified.tabs.bulk', 'Enlace Masivo')}</span>
                    <span className="sm:hidden">Enlace</span>
                  </button>
                  <button
                    onClick={() => { setMode('manage'); setError(null); setStatus('idle') }}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all border-2 ${
                      mode === 'manage'
                        ? 'bg-primary/10 dark:bg-primary/30 border-primary text-primary dark:text-white'
                        : 'bg-gray-50 dark:bg-white/5 border-transparent text-gray-500 dark:text-[#8899A6]'
                    }`}
                    style={{
                      borderColor: mode === 'manage' ? primaryColor : 'transparent',
                      color: mode === 'manage' ? (isDark ? '#FFFFFF' : primaryColor) : undefined
                    }}
                  >
                    <List className="w-4 h-4" />
                    <span className="hidden sm:inline">{t('users.modals.unified.tabs.manage', 'Ver Enlaces')}</span>
                    <span className="sm:hidden">Ver</span>
                  </button>
                </div>
              )}
            </div>

            {/* Content */}
            {status === 'success' ? (
              mode === 'individual' ? (
                // Individual Success
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-8 flex flex-col items-center justify-center text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                    className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${accentColor}20` }}
                  >
                    <CheckCircle className="w-10 h-10" style={{ color: accentColor }} />
                  </motion.div>
                  <h4 className="text-xl font-bold mb-2" style={{ color: textColor }}>
                    {t('users.modals.invite.success.title', '¡Invitación enviada!')}
                  </h4>
                  <p style={{ color: mutedText }}>
                    {t('users.modals.invite.success.message', 'Invitación enviada exitosamente a')} {successEmail}
                  </p>
                </motion.div>
              ) : (
                // Bulk Success
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 space-y-6"
                >
                  <div className="text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                      className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                      style={{ backgroundColor: `${accentColor}20` }}
                    >
                      <CheckCircle className="w-10 h-10" style={{ color: accentColor }} />
                    </motion.div>
                    <h4 className="text-xl font-bold mb-2" style={{ color: textColor }}>
                      {t('users.modals.bulkInvite.success.title', '¡Enlace creado!')}
                    </h4>
                    <p style={{ color: mutedText }}>
                      {t('users.modals.bulkInvite.success.subtitle', 'Comparte este enlace con las personas que deseas invitar')}
                    </p>
                  </div>

                  {/* Link Display */}
                  <div className="p-4 rounded-xl border" style={{ backgroundColor: inputBg, borderColor }}>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium mb-1" style={{ color: mutedText }}>
                          {t('users.modals.bulkInvite.success.linkLabel', 'Enlace de invitación')}
                        </p>
                        <p className="text-sm font-mono truncate" style={{ color: textColor }}>
                          {getInviteUrl()}
                        </p>
                      </div>
                      <button
                        onClick={handleCopy}
                        className="p-2 rounded-lg transition-colors flex-shrink-0"
                        style={{
                          backgroundColor: copied ? `${accentColor}20` : inputBg,
                          color: copied ? accentColor : textColor
                        }}
                      >
                        {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Link Details */}
                  {createdLink && (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 rounded-xl text-center bg-gray-50 dark:bg-white/5">
                        <Users className="w-5 h-5 mx-auto mb-1 text-accent" />
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{createdLink.max_uses}</p>
                        <p className="text-xs text-gray-500 dark:text-[#8899A6]">
                          {t('users.modals.bulkInvite.success.maxUsers', 'Máx. usuarios')}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl text-center bg-gray-50 dark:bg-white/5">
                        <Shield className="w-5 h-5 mx-auto mb-1 text-accent" />
                        <p className="text-lg font-bold capitalize text-gray-900 dark:text-white">
                          {roleLabels[createdLink.role as keyof typeof roleLabels]?.label || createdLink.role}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-[#8899A6]">
                          {t('users.modals.bulkInvite.success.role', 'Rol')}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl text-center bg-gray-50 dark:bg-white/5">
                        <Calendar className="w-5 h-5 mx-auto mb-1 text-accent" />
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {new Date(createdLink.expires_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-[#8899A6]">
                          {t('users.modals.bulkInvite.success.expires', 'Expira')}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-white/10">
                    <button
                      onClick={handleCreateAnother}
                      className="px-4 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5 text-gray-500 dark:text-[#8899A6]"
                    >
                      {t('users.buttons.createAnother', 'Crear otro')}
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onClose}
                      className="px-5 py-2.5 rounded-xl text-sm font-medium text-white shadow-lg"
                      style={{
                        backgroundColor: primaryColor,
                        boxShadow: `0 4px 15px ${primaryColor}40`
                      }}
                    >
                      {t('users.buttons.done', 'Listo')}
                    </motion.button>
                  </div>
                </motion.div>
              )
            ) : mode === 'individual' ? (
              // Individual Invite Form
              <form onSubmit={handleIndividualSubmit} className="flex flex-col overflow-hidden h-full">
                <div
                  className="flex-1 overflow-y-auto p-6 space-y-5"
                  style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}
                >
                  {/* Error */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3"
                    >
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                      <span className="text-sm text-red-400 flex-1">{error}</span>
                    </motion.div>
                  )}

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-600 dark:text-white/70">
                      {t('users.modals.invite.fields.email', 'Correo electrónico')} <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-[#8899A6]" />
                      <input
                        type="email"
                        value={individualForm.email}
                        onChange={(e) => setIndividualForm(prev => ({ ...prev, email: e.target.value }))}
                        required
                        disabled={status === 'loading'}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none transition-colors disabled:opacity-50 bg-gray-50 dark:bg-[#0F1419] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                        placeholder={t('users.modals.invite.placeholders.email', 'usuario@empresa.com')}
                      />
                    </div>
                  </div>

                  {/* Role Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: mutedText }}>
                      {t('users.modals.invite.fields.role', 'Rol en la organización')} <span className="text-red-400">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['member', 'admin', 'owner'] as const).map((role) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => setIndividualForm(prev => ({ ...prev, role }))}
                          disabled={status === 'loading'}
                          className="p-3 rounded-xl border text-left transition-all disabled:opacity-50"
                          style={{
                            backgroundColor: individualForm.role === role
                              ? (isDark ? `${primaryColor}30` : `${primaryColor}10`)
                              : inputBg,
                            borderColor: individualForm.role === role ? primaryColor : borderColor,
                          }}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Shield
                              className="w-4 h-4"
                              style={{ color: individualForm.role === role ? (isDark ? '#FFFFFF' : primaryColor) : mutedText }}
                            />
                            <span
                              className="text-sm font-medium"
                              style={{ color: individualForm.role === role ? (isDark ? '#FFFFFF' : primaryColor) : textColor }}
                            >
                              {roleLabels[role].label}
                            </span>
                          </div>
                          <p className="text-xs hidden sm:block" style={{ color: mutedText }}>{roleLabels[role].desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Position */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-500 dark:text-[#8899A6]">
                      {t('users.modals.invite.fields.position', 'Cargo / Posición')}
                      <span className="ml-1 text-gray-400 dark:text-white/40">({t('common.optional', 'Opcional')})</span>
                    </label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-[#8899A6]" />
                      <input
                        type="text"
                        value={individualForm.position}
                        onChange={(e) => setIndividualForm(prev => ({ ...prev, position: e.target.value }))}
                        disabled={status === 'loading'}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none transition-colors disabled:opacity-50 bg-gray-50 dark:bg-[#0F1419] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                        placeholder={t('users.modals.invite.placeholders.position', 'Ej: Gerente de Ventas')}
                        maxLength={100}
                      />
                    </div>
                  </div>

                  {/* Custom Message */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-500 dark:text-[#8899A6]">
                      {t('users.modals.invite.fields.message', 'Mensaje personalizado')}
                      <span className="ml-1 text-gray-400 dark:text-white/40">({t('common.optional', 'Opcional')})</span>
                    </label>
                    <div className="relative">
                      <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-gray-400 dark:text-[#8899A6]" />
                      <textarea
                        value={individualForm.customMessage}
                        onChange={(e) => setIndividualForm(prev => ({ ...prev, customMessage: e.target.value }))}
                        disabled={status === 'loading'}
                        rows={3}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none transition-colors resize-none disabled:opacity-50 bg-gray-50 dark:bg-[#0F1419] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                        placeholder={t('users.modals.invite.placeholders.message', 'Agrega un mensaje personalizado...')}
                        maxLength={500}
                      />
                    </div>
                    <p className="text-xs mt-1 text-right text-gray-400 dark:text-[#8899A6]">
                      {individualForm.customMessage.length}/500
                    </p>
                  </div>

                  {/* Info */}
                  <div className="p-4 rounded-xl border bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/10">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-5 h-5 flex-shrink-0 text-accent" />
                      <div className="text-sm text-gray-500 dark:text-[#8899A6]">
                        <p>{t('users.modals.invite.hints.info', 'El usuario recibirá un correo con un enlace para completar su registro. La invitación expira en 7 días.')}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t flex items-center justify-end gap-3 shrink-0" style={{ borderColor }}>
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={status === 'loading'}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 hover:bg-black/5 dark:hover:bg-white/5"
                    style={{ color: mutedText }}
                  >
                    {t('users.buttons.cancel', 'Cancelar')}
                  </button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: status === 'loading' ? 1 : 1.02 }}
                    whileTap={{ scale: status === 'loading' ? 1 : 0.98 }}
                    disabled={status === 'loading'}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium text-white flex items-center gap-2 disabled:opacity-70"
                    style={{
                      backgroundColor: primaryColor,
                      boxShadow: `0 4px 15px ${primaryColor}40`
                    }}
                  >
                    {status === 'loading' ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>{t('users.buttons.sending', 'Enviando...')}</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>{t('users.buttons.sendInvite', 'Enviar Invitación')}</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            ) : mode === 'bulk' ? (
              // Bulk Invite Form
              <form onSubmit={handleBulkSubmit} className="flex flex-col overflow-hidden h-full">
                <div
                  className="flex-1 overflow-y-auto p-6 space-y-5"
                  style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}
                >
                  {/* Error */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3"
                    >
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                      <span className="text-sm text-red-400 flex-1">{error}</span>
                    </motion.div>
                  )}

                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-500 dark:text-[#8899A6]">
                      {t('users.modals.bulkInvite.fields.name', 'Nombre del enlace')}
                      <span className="ml-1 text-gray-400 dark:text-white/40">({t('common.optional', 'Opcional')})</span>
                    </label>
                    <input
                      type="text"
                      value={bulkForm.name}
                      onChange={(e) => setBulkForm(prev => ({ ...prev, name: e.target.value }))}
                      disabled={status === 'loading'}
                      className="w-full px-4 py-3 rounded-xl border focus:outline-none transition-colors disabled:opacity-50 bg-gray-50 dark:bg-[#0F1419] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                      placeholder={t('users.modals.bulkInvite.placeholders.name', 'Ej: Invitación Equipo de Ventas')}
                      maxLength={100}
                    />
                  </div>

                  {/* Max Uses */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-600 dark:text-white/70">
                      {t('users.modals.bulkInvite.fields.maxUses', 'Número máximo de registros')} <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-[#8899A6]" />
                      <input
                        type="number"
                        value={bulkForm.maxUses}
                        onChange={(e) => setBulkForm(prev => ({ ...prev, maxUses: parseInt(e.target.value) || 0 }))}
                        required
                        min={1}
                        max={10000}
                        disabled={status === 'loading'}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none transition-colors disabled:opacity-50 bg-gray-50 dark:bg-[#0F1419] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"
                      />
                    </div>
                    <p className="text-xs mt-1 text-gray-400 dark:text-[#8899A6]">
                      {t('users.modals.bulkInvite.hints.maxUses', 'Máximo de usuarios que pueden registrarse (1-10,000)')}
                    </p>
                  </div>

                  {/* Role Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: mutedText }}>
                      {t('users.modals.bulkInvite.fields.role', 'Rol asignado')} <span className="text-red-400">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['member', 'admin', 'owner'] as const).map((role) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => setBulkForm(prev => ({ ...prev, role }))}
                          disabled={status === 'loading'}
                          className="p-3 rounded-xl border text-left transition-all disabled:opacity-50"
                          style={{
                            backgroundColor: bulkForm.role === role
                              ? (isDark ? `${primaryColor}30` : `${primaryColor}10`)
                              : inputBg,
                            borderColor: bulkForm.role === role ? primaryColor : borderColor,
                          }}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Shield
                              className="w-4 h-4"
                              style={{ color: bulkForm.role === role ? (isDark ? '#FFFFFF' : primaryColor) : mutedText }}
                            />
                            <span
                              className="text-sm font-medium"
                              style={{ color: bulkForm.role === role ? (isDark ? '#FFFFFF' : primaryColor) : textColor }}
                            >
                              {roleLabels[role].label}
                            </span>
                          </div>
                          <p className="text-xs hidden sm:block" style={{ color: mutedText }}>{roleLabels[role].desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Expiration */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-600 dark:text-white/70">
                      {t('users.modals.bulkInvite.fields.expiresAt', 'Fecha de expiración')} <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-[#8899A6]" />
                      <input
                        type="datetime-local"
                        value={bulkForm.expiresAt}
                        onChange={(e) => setBulkForm(prev => ({ ...prev, expiresAt: e.target.value }))}
                        required
                        disabled={status === 'loading'}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none transition-colors disabled:opacity-50 bg-gray-50 dark:bg-[#0F1419] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"
                        min={new Date().toISOString().slice(0, 16)}
                      />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4 rounded-xl border bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/10">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-5 h-5 flex-shrink-0 text-accent" />
                      <div className="text-sm text-gray-500 dark:text-[#8899A6]">
                        <p>{t('users.modals.bulkInvite.hints.info', 'El enlace permitirá que cualquier persona se registre en tu organización con el rol especificado.')}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t flex items-center justify-end gap-3 shrink-0" style={{ borderColor }}>
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={status === 'loading'}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 hover:bg-black/5 dark:hover:bg-white/5"
                    style={{ color: mutedText }}
                  >
                    {t('users.buttons.cancel', 'Cancelar')}
                  </button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: status === 'loading' ? 1 : 1.02 }}
                    whileTap={{ scale: status === 'loading' ? 1 : 0.98 }}
                    disabled={status === 'loading'}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium text-white flex items-center gap-2 disabled:opacity-70"
                    style={{
                      backgroundColor: primaryColor,
                      boxShadow: `0 4px 15px ${primaryColor}40`
                    }}
                  >
                    {status === 'loading' ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>{t('users.buttons.creating', 'Creando...')}</span>
                      </>
                    ) : (
                      <>
                        <Link2 className="w-4 h-4" />
                        <span>{t('users.buttons.createLink', 'Crear Enlace')}</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            ) : (
              // Manage Links
              <div className="flex flex-col overflow-hidden h-full">
                <div
                  className="flex-1 overflow-y-auto p-6"
                  style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}
                >
                  {linksError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3"
                    >
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                      <span className="text-sm text-red-400 flex-1">{linksError}</span>
                      <button onClick={() => setLinksError(null)} className="text-red-400 hover:text-red-300">
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  )}

                  {isLoadingLinks ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="p-4 rounded-xl border animate-pulse bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10"
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
                        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-gray-50 dark:bg-white/5"
                      >
                        <Link2 className="w-8 h-8 text-gray-400 dark:text-[#8899A6]" />
                      </div>
                      <h4 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                        {t('users.modals.manageLinks.empty.title', 'No hay enlaces')}
                      </h4>
                      <p className="mb-6 text-gray-500 dark:text-[#8899A6]">
                        {t('users.modals.manageLinks.empty.subtitle', 'Crea tu primer enlace de invitación')}
                      </p>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setMode('bulk')}
                        className="px-5 py-2.5 rounded-xl text-sm font-medium text-white inline-flex items-center gap-2 shadow-lg"
                        style={{
                          backgroundColor: primaryColor,
                          boxShadow: `0 4px 15px ${primaryColor}40`
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
                            className={`p-4 rounded-xl border transition-colors bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/10 ${isExpiredOrExhausted ? 'opacity-70' : ''}`}
                          >
                            <div className="flex items-start gap-3">
                              {/* Icon */}
                              <div
                                className="p-2 rounded-lg shrink-0"
                                style={{ backgroundColor: statusConfig.bgColor }}
                              >
                                <Link2 className="w-4 h-4" style={{ color: statusConfig.color }} />
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium truncate text-sm text-gray-900 dark:text-white">
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
                                <div className="flex items-center gap-2 mb-2">
                                  <p className="text-xs font-mono truncate flex-1 text-gray-500 dark:text-[#8899A6]">
                                    {getInviteUrl(link.token)}
                                  </p>
                                  <button
                                    onClick={() => handleCopyLink(link)}
                                    className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors shrink-0"
                                  >
                                    {copiedId === link.id ? (
                                      <Check className="w-3.5 h-3.5 text-accent" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5 text-gray-400 dark:text-[#8899A6]" />
                                    )}
                                  </button>
                                </div>

                                {/* Stats */}
                                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-[#8899A6]">
                                  <div className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    <span>
                                      {link.current_uses}/{link.max_uses}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Shield className="w-3 h-3" />
                                    <span>
                                      {roleLabels[link.role as keyof typeof roleLabels]?.label || link.role}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    <span>
                                      {new Date(link.expires_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="relative shrink-0">
                                <button
                                  onClick={() => setOpenMenuId(openMenuId === link.id ? null : link.id)}
                                  disabled={actionLoading === link.id}
                                  className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50 text-gray-500 dark:text-[#8899A6]"
                                >
                                  {actionLoading === link.id ? (
                                    <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                                  ) : (
                                    <MoreVertical className="w-4 h-4" />
                                  )}
                                </button>

                                <AnimatePresence>
                                  {openMenuId === link.id && (
                                    <motion.div
                                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                      animate={{ opacity: 1, scale: 1, y: 0 }}
                                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                      className="absolute right-0 top-full mt-1 w-36 rounded-xl border shadow-lg overflow-hidden bg-white dark:bg-[#1a1f2e] border-gray-100 dark:border-white/10"
                                      style={{ zIndex: 10 }}
                                    >
                                      {link.status === 'active' && (
                                          <button
                                            onClick={() => handleLinkAction(link.id, 'pause')}
                                            className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-gray-900 dark:text-white"
                                          >
                                            <Pause className="w-4 h-4 text-orange-500" />
                                            {t('users.modals.manageLinks.actions.pause', 'Pausar')}
                                          </button>
                                      )}
                                      {link.status === 'paused' && (
                                          <button
                                            onClick={() => handleLinkAction(link.id, 'resume')}
                                            className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-gray-900 dark:text-white"
                                          >
                                            <Play className="w-4 h-4 text-green-500" />
                                            {t('users.modals.manageLinks.actions.resume', 'Reanudar')}
                                          </button>
                                      )}
                                      <button
                                        onClick={() => handleLinkAction(link.id, 'delete')}
                                        className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-red-500/10 transition-colors text-red-500"
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
                <div className="p-6 border-t flex items-center justify-between shrink-0 border-gray-100 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={fetchLinks}
                      disabled={isLoadingLinks}
                      className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${isLoadingLinks ? 'animate-spin' : ''}`} style={{ color: '#8899A6' }} />
                    </button>
                    <span className="text-sm text-gray-500 dark:text-[#8899A6]">
                      {links.length} {links.length === 1 ? 'enlace' : 'enlaces'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={onClose}
                      className="px-4 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5 text-gray-500 dark:text-[#8899A6]"
                    >
                      {t('users.buttons.close', 'Cerrar')}
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setMode('bulk')}
                      className="px-4 py-2.5 rounded-xl text-sm font-medium text-white flex items-center gap-2 shadow-lg"
                      style={{
                        backgroundColor: primaryColor,
                        boxShadow: `0 4px 15px ${primaryColor}40`
                      }}
                    >
                      <Plus className="w-4 h-4" />
                      {t('users.buttons.newLink', 'Nuevo')}
                    </motion.button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Click outside to close menu */}
        {openMenuId && (
          <div
            className="fixed inset-0"
            style={{ zIndex: 99998 }}
            onClick={() => setOpenMenuId(null)}
          />
        )}
      </div>
    </AnimatePresence>
  )
}
