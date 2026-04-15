'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, Shield, Send, Sparkles, Briefcase, CheckCircle, AlertCircle, MessageSquare } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { inviteUserAction } from '@/features/auth/actions/invitation'
import { useBusinessPanelTheme } from '../hooks/useBusinessPanelTheme'

interface BusinessInviteUserModalProps {
  isOpen: boolean
  onClose: () => void
  onInviteSent?: () => void
  organizationId?: string
}

type InviteStatus = 'idle' | 'loading' | 'success' | 'error'

export function BusinessInviteUserModal({ isOpen, onClose, onInviteSent, organizationId }: BusinessInviteUserModalProps) {
  const { t } = useTranslation('business')
  const theme = useBusinessPanelTheme()

  const textColor = theme.textColor
  const mutedText = theme.mutedTextColor
  const borderColor = theme.borderColor
  const inputBg = theme.inputBg
  const primaryColor = theme.primaryColor
  const accentColor = theme.accentColor
  const onPrimaryColor = theme.onPrimaryColor
  const dangerColor = theme.dangerColor

  const [formData, setFormData] = useState({
    email: '',
    role: 'member' as 'owner' | 'admin' | 'member',
    position: '',
    customMessage: ''
  })
  const [status, setStatus] = useState<InviteStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        email: '',
        role: 'member',
        position: '',
        customMessage: ''
      })
      setStatus('idle')
      setError(null)
      setSuccessMessage(null)
    }
  }, [isOpen])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setError(null)

    try {
      if (!organizationId) {
        throw new Error(t('users.modals.invite.errorNoOrg'))
      }

      const result = await inviteUserAction({
        email: formData.email,
        role: formData.role,
        organizationId,
        position: formData.position || undefined,
        customMessage: formData.customMessage || undefined
      })

      if (result.error) {
        throw new Error(result.error)
      }

      setStatus('success')
      setSuccessMessage(t('users.modals.invite.success.message', { email: formData.email }))

      // Notificar al padre y cerrar después de un breve delay
      setTimeout(() => {
        onInviteSent?.()
        onClose()
      }, 2000)

    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : t('users.modals.invite.errorSend'))
    }
  }

  if (!isOpen) return null

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

  return (
    <AnimatePresence>
      {/* Container */}
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
          className="absolute inset-0 backdrop-blur-sm"
          style={{ backgroundColor: theme.overlayBg }}
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
            style={{ backgroundColor: theme.panelBg, borderColor }}
          >
            {/* Header */}
            <div
              className="p-6 border-b"
              style={{ background: `linear-gradient(135deg, ${primaryColor}20, ${accentColor}10)`, borderColor }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="p-2 rounded-xl"
                    style={{ backgroundColor: `${accentColor}20` }}
                  >
                    <Mail className="w-6 h-6" style={{ color: accentColor }} />
                  </motion.div>
                  <div>
                    <h3 className="text-lg font-semibold" style={{ color: textColor }}>
                      {t('users.modals.invite.title', 'Invitar Usuario')}
                    </h3>
                    <p className="text-sm" style={{ color: mutedText }}>
                      {t('users.modals.invite.subtitle', 'Envía una invitación por correo electrónico')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg transition-colors"
                  onMouseEnter={(event) => {
                    event.currentTarget.style.backgroundColor = theme.hoverBg
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  <X className="w-5 h-5" style={{ color: mutedText }} />
                </button>
              </div>
            </div>

            {/* Content */}
            {status === 'success' ? (
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
                  {successMessage}
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden h-full">
                <div className="flex-1 overflow-y-auto p-6 space-y-5" style={{ scrollbarWidth: 'thin', scrollbarColor: `${borderColor} transparent` }}>
                  {/* Error Message */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-xl border flex items-center gap-3"
                      style={{ backgroundColor: `${dangerColor}10`, borderColor: `${dangerColor}20` }}
                    >
                      <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: dangerColor }} />
                      <span className="text-sm flex-1" style={{ color: dangerColor }}>{error}</span>
                    </motion.div>
                  )}

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: mutedText }}>
                      {t('users.modals.invite.fields.email', 'Correo electrónico')} <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: mutedText }} />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        disabled={status === 'loading'}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none transition-colors disabled:opacity-50"
                        style={{ backgroundColor: inputBg, borderColor, color: textColor }}
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
                          onClick={() => setFormData(prev => ({ ...prev, role }))}
                          disabled={status === 'loading'}
                          className="p-3 rounded-xl border text-left transition-all disabled:opacity-50"
                          style={{
                            backgroundColor: formData.role === role ? primaryColor : inputBg,
                            borderColor: formData.role === role ? primaryColor : borderColor,
                          }}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Shield
                              className="w-4 h-4"
                              style={{ color: formData.role === role ? onPrimaryColor : mutedText }}
                            />
                            <span 
                              className="text-sm font-medium"
                              style={{ color: formData.role === role ? onPrimaryColor : textColor }}
                            >
                              {roleLabels[role].label}
                            </span>
                          </div>
                          <p className="text-xs hidden sm:block" style={{ color: formData.role === role ? onPrimaryColor : mutedText }}>
                            {roleLabels[role].desc}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Position (Optional) */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: mutedText }}>
                      {t('users.modals.invite.fields.position', 'Cargo / Posición')}
                      <span className="ml-1" style={{ color: mutedText }}>({t('common.optional', 'Opcional')})</span>
                    </label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: mutedText }} />
                      <input
                        type="text"
                        name="position"
                        value={formData.position}
                        onChange={handleChange}
                        disabled={status === 'loading'}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none transition-colors disabled:opacity-50"
                        style={{ backgroundColor: inputBg, borderColor, color: textColor }}
                        placeholder={t('users.modals.invite.placeholders.position', 'Ej: Gerente de Ventas')}
                        maxLength={100}
                      />
                    </div>
                  </div>

                  {/* Custom Message (Optional) */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: mutedText }}>
                      {t('users.modals.invite.fields.message', 'Mensaje personalizado')}
                      <span className="ml-1" style={{ color: mutedText }}>({t('common.optional', 'Opcional')})</span>
                    </label>
                    <div className="relative">
                      <MessageSquare className="absolute left-3 top-3 w-4 h-4" style={{ color: mutedText }} />
                      <textarea
                        name="customMessage"
                        value={formData.customMessage}
                        onChange={handleChange}
                        disabled={status === 'loading'}
                        rows={3}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none transition-colors resize-none disabled:opacity-50"
                        style={{ backgroundColor: inputBg, borderColor, color: textColor }}
                        placeholder={t('users.modals.invite.placeholders.message', 'Agrega un mensaje personalizado para el destinatario...')}
                        maxLength={500}
                      />
                    </div>
                    <p className="text-xs mt-1 text-right" style={{ color: mutedText }}>
                      {formData.customMessage.length}/500
                    </p>
                  </div>

                  {/* Info Note */}
                  <div className="p-4 rounded-xl border" style={{ backgroundColor: inputBg, borderColor }}>
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-5 h-5 flex-shrink-0" style={{ color: accentColor }} />
                      <div className="text-sm" style={{ color: mutedText }}>
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
                    className="px-4 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                    style={{ color: mutedText, backgroundColor: inputBg }}
                    onMouseEnter={(event) => {
                      event.currentTarget.style.backgroundColor = theme.hoverBg
                    }}
                    onMouseLeave={(event) => {
                      event.currentTarget.style.backgroundColor = inputBg
                    }}
                  >
                    {t('users.buttons.cancel', 'Cancelar')}
                  </button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: status === 'loading' ? 1 : 1.02 }}
                    whileTap={{ scale: status === 'loading' ? 1 : 0.98 }}
                    disabled={status === 'loading'}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 disabled:opacity-70"
                    style={{
                      backgroundColor: primaryColor,
                      color: onPrimaryColor,
                      boxShadow: `0 4px 15px ${primaryColor}40`
                    }}
                  >
                    {status === 'loading' ? (
                      <>
                        <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: `${onPrimaryColor}4D`, borderTopColor: onPrimaryColor }} />
                        <span style={{ color: onPrimaryColor }}>
                          {t('users.buttons.sending', 'Enviando...')}
                        </span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" style={{ color: onPrimaryColor }} strokeWidth={2} />
                        <span style={{ color: onPrimaryColor }}>
                          {t('users.buttons.sendInvite', 'Enviar Invitación')}
                        </span>
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
