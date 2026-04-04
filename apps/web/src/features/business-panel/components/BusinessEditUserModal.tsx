'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, Mail, Shield, Camera, Briefcase, MapPin, Phone, FileText, Sparkles, Edit3 } from 'lucide-react'
import { BusinessUser } from '../services/businessUsers.service'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext'
import { useThemeStore } from '@/core/stores/themeStore'

interface BusinessEditUserModalProps {
  user: BusinessUser | null
  isOpen: boolean
  onClose: () => void
  onSave: (userId: string, userData: {
    first_name?: string
    last_name?: string
    display_name?: string
    email?: string
    cargo_rol?: string
    job_title?: string
    org_role?: 'owner' | 'admin' | 'member'
    org_status?: 'active' | 'invited' | 'suspended' | 'removed'
    profile_picture_url?: string
    bio?: string
    location?: string
    phone?: string
  }) => Promise<void>
}

export function BusinessEditUserModal({ user, isOpen, onClose, onSave }: BusinessEditUserModalProps) {
  const { t } = useTranslation('business')
  const { styles } = useOrganizationStylesContext()
  const panelStyles = styles?.panel
  const { resolvedTheme } = useThemeStore()
  const isDark = resolvedTheme === 'dark'
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Theme Colors
  const primaryColor = panelStyles?.primary_button_color || '#0EA5E9'
  const accentColor = panelStyles?.accent_color || '#10B981'

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    display_name: '',
    email: '',
    cargo_rol: '',
    job_title: '',
    org_role: 'member' as 'owner' | 'admin' | 'member',
    org_status: 'active' as 'active' | 'invited' | 'suspended' | 'removed',
    profile_picture_url: '',
    bio: '',
    location: '',
    phone: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        display_name: user.display_name || '',
        email: user.email || '',
        cargo_rol: user.cargo_rol || '',
        job_title: user.job_title || '',
        org_role: user.org_role || 'member',
        org_status: user.org_status || 'active',
        profile_picture_url: user.profile_picture_url || '',
        bio: user.bio || '',
        location: user.location || '',
        phone: user.phone || ''
      })
      setPreviewImage(user.profile_picture_url || null)
    }
  }, [user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      setError('Tipo de archivo no válido. Solo se permiten PNG, JPEG, JPG y GIF.')
      return
    }

    // Validate size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      setError('El archivo es demasiado grande. Máximo 10MB.')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewImage(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload image
    try {
      setIsUploadingImage(true)
      const formDataUpload = new FormData()
      formDataUpload.append('file', file)

      const response = await fetch('/api/profile/upload-picture', {
        method: 'POST',
        body: formDataUpload,
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al subir imagen')
      }

      const { imageUrl } = await response.json()
      setFormData(prev => ({
        ...prev,
        profile_picture_url: imageUrl
      }))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir imagen')
      setPreviewImage(user?.profile_picture_url || null)
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsLoading(true)
    setError(null)

    try {
      await onSave(user.id, formData)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar usuario')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen || !user) return null

  const displayName = formData.display_name || `${formData.first_name || ''} ${formData.last_name || ''}`.trim() || user.username
  const initials = (formData.first_name?.[0] || user.username[0] || 'U').toUpperCase() + (formData.last_name?.[0] || '').toUpperCase()

  const roleLabels = {
    member: { label: t('users.roles.member'), desc: t('users.modals.add.roleDesc.member') },
    admin: { label: t('users.roles.admin'), desc: t('users.modals.add.roleDesc.admin') },
    owner: { label: t('users.roles.owner'), desc: t('users.modals.add.roleDesc.owner') }
  }

  const statusLabels = {
    active: { label: t('users.status.active'), color: '#10B981' },
    invited: { label: t('users.status.invited'), color: '#F59E0B' },
    suspended: { label: t('users.status.suspended'), color: '#EF4444' },
    removed: { label: t('users.status.removed'), color: '#6B7280' }
  }

    return (
    <AnimatePresence>
      {/* Container - transparent backdrop */}
      <div
        className="fixed inset-0 flex items-center justify-center p-4"
        style={{ zIndex: 99999 }}
      >
        {/* Backdrop - transparent, just for closing */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="rounded-2xl shadow-2xl overflow-hidden border border-white/10"
            style={{ backgroundColor: 'var(--org-card-background, #1a1f2e)' }}
          >
            {/* Two Column Layout - Scrollable */}
            <div className="flex flex-col lg:flex-row max-h-[85vh] overflow-y-auto lg:overflow-hidden">

              {/* Left Side - Preview */}
              <div
                className="lg:w-80 w-full p-4 lg:p-8 flex flex-col border-b lg:border-b-0 lg:border-r border-white/5 shrink-0"
                style={{ background: `linear-gradient(135deg, ${primaryColor}15, ${accentColor}10)` }}
              >
                <div className="flex-1 flex flex-col items-center justify-center py-2 lg:py-0">
                  {/* Avatar Preview with Upload */}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="relative mb-6"
                  >
                    <div
                      className="w-28 h-28 rounded-2xl flex items-center justify-center text-3xl font-bold overflow-hidden"
                      style={{
                        background: previewImage ? 'transparent' : (isDark 
                          ? `linear-gradient(135deg, ${primaryColor}, ${accentColor})`
                          : `linear-gradient(135deg, ${primaryColor}dd, ${accentColor}dd)`
                        ),
                        boxShadow: previewImage ? 'none' : (isDark 
                          ? `0 8px 30px ${primaryColor}40`
                          : `0 8px 30px ${primaryColor}30`
                        ),
                        color: previewImage ? 'transparent' : (isDark ? '#FFFFFF' : '#FFFFFF')
                      }}
                    >
                      {previewImage ? (
                        <Image
                          src={previewImage}
                          alt="Preview"
                          fill
                          className="object-cover"
                          sizes="112px"
                        />
                      ) : (
                        initials
                      )}
                    </div>

                    {/* Camera button */}
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingImage}
                      className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center border-2 shadow-lg disabled:opacity-50"
                      style={{ 
                        backgroundColor: isDark ? primaryColor : primaryColor,
                        borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.3)'
                      }}
                    >
                      {isUploadingImage ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Camera className="w-5 h-5" style={{ color: '#FFFFFF' }} />
                      )}
                    </motion.button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif"
                      onChange={handleImageChange}
                      className="hidden"
                    />

                    {/* Edit badge */}
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute -top-2 -left-2 w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: accentColor }}
                    >
                      <Edit3 className="w-4 h-4 text-white" />
                    </motion.div>
                  </motion.div>

                  {/* User Info Preview */}
                  <h2 className="text-xl font-bold text-white mb-1 text-center">
                    {displayName}
                  </h2>
                  <p className="text-sm text-white/50 text-center mb-3">
                    {formData.email || user.email}
                  </p>

                  {/* Role Badge */}
                  <div className="mb-2">
                    <div className="text-xs text-white/50 mb-1 text-center">
                      {t('users.modals.edit.currentRole')}
                    </div>
                  <div
                      className="px-4 py-2 rounded-full text-sm font-semibold text-center"
                      style={{ 
                        background: isDark 
                          ? `linear-gradient(135deg, ${primaryColor}, ${accentColor})`
                          : `linear-gradient(135deg, ${primaryColor}dd, ${accentColor}dd)`,
                        color: '#FFFFFF',
                        border: `1px solid ${primaryColor}80`,
                        boxShadow: isDark 
                          ? `0 4px 15px ${primaryColor}40`
                          : `0 4px 15px ${primaryColor}30`
                      }}
                  >
                    {roleLabels[formData.org_role].label}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div
                    className="px-3 py-1.5 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: `${statusLabels[formData.org_status].color}20`,
                      color: statusLabels[formData.org_status].color
                    }}
                  >
                    {statusLabels[formData.org_status].label}
                  </div>

                  {/* Type Role Badge */}
                  {formData.job_title && (
                    <div className="mt-4 flex items-center gap-2 text-white/50 text-sm">
                      <Briefcase className="w-4 h-4" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }} />
                      <span>{formData.job_title}</span>
                    </div>
                  )}

                  {/* Location Badge */}
                  {formData.location && (
                    <div className="mt-2 flex items-center gap-2 text-white/40 text-sm">
                      <MapPin className="w-4 h-4" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }} />
                      <span>{formData.location}</span>
                    </div>
                  )}
                </div>

                {/* Info Note */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white/50">
                  <p>{t('users.modals.edit.infoNote')}</p>
                </div>
              </div>

              {/* Right Side - Form */}
              <div className="flex-1 flex flex-col min-w-0 max-h-[85vh] lg:max-h-full overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 lg:p-6 border-b border-white/5 shrink-0">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{t('users.modals.edit.title')}</h3>
                    <p className="text-sm text-white/40 mt-0.5">{t('users.modals.edit.subtitle')}</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <X className="w-5 h-5 text-white/40" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex-1 p-4 lg:p-6 overflow-y-auto space-y-5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent hover:scrollbar-thumb-white/20" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
                    {/* Error */}
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3"
                      >
                        <X className="w-5 h-5 text-red-400 flex-shrink-0" />
                        <span className="text-sm text-red-400 flex-1">{error}</span>
                      </motion.div>
                    )}

                    {/* First Name & Last Name */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">{t('users.modals.add.fields.firstName')}</label>
                        <input
                          type="text"
                          name="first_name"
                          value={formData.first_name}
                          onChange={handleChange}
                          className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors"
                          placeholder={t('users.modals.add.placeholders.firstName')}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">{t('users.modals.add.fields.lastName')}</label>
                        <input
                          type="text"
                          name="last_name"
                          value={formData.last_name}
                          onChange={handleChange}
                          className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors"
                          placeholder={t('users.modals.add.placeholders.lastName')}
                        />
                      </div>
                    </div>

                    {/* Display Name & Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">{t('users.modals.edit.fields.fullName')}</label>
                        <input
                          type="text"
                          name="display_name"
                          value={formData.display_name}
                          onChange={handleChange}
                          className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors"
                          placeholder={t('users.modals.edit.placeholders.fullName')}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">{t('users.modals.add.fields.email')}</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }} />
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors"
                            placeholder={t('users.modals.add.placeholders.email')}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Type Rol & Type Rol (Puesto) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">{t('users.modals.add.fields.position')}</label>
                        <div className="relative">
                          <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }} />
                          <input
                            type="text"
                            name="cargo_rol"
                            value={formData.cargo_rol}
                            onChange={handleChange}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors"
                            placeholder={t('users.modals.add.placeholders.position')}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">{t('users.modals.edit.fields.typeRole')}</label>
                        <input
                          type="text"
                          name="job_title"
                          value={formData.job_title}
                          onChange={handleChange}
                          className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors"
                          placeholder={t('users.modals.edit.placeholders.typeRole')}
                        />
                      </div>
                    </div>

                    {/* Phone & Location */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">{t('users.modals.edit.fields.phone')}</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }} />
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors"
                            placeholder={t('users.modals.edit.placeholders.phone')}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">{t('users.modals.edit.fields.location')}</label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }} />
                          <input
                            type="text"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors"
                            placeholder={t('users.modals.edit.placeholders.location')}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bio */}
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">{t('users.modals.edit.fields.bio')}</label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-3 w-4 h-4" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }} />
                        <textarea
                          name="bio"
                          value={formData.bio}
                          onChange={handleChange}
                          rows={3}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors resize-none"
                          placeholder={t('users.modals.edit.placeholders.bio')}
                        />
                      </div>
                    </div>

                    {/* Org Role */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                      <label 
                          className="block text-sm font-medium"
                        style={{ color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }}
                      >
                        {t('users.modals.add.fields.orgRole')}
                      </label>
                        <div 
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                          style={{ 
                            background: isDark 
                              ? `linear-gradient(135deg, ${primaryColor}40, ${accentColor}30)`
                              : `linear-gradient(135deg, ${primaryColor}30, ${accentColor}20)`,
                            color: isDark ? '#FFFFFF' : primaryColor,
                            border: `1px solid ${primaryColor}60`
                          }}
                        >
                          {t('users.modals.edit.currentRole')}: <span style={{ fontWeight: 'bold' }}>{roleLabels[formData.org_role].label}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 lg:gap-3">
                        {(['member', 'admin', 'owner'] as const).map((role) => (
                          <button
                            key={role}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, org_role: role }))}
                            className={`p-2 lg:p-3 rounded-xl border text-left transition-all ${formData.org_role === role
                              ? 'border-transparent'
                              : 'border-white/10 hover:border-white/20 bg-white/5'
                              }`}
                            style={formData.org_role === role ? {
                              background: `linear-gradient(135deg, ${primaryColor}30, ${accentColor}20)`,
                              borderColor: primaryColor
                            } : {}}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Shield className="w-4 h-4" style={{ color: formData.org_role === role ? '#FFFFFF' : (isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)') }} />
                              <span 
                                className="text-xs lg:text-sm font-medium"
                                style={{ 
                                  color: formData.org_role === role 
                                    ? (isDark ? '#FFFFFF' : '#0F172A')
                                    : (isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)')
                                }}
                              >
                                {roleLabels[role].label}
                              </span>
                            </div>
                            <p 
                              className="text-xs hidden sm:block"
                              style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.5)' }}
                            >
                              {roleLabels[role].desc}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Org Status */}
                    <div>
                      <label 
                        className="block text-sm font-medium mb-2"
                        style={{ color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }}
                      >
                        {t('users.modals.edit.fields.status')}
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 lg:gap-3">
                        {(['active', 'invited', 'suspended', 'removed'] as const).map((status) => (
                          <button
                            key={status}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, org_status: status }))}
                            className={`p-2 lg:p-3 rounded-xl border text-center transition-all ${formData.org_status === status
                              ? 'border-transparent'
                              : isDark ? 'border-white/10 hover:border-white/20 bg-white/5' : 'border-black/10 hover:border-black/20 bg-black/5'
                              }`}
                            style={formData.org_status === status ? {
                              background: `${statusLabels[status].color}20`,
                              borderColor: statusLabels[status].color
                            } : {}}
                          >
                            <span 
                              className="text-xs lg:text-sm font-medium"
                              style={{ 
                                color: formData.org_status === status 
                                  ? statusLabels[status].color
                                  : (isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)')
                              }}
                            >
                              {statusLabels[status].label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="p-4 lg:p-6 border-t border-white/5 flex items-center justify-end gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={isLoading}
                      className="px-4 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                      style={{
                        color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                      }}
                      onMouseEnter={(e) => {
                        if (!isLoading) {
                          e.currentTarget.style.color = isDark ? '#FFFFFF' : '#000000';
                          e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)';
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      {t('users.buttons.cancel')}
                    </button>
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={isLoading || isUploadingImage}
                      className="px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                      style={{
                        background: isDark 
                          ? `linear-gradient(135deg, ${primaryColor}, ${accentColor})`
                          : `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                        color: '#FFFFFF',
                        boxShadow: isDark 
                          ? `0 4px 15px ${primaryColor}40`
                          : `0 4px 15px ${primaryColor}30`
                      }}
                    >
                      {isLoading || isUploadingImage ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          {isUploadingImage ? t('users.buttons.uploading') : t('users.buttons.saving')}
                        </>
                      ) : (
                        t('users.buttons.save')
                      )}
                    </motion.button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
