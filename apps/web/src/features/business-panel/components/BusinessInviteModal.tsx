'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
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
  Trash2,
  Pause,
  Play,
  ExternalLink,
  RefreshCw,
  Clock,
  XCircle,
  MoreVertical,
  Plus,
  ChevronRight
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext'
import { inviteUserAction } from '@/features/auth/actions/invitation'
import { useThemeStore } from '@/core/stores/themeStore'

// ============================================
// TYPES
// ============================================
interface BusinessInviteModalProps {
  isOpen: boolean
  onClose: () => void
  onInviteSent?: () => void
  organizationId?: string
  organizationSlug?: string
  defaultTab?: 'individual' | 'bulk' | 'manage'
}

type TabType = 'individual' | 'bulk' | 'manage'
type InviteStatus = 'idle' | 'loading' | 'success' | 'error'

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

interface CreatedLink {
  id: string
  token: string
  name: string | null
  max_uses: number
  role: string
  expires_at: string
}

// ============================================
// MAIN COMPONENT
// ============================================
export function BusinessInviteModal({
  isOpen,
  onClose,
  onInviteSent,
  organizationId,
  organizationSlug,
  defaultTab = 'individual'
}: BusinessInviteModalProps) {
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

  const [activeTab, setActiveTab] = useState<TabType>(defaultTab)

  // Individual invite state
  const [individualForm, setIndividualForm] = useState({
    email: '',
    role: 'member' as 'owner' | 'admin' | 'member',
    position: '',
    customMessage: ''
  })
  const [individualStatus, setIndividualStatus] = useState<InviteStatus>('idle')
  const [individualError, setIndividualError] = useState<string | null>(null)
  const [individualSuccess, setIndividualSuccess] = useState<string | null>(null)

  // Bulk link state
  const [bulkForm, setBulkForm] = useState({
    name: '',
    maxUses: 100,
    role: 'member' as 'owner' | 'admin' | 'member',
    expiresAt: ''
  })
  const [bulkStatus, setBulkStatus] = useState<InviteStatus>('idle')
  const [bulkError, setBulkError] = useState<string | null>(null)
  const [createdLink, setCreatedLink] = useState<CreatedLink | null>(null)
  const [copied, setCopied] = useState(false)

  // Manage links state
  const [links, setLinks] = useState<BulkInviteLink[]>([])
  const [linksLoading, setLinksLoading] = useState(false)
  const [linksError, setLinksError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  // Set default expiration date for bulk
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

  // Fetch links when manage tab is active
  useEffect(() => {
    if (isOpen && activeTab === 'manage') {
      fetchLinks()
    }
  }, [isOpen, activeTab])

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setActiveTab(defaultTab)
      // Reset individual
      setIndividualForm({ email: '', role: 'member', position: '', customMessage: '' })
      setIndividualStatus('idle')
      setIndividualError(null)
      setIndividualSuccess(null)
      // Reset bulk
      setBulkForm({ name: '', maxUses: 100, role: 'member', expiresAt: '' })
      setBulkStatus('idle')
      setBulkError(null)
      setCreatedLink(null)
      setCopied(false)
      // Reset manage
      setLinksError(null)
      setOpenMenuId(null)
    }
  }, [isOpen, defaultTab])

  const fetchLinks = async () => {
    setLinksLoading(true)
    setLinksError(null)
    try {
      const response = await fetch(`/api/${orgSlug}/business/invite-links`, { credentials: 'include' })
      const data = await response.json()
      if (!response.ok || !data.success) throw new Error(data.error || 'Error al cargar enlaces')
      setLinks(data.links || [])
    } catch (err) {
      setLinksError(err instanceof Error ? err.message : 'Error al cargar enlaces')
    } finally {
      setLinksLoading(false)
    }
  }

  // Individual invite handlers
  const handleIndividualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIndividualStatus('loading')
    setIndividualError(null)

    try {
      if (!organizationId) throw new Error('No se encontró la organización')

      const result = await inviteUserAction({
        email: individualForm.email,
        role: individualForm.role,
        organizationId,
        position: individualForm.position || undefined,
        customMessage: individualForm.customMessage || undefined
      })

      if (result.error) throw new Error(result.error)

      setIndividualStatus('success')
      setIndividualSuccess(`Invitación enviada exitosamente a ${individualForm.email}`)

      setTimeout(() => {
        onInviteSent?.()
        setIndividualForm({ email: '', role: 'member', position: '', customMessage: '' })
        setIndividualStatus('idle')
        setIndividualSuccess(null)
      }, 2000)
    } catch (err) {
      setIndividualStatus('error')
      setIndividualError(err instanceof Error ? err.message : 'Error al enviar invitación')
    }
  }

  // Bulk link handlers
  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBulkStatus('loading')
    setBulkError(null)

    try {
      const response = await fetch(`/api/${orgSlug}/business/invite-links`, {
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
      if (!response.ok || !data.success) throw new Error(data.error || 'Error al crear el enlace')

      setCreatedLink(data.link)
      setBulkStatus('success')
      onInviteSent?.()
    } catch (err) {
      setBulkStatus('error')
      setBulkError(err instanceof Error ? err.message : 'Error al crear el enlace')
    }
  }

  const getInviteUrl = (token: string) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    return `${baseUrl}/invite/${token}`
  }

  const handleCopyLink = async (token: string, linkId?: string) => {
    try {
      await navigator.clipboard.writeText(getInviteUrl(token))
      if (linkId) {
        setCopiedId(linkId)
        setTimeout(() => setCopiedId(null), 2000)
      } else {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleLinkAction = async (linkId: string, action: 'pause' | 'resume' | 'delete') => {
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
          throw new Error(data.error || 'Error al eliminar')
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
        if (!response.ok || !data.success) throw new Error(data.error || 'Error al actualizar')
        setLinks(prev => prev.map(l => l.id === linkId ? data.link : l))
      }
    } catch (err) {
      setLinksError(err instanceof Error ? err.message : 'Error en la operación')
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active': return { label: 'Activo', color: '#22C55E', bgColor: 'rgba(34, 197, 94, 0.1)', icon: CheckCircle }
      case 'paused': return { label: 'Pausado', color: '#F59E0B', bgColor: 'rgba(245, 158, 11, 0.1)', icon: Pause }
      case 'expired': return { label: 'Expirado', color: '#EF4444', bgColor: 'rgba(239, 68, 68, 0.1)', icon: Clock }
      case 'exhausted': return { label: 'Agotado', color: '#6B7280', bgColor: 'rgba(107, 114, 128, 0.1)', icon: XCircle }
      default: return { label: status, color: mutedText, bgColor: inputBg, icon: AlertCircle }
    }
  }

  const roleLabels: Record<string, { label: string; desc: string }> = {
    member: { label: t('users.roles.member', 'Miembro'), desc: 'Acceso básico a la plataforma' },
    admin: { label: t('users.roles.admin', 'Administrador'), desc: 'Puede gestionar usuarios y contenido' },
    owner: { label: t('users.roles.owner', 'Propietario'), desc: 'Control total de la organización' }
  }

  if (!isOpen) return null

  const tabs = [
    { id: 'individual' as TabType, label: 'Invitación Individual', icon: Mail },
    { id: 'bulk' as TabType, label: 'Crear Enlace Masivo', icon: Link2 },
    { id: 'manage' as TabType, label: 'Administrar Enlaces', icon: Users, badge: links.length > 0 ? links.length : undefined }
  ]

  return (
    <AnimatePresence>
      <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 99999 }}>
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
              style={{ background: `linear-gradient(135deg, ${primaryColor}20, ${accentColor}10)`, borderColor }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="p-2 rounded-xl"
                    style={{ backgroundColor: `${accentColor}20` }}
                  >
                    <Users className="w-6 h-6" style={{ color: accentColor }} />
                  </motion.div>
                  <div>
                    <h3 className="text-lg font-semibold" style={{ color: textColor }}>
                      {t('users.modals.invite.title', 'Invitar Usuarios')}
                    </h3>
                    <p className="text-sm" style={{ color: mutedText }}>
                      Invita usuarios individualmente o genera enlaces masivos
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5" style={{ color: mutedText }} />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: inputBg }}>
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative"
                      style={{
                        backgroundColor: isActive ? (isDark ? primaryColor : '#FFFFFF') : 'transparent',
                        color: isActive ? (isDark ? '#FFFFFF' : primaryColor) : mutedText,
                        boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
                      }}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{tab.label}</span>
                      {tab.badge && (
                        <span
                          className="ml-1 px-1.5 py-0.5 rounded-full text-xs"
                          style={{ backgroundColor: `${accentColor}30`, color: accentColor }}
                        >
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
              <AnimatePresence mode="wait">
                {/* Individual Tab */}
                {activeTab === 'individual' && (
                  <motion.div
                    key="individual"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                  >
                    {individualStatus === 'success' ? (
                      <div className="p-8 flex flex-col items-center justify-center text-center">
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
                          ¡Invitación enviada!
                        </h4>
                        <p style={{ color: mutedText }}>{individualSuccess}</p>
                      </div>
                    ) : (
                      <form onSubmit={handleIndividualSubmit} className="p-6 space-y-5">
                        {individualError && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3"
                          >
                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                            <span className="text-sm text-red-400 flex-1">{individualError}</span>
                          </motion.div>
                        )}

                        {/* Email */}
                        <div>
                          <label className="block text-sm font-medium mb-2" style={{ color: mutedText }}>
                            Correo electrónico <span className="text-red-400">*</span>
                          </label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: mutedText }} />
                            <input
                              type="email"
                              value={individualForm.email}
                              onChange={(e) => setIndividualForm(prev => ({ ...prev, email: e.target.value }))}
                              required
                              disabled={individualStatus === 'loading'}
                              className="w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none transition-colors disabled:opacity-50"
                              style={{ backgroundColor: inputBg, borderColor, color: textColor }}
                              placeholder="usuario@empresa.com"
                            />
                          </div>
                        </div>

                        {/* Role */}
                        <div>
                          <label className="block text-sm font-medium mb-2" style={{ color: mutedText }}>
                            Rol en la organización <span className="text-red-400">*</span>
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            {(['member', 'admin', 'owner'] as const).map((role) => (
                              <button
                                key={role}
                                type="button"
                                onClick={() => setIndividualForm(prev => ({ ...prev, role }))}
                                disabled={individualStatus === 'loading'}
                                className="p-3 rounded-xl border text-left transition-all disabled:opacity-50"
                                style={{
                                  backgroundColor: individualForm.role === role ? (isDark ? `${primaryColor}30` : `${primaryColor}10`) : inputBg,
                                  borderColor: individualForm.role === role ? primaryColor : borderColor,
                                }}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <Shield className="w-4 h-4" style={{ color: individualForm.role === role ? (isDark ? '#FFFFFF' : primaryColor) : mutedText }} />
                                  <span className="text-sm font-medium" style={{ color: individualForm.role === role ? (isDark ? '#FFFFFF' : primaryColor) : textColor }}>
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
                          <label className="block text-sm font-medium mb-2" style={{ color: mutedText }}>
                            Cargo / Posición <span style={{ color: mutedText }}>(Opcional)</span>
                          </label>
                          <div className="relative">
                            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: mutedText }} />
                            <input
                              type="text"
                              value={individualForm.position}
                              onChange={(e) => setIndividualForm(prev => ({ ...prev, position: e.target.value }))}
                              disabled={individualStatus === 'loading'}
                              className="w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none transition-colors disabled:opacity-50"
                              style={{ backgroundColor: inputBg, borderColor, color: textColor }}
                              placeholder="Ej: Gerente de Ventas"
                              maxLength={100}
                            />
                          </div>
                        </div>

                        {/* Custom Message */}
                        <div>
                          <label className="block text-sm font-medium mb-2" style={{ color: mutedText }}>
                            Mensaje personalizado <span style={{ color: mutedText }}>(Opcional)</span>
                          </label>
                          <div className="relative">
                            <MessageSquare className="absolute left-3 top-3 w-4 h-4" style={{ color: mutedText }} />
                            <textarea
                              value={individualForm.customMessage}
                              onChange={(e) => setIndividualForm(prev => ({ ...prev, customMessage: e.target.value }))}
                              disabled={individualStatus === 'loading'}
                              rows={3}
                              className="w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none transition-colors resize-none disabled:opacity-50"
                              style={{ backgroundColor: inputBg, borderColor, color: textColor }}
                              placeholder="Agrega un mensaje personalizado..."
                              maxLength={500}
                            />
                          </div>
                          <p className="text-xs mt-1 text-right" style={{ color: mutedText }}>
                            {individualForm.customMessage.length}/500
                          </p>
                        </div>

                        {/* Info */}
                        <div className="p-4 rounded-xl border" style={{ backgroundColor: inputBg, borderColor }}>
                          <div className="flex items-start gap-3">
                            <Sparkles className="w-5 h-5 flex-shrink-0" style={{ color: accentColor }} />
                            <p className="text-sm" style={{ color: mutedText }}>
                              El usuario recibirá un correo con un enlace para completar su registro. La invitación expira en 7 días.
                            </p>
                          </div>
                        </div>

                        {/* Submit */}
                        <div className="flex justify-end pt-2">
                          <motion.button
                            type="submit"
                            whileHover={{ scale: individualStatus === 'loading' ? 1 : 1.02 }}
                            whileTap={{ scale: individualStatus === 'loading' ? 1 : 0.98 }}
                            disabled={individualStatus === 'loading'}
                            className="px-5 py-2.5 rounded-xl text-sm font-medium text-white flex items-center gap-2 disabled:opacity-70"
                            style={{ backgroundColor: primaryColor, boxShadow: `0 4px 15px ${primaryColor}40` }}
                          >
                            {individualStatus === 'loading' ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Enviando...</span>
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4" />
                                <span>Enviar Invitación</span>
                              </>
                            )}
                          </motion.button>
                        </div>
                      </form>
                    )}
                  </motion.div>
                )}

                {/* Bulk Create Tab */}
                {activeTab === 'bulk' && (
                  <motion.div
                    key="bulk"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                  >
                    {bulkStatus === 'success' && createdLink ? (
                      <div className="p-6 space-y-6">
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
                          <h4 className="text-xl font-bold mb-2" style={{ color: textColor }}>¡Enlace creado!</h4>
                          <p style={{ color: mutedText }}>Comparte este enlace con las personas que deseas invitar</p>
                        </div>

                        {/* Link Display */}
                        <div className="p-4 rounded-xl border" style={{ backgroundColor: inputBg, borderColor }}>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium mb-1" style={{ color: mutedText }}>Enlace de invitación</p>
                              <p className="text-sm font-mono truncate" style={{ color: textColor }}>
                                {getInviteUrl(createdLink.token)}
                              </p>
                            </div>
                            <button
                              onClick={() => handleCopyLink(createdLink.token)}
                              className="p-2 rounded-lg transition-colors flex-shrink-0"
                              style={{ backgroundColor: copied ? `${accentColor}20` : inputBg, color: copied ? accentColor : textColor }}
                            >
                              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>

                        {/* Link Stats */}
                        <div className="grid grid-cols-3 gap-3">
                          <div className="p-3 rounded-xl text-center" style={{ backgroundColor: inputBg }}>
                            <Users className="w-5 h-5 mx-auto mb-1" style={{ color: accentColor }} />
                            <p className="text-lg font-bold" style={{ color: textColor }}>{createdLink.max_uses}</p>
                            <p className="text-xs" style={{ color: mutedText }}>Máx. usuarios</p>
                          </div>
                          <div className="p-3 rounded-xl text-center" style={{ backgroundColor: inputBg }}>
                            <Shield className="w-5 h-5 mx-auto mb-1" style={{ color: accentColor }} />
                            <p className="text-lg font-bold capitalize" style={{ color: textColor }}>
                              {roleLabels[createdLink.role]?.label || createdLink.role}
                            </p>
                            <p className="text-xs" style={{ color: mutedText }}>Rol</p>
                          </div>
                          <div className="p-3 rounded-xl text-center" style={{ backgroundColor: inputBg }}>
                            <Calendar className="w-5 h-5 mx-auto mb-1" style={{ color: accentColor }} />
                            <p className="text-lg font-bold" style={{ color: textColor }}>
                              {new Date(createdLink.expires_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                            </p>
                            <p className="text-xs" style={{ color: mutedText }}>Expira</p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor }}>
                          <button
                            onClick={() => { setBulkStatus('idle'); setCreatedLink(null); }}
                            className="px-4 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                            style={{ color: mutedText }}
                          >
                            Crear otro enlace
                          </button>
                          <button
                            onClick={() => setActiveTab('manage')}
                            className="px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                            style={{ color: textColor }}
                          >
                            Ver todos los enlaces
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleBulkSubmit} className="p-6 space-y-5">
                        {bulkError && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3"
                          >
                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                            <span className="text-sm text-red-400 flex-1">{bulkError}</span>
                          </motion.div>
                        )}

                        {/* Name */}
                        <div>
                          <label className="block text-sm font-medium mb-2" style={{ color: mutedText }}>
                            Nombre del enlace <span style={{ color: mutedText }}>(Opcional)</span>
                          </label>
                          <input
                            type="text"
                            value={bulkForm.name}
                            onChange={(e) => setBulkForm(prev => ({ ...prev, name: e.target.value }))}
                            disabled={bulkStatus === 'loading'}
                            className="w-full px-4 py-3 rounded-xl border focus:outline-none transition-colors disabled:opacity-50"
                            style={{ backgroundColor: inputBg, borderColor, color: textColor }}
                            placeholder="Ej: Invitación Equipo de Ventas"
                            maxLength={100}
                          />
                        </div>

                        {/* Max Uses */}
                        <div>
                          <label className="block text-sm font-medium mb-2" style={{ color: mutedText }}>
                            Número máximo de registros <span className="text-red-400">*</span>
                          </label>
                          <div className="relative">
                            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: mutedText }} />
                            <input
                              type="number"
                              value={bulkForm.maxUses}
                              onChange={(e) => setBulkForm(prev => ({ ...prev, maxUses: parseInt(e.target.value) || 0 }))}
                              required
                              min={1}
                              max={10000}
                              disabled={bulkStatus === 'loading'}
                              className="w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none transition-colors disabled:opacity-50"
                              style={{ backgroundColor: inputBg, borderColor, color: textColor }}
                            />
                          </div>
                          <p className="text-xs mt-1" style={{ color: mutedText }}>
                            Máximo de usuarios que pueden registrarse con este enlace (1-10,000)
                          </p>
                        </div>

                        {/* Role */}
                        <div>
                          <label className="block text-sm font-medium mb-2" style={{ color: mutedText }}>
                            Rol asignado <span className="text-red-400">*</span>
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            {(['member', 'admin', 'owner'] as const).map((role) => (
                              <button
                                key={role}
                                type="button"
                                onClick={() => setBulkForm(prev => ({ ...prev, role }))}
                                disabled={bulkStatus === 'loading'}
                                className="p-3 rounded-xl border text-left transition-all disabled:opacity-50"
                                style={{
                                  backgroundColor: bulkForm.role === role ? (isDark ? `${primaryColor}30` : `${primaryColor}10`) : inputBg,
                                  borderColor: bulkForm.role === role ? primaryColor : borderColor,
                                }}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <Shield className="w-4 h-4" style={{ color: bulkForm.role === role ? (isDark ? '#FFFFFF' : primaryColor) : mutedText }} />
                                  <span className="text-sm font-medium" style={{ color: bulkForm.role === role ? (isDark ? '#FFFFFF' : primaryColor) : textColor }}>
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
                          <label className="block text-sm font-medium mb-2" style={{ color: mutedText }}>
                            Fecha de expiración <span className="text-red-400">*</span>
                          </label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: mutedText }} />
                            <input
                              type="datetime-local"
                              value={bulkForm.expiresAt}
                              onChange={(e) => setBulkForm(prev => ({ ...prev, expiresAt: e.target.value }))}
                              required
                              disabled={bulkStatus === 'loading'}
                              className="w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none transition-colors disabled:opacity-50"
                              style={{ backgroundColor: inputBg, borderColor, color: textColor }}
                              min={new Date().toISOString().slice(0, 16)}
                            />
                          </div>
                        </div>

                        {/* Info */}
                        <div className="p-4 rounded-xl border" style={{ backgroundColor: inputBg, borderColor }}>
                          <div className="flex items-start gap-3">
                            <Sparkles className="w-5 h-5 flex-shrink-0" style={{ color: accentColor }} />
                            <p className="text-sm" style={{ color: mutedText }}>
                              El enlace permitirá que cualquier persona se registre en tu organización con el rol especificado. Puedes pausar o eliminar el enlace en cualquier momento.
                            </p>
                          </div>
                        </div>

                        {/* Submit */}
                        <div className="flex justify-end pt-2">
                          <motion.button
                            type="submit"
                            whileHover={{ scale: bulkStatus === 'loading' ? 1 : 1.02 }}
                            whileTap={{ scale: bulkStatus === 'loading' ? 1 : 0.98 }}
                            disabled={bulkStatus === 'loading'}
                            className="px-5 py-2.5 rounded-xl text-sm font-medium text-white flex items-center gap-2 disabled:opacity-70"
                            style={{ backgroundColor: primaryColor, boxShadow: `0 4px 15px ${primaryColor}40` }}
                          >
                            {bulkStatus === 'loading' ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Creando...</span>
                              </>
                            ) : (
                              <>
                                <Link2 className="w-4 h-4" />
                                <span>Crear Enlace</span>
                              </>
                            )}
                          </motion.button>
                        </div>
                      </form>
                    )}
                  </motion.div>
                )}

                {/* Manage Tab */}
                {activeTab === 'manage' && (
                  <motion.div
                    key="manage"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className="p-6"
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

                    {/* Header with refresh */}
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm" style={{ color: mutedText }}>
                        {links.length} {links.length === 1 ? 'enlace' : 'enlaces'} creados
                      </p>
                      <button
                        onClick={fetchLinks}
                        disabled={linksLoading}
                        className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
                        title="Actualizar"
                      >
                        <RefreshCw className={`w-4 h-4 ${linksLoading ? 'animate-spin' : ''}`} style={{ color: mutedText }} />
                      </button>
                    </div>

                    {linksLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="p-4 rounded-xl border animate-pulse" style={{ backgroundColor: inputBg, borderColor }}>
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
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: inputBg }}>
                          <Link2 className="w-8 h-8" style={{ color: mutedText }} />
                        </div>
                        <h4 className="text-lg font-semibold mb-2" style={{ color: textColor }}>No hay enlaces</h4>
                        <p className="mb-6" style={{ color: mutedText }}>Crea tu primer enlace de invitación masiva</p>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setActiveTab('bulk')}
                          className="px-5 py-2.5 rounded-xl text-sm font-medium text-white inline-flex items-center gap-2"
                          style={{ backgroundColor: primaryColor, boxShadow: `0 4px 15px ${primaryColor}40` }}
                        >
                          <Plus className="w-4 h-4" />
                          Crear Enlace
                        </motion.button>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                        {links.map((link) => {
                          const statusConfig = getStatusConfig(link.status)
                          const StatusIcon = statusConfig.icon
                          const isExpiredOrExhausted = link.status === 'expired' || link.status === 'exhausted'

                          return (
                            <div
                              key={link.id}
                              className="p-4 rounded-xl border transition-colors"
                              style={{ backgroundColor: inputBg, borderColor, opacity: isExpiredOrExhausted ? 0.7 : 1 }}
                            >
                              <div className="flex items-start gap-3">
                                {/* Icon */}
                                <div className="p-2 rounded-lg shrink-0" style={{ backgroundColor: statusConfig.bgColor }}>
                                  <Link2 className="w-4 h-4" style={{ color: statusConfig.color }} />
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-medium truncate text-sm" style={{ color: textColor }}>
                                      {link.name || 'Sin nombre'}
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
                                    <p className="text-xs font-mono truncate flex-1" style={{ color: mutedText }}>
                                      {getInviteUrl(link.token)}
                                    </p>
                                    <button
                                      onClick={() => handleCopyLink(link.token, link.id)}
                                      className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors shrink-0"
                                    >
                                      {copiedId === link.id ? (
                                        <Check className="w-3.5 h-3.5" style={{ color: accentColor }} />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5" style={{ color: mutedText }} />
                                      )}
                                    </button>
                                    <a
                                      href={getInviteUrl(link.token)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors shrink-0"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" style={{ color: mutedText }} />
                                    </a>
                                  </div>

                                  {/* Stats */}
                                  <div className="flex items-center gap-3 text-xs">
                                    <span className="flex items-center gap-1" style={{ color: mutedText }}>
                                      <Users className="w-3 h-3" />
                                      {link.current_uses}/{link.max_uses}
                                    </span>
                                    <span className="flex items-center gap-1" style={{ color: mutedText }}>
                                      <Shield className="w-3 h-3" />
                                      {roleLabels[link.role]?.label || link.role}
                                    </span>
                                    <span className="flex items-center gap-1" style={{ color: mutedText }}>
                                      <Calendar className="w-3 h-3" />
                                      {new Date(link.expires_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                                    </span>
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
                                      <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                                    ) : (
                                      <MoreVertical className="w-4 h-4" style={{ color: mutedText }} />
                                    )}
                                  </button>

                                  <AnimatePresence>
                                    {openMenuId === link.id && (
                                      <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                        className="absolute right-0 top-full mt-1 w-36 rounded-xl border shadow-lg overflow-hidden"
                                        style={{ backgroundColor: isDark ? '#252b3b' : '#FFFFFF', borderColor, zIndex: 10 }}
                                      >
                                        {link.status === 'active' && (
                                          <button
                                            onClick={() => handleLinkAction(link.id, 'pause')}
                                            className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                            style={{ color: textColor }}
                                          >
                                            <Pause className="w-4 h-4" style={{ color: '#F59E0B' }} />
                                            Pausar
                                          </button>
                                        )}
                                        {link.status === 'paused' && (
                                          <button
                                            onClick={() => handleLinkAction(link.id, 'resume')}
                                            className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                            style={{ color: textColor }}
                                          >
                                            <Play className="w-4 h-4" style={{ color: '#22C55E' }} />
                                            Reanudar
                                          </button>
                                        )}
                                        <button
                                          onClick={() => handleLinkAction(link.id, 'delete')}
                                          className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-red-500/10 transition-colors text-red-500"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                          Eliminar
                                        </button>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Click outside to close menu */}
        {openMenuId && (
          <div className="fixed inset-0" style={{ zIndex: 99998 }} onClick={() => setOpenMenuId(null)} />
        )}
      </div>
    </AnimatePresence>
  )
}
