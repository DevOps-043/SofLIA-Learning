'use client'

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
import { useBusinessUnifiedInviteModalLogic } from '../hooks/useBusinessUnifiedInviteModalLogic'

interface BusinessUnifiedInviteModalProps {
  isOpen: boolean
  onClose: () => void
  onInviteSent?: () => void
  onLinkCreated?: () => void
  organizationId?: string
  organizationSlug?: string
}

export function BusinessUnifiedInviteModal({
  isOpen,
  onClose,
  onInviteSent,
  onLinkCreated,
  organizationId,
  organizationSlug
}: BusinessUnifiedInviteModalProps) {
  const {
    t,
    isDark, textColor, mutedText, borderColor, inputBg,
    primaryColor, accentColor,
    mode, setMode,
    status,
    error,
    individualForm, setIndividualForm,
    successEmail,
    bulkForm, setBulkForm,
    createdLink,
    copied,
    links,
    isLoadingLinks,
    linksError,
    copiedId,
    actionLoading,
    openMenuId, setOpenMenuId,
    roleLabels,
    fetchLinks,
    handleIndividualSubmit,
    handleBulkSubmit,
    getInviteUrl,
    handleCopy,
    handleCopyLink,
    handleLinkAction,
    handleCreateAnother,
    getStatusConfig,
  } = useBusinessUnifiedInviteModalLogic({
    isOpen,
    onClose,
    onInviteSent,
    onLinkCreated,
    organizationId,
    organizationSlug,
  })

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
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="p-2 rounded-xl"
                    style={{ backgroundColor: `${accentColor}20` }}
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
                    <h3 className="text-lg font-semibold" style={{ color: textColor }}>
                      {t('users.modals.unified.title', 'Invitar Usuarios')}
                    </h3>
                    <p className="text-sm" style={{ color: mutedText }}>
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
                  <X className="w-5 h-5" style={{ color: mutedText }} />
                </button>
              </div>

              {/* Mode Tabs */}
              {status !== 'success' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => { setMode('individual'); setError(null); setStatus('idle') }}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all"
                    style={{
                      backgroundColor: mode === 'individual' 
                        ? (isDark ? `${primaryColor}30` : `${primaryColor}15`) 
                        : inputBg,
                      borderColor: mode === 'individual' ? primaryColor : 'transparent',
                      border: mode === 'individual' ? `2px solid ${primaryColor}` : '2px solid transparent',
                      color: mode === 'individual' ? (isDark ? '#FFFFFF' : primaryColor) : mutedText
                    }}
                  >
                    <Mail className="w-4 h-4" />
                    <span className="hidden sm:inline">{t('users.modals.unified.tabs.individual', 'Individual')}</span>
                    <span className="sm:hidden">Email</span>
                  </button>
                  <button
                    onClick={() => { setMode('bulk'); setError(null); setStatus('idle') }}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all"
                    style={{
                      backgroundColor: mode === 'bulk' 
                        ? (isDark ? `${primaryColor}30` : `${primaryColor}15`) 
                        : inputBg,
                      borderColor: mode === 'bulk' ? primaryColor : 'transparent',
                      border: mode === 'bulk' ? `2px solid ${primaryColor}` : '2px solid transparent',
                      color: mode === 'bulk' ? (isDark ? '#FFFFFF' : primaryColor) : mutedText
                    }}
                  >
                    <Link2 className="w-4 h-4" />
                    <span className="hidden sm:inline">{t('users.modals.unified.tabs.bulk', 'Enlace Masivo')}</span>
                    <span className="sm:hidden">Enlace</span>
                  </button>
                  <button
                    onClick={() => { setMode('manage'); setError(null); setStatus('idle') }}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all"
                    style={{
                      backgroundColor: mode === 'manage' 
                        ? (isDark ? `${primaryColor}30` : `${primaryColor}15`) 
                        : inputBg,
                      borderColor: mode === 'manage' ? primaryColor : 'transparent',
                      border: mode === 'manage' ? `2px solid ${primaryColor}` : '2px solid transparent',
                      color: mode === 'manage' ? (isDark ? '#FFFFFF' : primaryColor) : mutedText
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
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t" style={{ borderColor }}>
                    <button
                      onClick={handleCreateAnother}
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
                        color: '#FFFFFF',
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
                    <label className="block text-sm font-medium mb-2" style={{ color: mutedText }}>
                      {t('users.modals.invite.fields.email', 'Correo electrónico')} <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: mutedText }} />
                      <input
                        type="email"
                        value={individualForm.email}
                        onChange={(e) => setIndividualForm(prev => ({ ...prev, email: e.target.value }))}
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
                    <label className="block text-sm font-medium mb-2" style={{ color: mutedText }}>
                      {t('users.modals.invite.fields.position', 'Cargo / Posición')}
                      <span className="ml-1" style={{ color: mutedText }}>({t('common.optional', 'Opcional')})</span>
                    </label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: mutedText }} />
                      <input
                        type="text"
                        value={individualForm.position}
                        onChange={(e) => setIndividualForm(prev => ({ ...prev, position: e.target.value }))}
                        disabled={status === 'loading'}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none transition-colors disabled:opacity-50"
                        style={{ backgroundColor: inputBg, borderColor, color: textColor }}
                        placeholder={t('users.modals.invite.placeholders.position', 'Ej: Gerente de Ventas')}
                        maxLength={100}
                      />
                    </div>
                  </div>

                  {/* Custom Message */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: mutedText }}>
                      {t('users.modals.invite.fields.message', 'Mensaje personalizado')}
                      <span className="ml-1" style={{ color: mutedText }}>({t('common.optional', 'Opcional')})</span>
                    </label>
                    <div className="relative">
                      <MessageSquare className="absolute left-3 top-3 w-4 h-4" style={{ color: mutedText }} />
                      <textarea
                        value={individualForm.customMessage}
                        onChange={(e) => setIndividualForm(prev => ({ ...prev, customMessage: e.target.value }))}
                        disabled={status === 'loading'}
                        rows={3}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none transition-colors resize-none disabled:opacity-50"
                        style={{ backgroundColor: inputBg, borderColor, color: textColor }}
                        placeholder={t('users.modals.invite.placeholders.message', 'Agrega un mensaje personalizado...')}
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
                      color: '#FFFFFF',
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
                    <label className="block text-sm font-medium mb-2" style={{ color: mutedText }}>
                      {t('users.modals.bulkInvite.fields.name', 'Nombre del enlace')}
                      <span className="ml-1" style={{ color: mutedText }}>({t('common.optional', 'Opcional')})</span>
                    </label>
                    <input
                      type="text"
                      value={bulkForm.name}
                      onChange={(e) => setBulkForm(prev => ({ ...prev, name: e.target.value }))}
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
                        value={bulkForm.maxUses}
                        onChange={(e) => setBulkForm(prev => ({ ...prev, maxUses: parseInt(e.target.value) || 0 }))}
                        required
                        min={1}
                        max={10000}
                        disabled={status === 'loading'}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none transition-colors disabled:opacity-50"
                        style={{ backgroundColor: inputBg, borderColor, color: textColor }}
                      />
                    </div>
                    <p className="text-xs mt-1" style={{ color: mutedText }}>
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
                    <label className="block text-sm font-medium mb-2" style={{ color: mutedText }}>
                      {t('users.modals.bulkInvite.fields.expiresAt', 'Fecha de expiración')} <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: mutedText }} />
                      <input
                        type="datetime-local"
                        value={bulkForm.expiresAt}
                        onChange={(e) => setBulkForm(prev => ({ ...prev, expiresAt: e.target.value }))}
                        required
                        disabled={status === 'loading'}
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
                      <div className="text-sm" style={{ color: mutedText }}>
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
                      color: '#FFFFFF',
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
                        {t('users.modals.manageLinks.empty.subtitle', 'Crea tu primer enlace de invitación')}
                      </p>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setMode('bulk')}
                        className="px-5 py-2.5 rounded-xl text-sm font-medium text-white inline-flex items-center gap-2"
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
                            className="p-4 rounded-xl border transition-colors"
                            style={{
                              backgroundColor: inputBg,
                              borderColor,
                              opacity: isExpiredOrExhausted ? 0.7 : 1
                            }}
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
                                  <h4 className="font-medium truncate text-sm" style={{ color: textColor }}>
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
                                  <p className="text-xs font-mono truncate flex-1" style={{ color: mutedText }}>
                                    {getInviteUrl(link.token)}
                                  </p>
                                  <button
                                    onClick={() => handleCopyLink(link)}
                                    className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors shrink-0"
                                  >
                                    {copiedId === link.id ? (
                                      <Check className="w-3.5 h-3.5" style={{ color: accentColor }} />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" style={{ color: mutedText }} />
                                    )}
                                  </button>
                                </div>

                                {/* Stats */}
                                <div className="flex items-center gap-4 text-xs">
                                  <div className="flex items-center gap-1">
                                    <Users className="w-3 h-3" style={{ color: mutedText }} />
                                    <span style={{ color: mutedText }}>
                                      {link.current_uses}/{link.max_uses}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Shield className="w-3 h-3" style={{ color: mutedText }} />
                                    <span style={{ color: mutedText }}>
                                      {roleLabels[link.role as keyof typeof roleLabels]?.label || link.role}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" style={{ color: mutedText }} />
                                    <span style={{ color: mutedText }}>
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
                                  className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
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
                                          className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                          style={{ color: textColor }}
                                        >
                                          <Pause className="w-4 h-4" style={{ color: '#F59E0B' }} />
                                          {t('users.modals.manageLinks.actions.pause', 'Pausar')}
                                        </button>
                                      )}
                                      {link.status === 'paused' && (
                                        <button
                                          onClick={() => handleLinkAction(link.id, 'resume')}
                                          className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                          style={{ color: textColor }}
                                        >
                                          <Play className="w-4 h-4" style={{ color: '#22C55E' }} />
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
                <div className="p-6 border-t flex items-center justify-between shrink-0" style={{ borderColor }}>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={fetchLinks}
                      disabled={isLoadingLinks}
                      className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${isLoadingLinks ? 'animate-spin' : ''}`} style={{ color: mutedText }} />
                    </button>
                    <span className="text-sm" style={{ color: mutedText }}>
                      {links.length} {links.length === 1 ? 'enlace' : 'enlaces'}
                    </span>
                  </div>
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
                      onClick={() => setMode('bulk')}
                      className="px-4 py-2.5 rounded-xl text-sm font-medium text-white flex items-center gap-2"
                      style={{
                        backgroundColor: primaryColor,
                        color: '#FFFFFF',
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
