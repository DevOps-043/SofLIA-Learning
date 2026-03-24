'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Link2,
  Shield,
  Users,
  Calendar,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Copy,
  Check,
  ExternalLink
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext'
import { useThemeStore } from '@/core/stores/themeStore'

interface BusinessBulkInviteLinkModalProps {
  isOpen: boolean
  onClose: () => void
  onLinkCreated?: () => void
  organizationSlug?: string
}

type ModalStatus = 'idle' | 'loading' | 'success' | 'error'

interface CreatedLink {
  id: string
  token: string
  name: string | null
  max_uses: number
  role: string
  expires_at: string
}

export function BusinessBulkInviteLinkModal({
  isOpen,
  onClose,
  onLinkCreated,
  organizationSlug
}: BusinessBulkInviteLinkModalProps) {
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

  const [formData, setFormData] = useState({
    name: '',
    maxUses: 100,
    role: 'member' as 'owner' | 'admin' | 'member',
    expiresAt: ''
  })
  const [status, setStatus] = useState<ModalStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [createdLink, setCreatedLink] = useState<CreatedLink | null>(null)
  const [copied, setCopied] = useState(false)

  // Set default expiration date (7 days from now)
  useEffect(() => {
    if (isOpen && !formData.expiresAt) {
      const defaultExpiry = new Date()
      defaultExpiry.setDate(defaultExpiry.getDate() + 7)
      setFormData(prev => ({
        ...prev,
        expiresAt: defaultExpiry.toISOString().slice(0, 16) // Format for datetime-local input
      }))
    }
  }, [isOpen])

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: '',
        maxUses: 100,
        role: 'member',
        expiresAt: ''
      })
      setStatus('idle')
      setError(null)
      setCreatedLink(null)
      setCopied(false)
    }
  }, [isOpen])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'maxUses' ? parseInt(value) || 0 : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setError(null)

    try {
      const response = await fetch(`/api/${orgSlug}/business/invite-links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name || null,
          maxUses: formData.maxUses,
          role: formData.role,
          expiresAt: formData.expiresAt
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

  const getInviteUrl = () => {
    if (!createdLink) return ''
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    return `${baseUrl}/invite/${createdLink.token}`
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

  if (!isOpen) return null

  const roleLabels = {
    member: {
      label: t('users.roles.member', 'Miembro'),
      desc: t('users.modals.bulkInvite.roleDesc.member', 'Acceso básico a la plataforma')
    },
    admin: {
      label: t('users.roles.admin', 'Administrador'),
      desc: t('users.modals.bulkInvite.roleDesc.admin', 'Puede gestionar usuarios y contenido')
    },
    owner: {
      label: t('users.roles.owner', 'Propietario'),
      desc: t('users.modals.bulkInvite.roleDesc.owner', 'Control total de la organización')
    }
  }

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
          className="relative w-full max-w-lg max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="rounded-2xl shadow-2xl overflow-hidden border flex flex-col max-h-full"
            style={{ backgroundColor: isDark ? '#1a1f2e' : '#FFFFFF', borderColor }}
          >
            {/* Header */}
            <div
              className="p-6 border-b"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}20, ${accentColor}10)`,
                borderColor
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="p-2 rounded-xl"
                    style={{ backgroundColor: `${accentColor}20` }}
                  >
                    <Link2 className="w-6 h-6" style={{ color: accentColor }} />
                  </motion.div>
                  <div>
                    <h3 className="text-lg font-semibold" style={{ color: textColor }}>
                      {t('users.modals.bulkInvite.title', 'Crear Enlace de Invitación')}
                    </h3>
                    <p className="text-sm" style={{ color: mutedText }}>
                      {t('users.modals.bulkInvite.subtitle', 'Genera un enlace para invitar múltiples usuarios')}
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
            </div>

            {/* Content */}
            {status === 'success' && createdLink ? (
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
                      <p
                        className="text-sm font-mono truncate"
                        style={{ color: textColor }}
                      >
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
                      {copied ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Copy className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Link Details */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl text-center" style={{ backgroundColor: inputBg }}>
                    <Users className="w-5 h-5 mx-auto mb-1" style={{ color: accentColor }} />
                    <p className="text-lg font-bold" style={{ color: textColor }}>{createdLink.max_uses}</p>
                    <p className="text-xs" style={{ color: mutedText }}>
                      {t('users.modals.bulkInvite.success.maxUsers', 'Máx. usuarios')}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl text-center" style={{ backgroundColor: inputBg }}>
                    <Shield className="w-5 h-5 mx-auto mb-1" style={{ color: accentColor }} />
                    <p className="text-lg font-bold capitalize" style={{ color: textColor }}>
                      {roleLabels[createdLink.role as keyof typeof roleLabels]?.label || createdLink.role}
                    </p>
                    <p className="text-xs" style={{ color: mutedText }}>
                      {t('users.modals.bulkInvite.success.role', 'Rol')}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl text-center" style={{ backgroundColor: inputBg }}>
                    <Calendar className="w-5 h-5 mx-auto mb-1" style={{ color: accentColor }} />
                    <p className="text-lg font-bold" style={{ color: textColor }}>
                      {new Date(createdLink.expires_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                    </p>
                    <p className="text-xs" style={{ color: mutedText }}>
                      {t('users.modals.bulkInvite.success.expires', 'Expira')}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t" style={{ borderColor }}>
                  <button
                    onClick={() => {
                      setStatus('idle')
                      setCreatedLink(null)
                    }}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                    style={{ color: mutedText }}
                  >
                    {t('users.buttons.createAnother', 'Crear otro')}
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium text-white"
                    style={{
                      backgroundColor: primaryColor,
                      boxShadow: `0 4px 15px ${primaryColor}40`
                    }}
                  >
                    {t('users.buttons.done', 'Listo')}
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden h-full">
                <div
                  className="flex-1 overflow-y-auto p-6 space-y-5"
                  style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}
                >
                  {/* Error Message */}
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

                  {/* Name (Optional) */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: mutedText }}>
                      {t('users.modals.bulkInvite.fields.name', 'Nombre del enlace')}
                      <span className="ml-1" style={{ color: mutedText }}>({t('common.optional', 'Opcional')})</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      disabled={status === 'loading'}
                      className="w-full px-4 py-3 rounded-xl border focus:outline-none transition-colors disabled:opacity-50"
                      style={{ backgroundColor: inputBg, borderColor, color: textColor }}
                      placeholder={t('users.modals.bulkInvite.placeholders.name', 'Ej: Invitación Equipo de Ventas')}
                      maxLength={100}
                    />
                  </div>

                  {/* Max Uses */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: mutedText }}>
                      {t('users.modals.bulkInvite.fields.maxUses', 'Número máximo de registros')} <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: mutedText }} />
                      <input
                        type="number"
                        name="maxUses"
                        value={formData.maxUses}
                        onChange={handleChange}
                        required
                        min={1}
                        max={10000}
                        disabled={status === 'loading'}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none transition-colors disabled:opacity-50"
                        style={{ backgroundColor: inputBg, borderColor, color: textColor }}
                      />
                    </div>
                    <p className="text-xs mt-1" style={{ color: mutedText }}>
                      {t('users.modals.bulkInvite.hints.maxUses', 'Máximo de usuarios que pueden registrarse con este enlace (1-10,000)')}
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
                          onClick={() => setFormData(prev => ({ ...prev, role }))}
                          disabled={status === 'loading'}
                          className="p-3 rounded-xl border text-left transition-all disabled:opacity-50"
                          style={{
                            backgroundColor: formData.role === role
                              ? (isDark ? `${primaryColor}30` : `${primaryColor}10`)
                              : inputBg,
                            borderColor: formData.role === role ? primaryColor : borderColor,
                          }}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Shield
                              className="w-4 h-4"
                              style={{ color: formData.role === role ? (isDark ? '#FFFFFF' : primaryColor) : mutedText }}
                            />
                            <span
                              className="text-sm font-medium"
                              style={{ color: formData.role === role ? (isDark ? '#FFFFFF' : primaryColor) : textColor }}
                            >
                              {roleLabels[role].label}
                            </span>
                          </div>
                          <p className="text-xs hidden sm:block" style={{ color: mutedText }}>{roleLabels[role].desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Expiration Date */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: mutedText }}>
                      {t('users.modals.bulkInvite.fields.expiresAt', 'Fecha de expiración')} <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: mutedText }} />
                      <input
                        type="datetime-local"
                        name="expiresAt"
                        value={formData.expiresAt}
                        onChange={handleChange}
                        required
                        disabled={status === 'loading'}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none transition-colors disabled:opacity-50"
                        style={{ backgroundColor: inputBg, borderColor, color: textColor }}
                        min={new Date().toISOString().slice(0, 16)}
                      />
                    </div>
                  </div>

                  {/* Info Note */}
                  <div className="p-4 rounded-xl border" style={{ backgroundColor: inputBg, borderColor }}>
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-5 h-5 flex-shrink-0" style={{ color: accentColor }} />
                      <div className="text-sm" style={{ color: mutedText }}>
                        <p>{t('users.modals.bulkInvite.hints.info', 'El enlace permitirá que cualquier persona se registre en tu organización con el rol especificado. Puedes pausar o eliminar el enlace en cualquier momento.')}</p>
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
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
