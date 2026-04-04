'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Building2, Globe, Mail, AlertCircle, Check, CheckCircle, Copy, Info, Loader2, Save, Sparkles, Type, Upload, Users, Image as ImageIcon, Settings2 } from 'lucide-react'
import { useThemeStore } from '@/core/stores/themeStore'
import { type OrganizationData } from '../hooks/useBusinessSettings'

type BrandingData = {
  banner_url?: string
} & Record<string, unknown>

export function OrganizationTab({
  organization,
  updateOrganization,
  branding,
  updateBranding,
  saveSuccess,
  setSaveSuccess,
  saveError,
  setSaveError
}: {
  organization: OrganizationData | null
  updateOrganization: (data: Partial<OrganizationData>) => Promise<boolean>
  branding: BrandingData | null
  updateBranding: (data: BrandingData) => Promise<boolean>
  saveSuccess: string | null
  setSaveSuccess: (msg: string | null) => void
  saveError: string | null
  setSaveError: (msg: string | null) => void
}) {
  const { resolvedTheme } = useThemeStore()
  const isDark = resolvedTheme === 'dark'
  const params = useParams()
  const orgSlug = params?.orgSlug as string | undefined
  const [formData, setFormData] = useState({
    name: organization?.name || '',
    description: organization?.description || '',
    contact_email: organization?.contact_email || '',
    contact_phone: organization?.contact_phone || '',
    website_url: organization?.website_url || '',
    logo_url: organization?.logo_url || '',
    max_users: organization?.max_users?.toString() || '10',
    show_navbar_name: organization?.show_navbar_name ?? true,
    banner_url: branding?.banner_url || '',
    icon_url: organization?.logo_url || ''
  })
  const [isSaving, setIsSaving] = useState(false)
  const [copiedFields, setCopiedFields] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (organization) {
      setFormData(prev => ({
        ...prev,
        name: organization.name || '',
        description: organization.description || '',
        contact_email: organization.contact_email || '',
        contact_phone: organization.contact_phone || '',
        website_url: organization.website_url || '',
        logo_url: organization.logo_url || '',
        max_users: organization.max_users?.toString() || '10',
        show_navbar_name: organization.show_navbar_name ?? true,
        icon_url: organization.logo_url || ''
      }))
    }
    if (branding) {
      setFormData(prev => ({
        ...prev,
        banner_url: branding.banner_url || ''
      }))
    }
  }, [organization, branding])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    // Limpiar mensajes de éxito/error al cambiar datos
    if (saveSuccess) setSaveSuccess(null)
    if (saveError) setSaveError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setSaveError(null)
    setSaveSuccess(null)

    try {
      const updateData: Partial<OrganizationData> = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        contact_email: formData.contact_email.trim() || null,
        contact_phone: formData.contact_phone.trim() || null,
        website_url: formData.website_url.trim() || null,
        logo_url: formData.logo_url.trim() || null,
        max_users: parseInt(formData.max_users),
        show_navbar_name: formData.show_navbar_name
      }

      const successOrg = await updateOrganization(updateData)
      
      // Actualizar branding si cambió el banner
      let successBranding = true
      if (formData.banner_url !== branding?.banner_url) {
        successBranding = await updateBranding({ banner_url: formData.banner_url })
      }

      if (successOrg && successBranding) {
        setSaveSuccess('Datos de la empresa actualizados correctamente')
        setTimeout(() => setSaveSuccess(null), 5000)
      } else {
        setSaveError('Error al actualizar los datos')
        setTimeout(() => setSaveError(null), 5000)
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Error al actualizar los datos')
      setTimeout(() => setSaveError(null), 5000)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDiscard = () => {
    if (organization) {
      setFormData({
        name: organization.name || '',
        description: organization.description || '',
        contact_email: organization.contact_email || '',
        contact_phone: organization.contact_phone || '',
        website_url: organization.website_url || '',
        logo_url: organization.logo_url || '',
        max_users: organization.max_users?.toString() || '10',
        show_navbar_name: organization.show_navbar_name ?? true,
        banner_url: branding?.banner_url || '',
        icon_url: organization.logo_url || ''
      })
      setSaveError(null)
      setSaveSuccess(null)
    }
  }

  const copyToClipboard = (text: string, field: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedFields(prev => ({ ...prev, [field]: true }))
        setTimeout(() => {
          setCopiedFields(prev => ({ ...prev, [field]: false }))
        }, 2000)
      }).catch(() => {
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'fixed'
        textArea.style.opacity = '0'
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        setCopiedFields(prev => ({ ...prev, [field]: true }))
        setTimeout(() => {
          setCopiedFields(prev => ({ ...prev, [field]: false }))
        }, 2000)
      })
    }
  }

  if (!organization) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-16"
      >
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Info className="w-20 h-20 mx-auto mb-6 text-white/60" />
        </motion.div>
        <p className="text-white/80 text-lg">No hay información de organización disponible</p>
      </motion.div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Identidad Visual - Banner e Icono */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-8"
      >
        {/* Banner de la Empresa */}
        <div className="relative rounded-2xl p-6 border backdrop-blur-xl border-gray-200 dark:border-slate-700/30 bg-gray-50 dark:bg-[#0F1419] overflow-hidden group">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-blue-500/10">
              <ImageIcon className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Banner de la Empresa</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Imagen de fondo del panel</p>
            </div>
          </div>

          <motion.div
            className="relative h-32 rounded-xl overflow-hidden mb-4 border-2 border-dashed border-gray-300 dark:border-white/10 flex items-center justify-center cursor-pointer hover:border-blue-500/50 transition-colors"
            onClick={() => {
              const input = document.createElement('input')
              input.type = 'file'
              input.accept = 'image/*'
              input.onchange = async (e) => {
                const file = (e.target as HTMLInputElement).files?.[0]
                if (file) {
                  const formData = new FormData()
                  formData.append('file', file)
                  formData.append('bucket', 'Panel-Business')
                  formData.append('folder', 'Banner-Empresa')
                  try {
                    const response = await fetch('/api/upload', { method: 'POST', body: formData })
                    const result = await response.json()
                    if (result.success && result.url) {
                      setFormData(prev => ({ ...prev, banner_url: result.url }))
                    }
                  } catch (err) {
                    setSaveError('Error al subir el banner')
                  }
                }
              }
              input.click()
            }}
          >
            {formData.banner_url ? (
              <img src={formData.banner_url} alt="Banner Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center">
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-xs text-gray-500 font-medium">Click para subir banner</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Ícono/Logo de la Empresa */}
        <div className="relative rounded-2xl p-6 border backdrop-blur-xl border-gray-200 dark:border-slate-700/30 bg-gray-50 dark:bg-[#0F1419] overflow-hidden group">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-purple-500/10">
              <Sparkles className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Ícono de la Empresa</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Logo principal (formato cuadrado)</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <motion.div
              className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-dashed border-gray-300 dark:border-white/10 flex items-center justify-center cursor-pointer hover:border-purple-500/50 transition-colors bg-white dark:bg-white/5"
              onClick={() => {
                const input = document.createElement('input')
                input.type = 'file'
                input.accept = 'image/*'
                input.onchange = async (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0]
                  if (file) {
                    const formData = new FormData()
                    formData.append('file', file)
                    formData.append('bucket', 'Panel-Business')
                    formData.append('folder', 'Logo-Empresa')
                    try {
                      const response = await fetch('/api/upload', { method: 'POST', body: formData })
                      const result = await response.json()
                      if (result.success && result.url) {
                        setFormData(prev => ({ ...prev, icon_url: result.url, logo_url: result.url }))
                      }
                    } catch (err) {
                      setSaveError('Error al subir el logo')
                    }
                  }
                }
                input.click()
              }}
            >
              {formData.icon_url ? (
                <img src={formData.icon_url} alt="Logo Preview" className="w-full h-full object-contain p-2" />
              ) : (
                <Upload className="w-6 h-6 text-gray-400" />
              )}
            </motion.div>
            <div className="flex-1">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 font-medium">Recomendado: 512x512px. Formato PNG o SVG para mejores resultados.</p>
              <button
                type="button"
                onClick={() => {
                   document.querySelector<HTMLDivElement>('div[onClick][class*="w-24 h-24"]')?.click()
                }}
                className="text-xs font-bold text-purple-500 hover:text-purple-600 transition-colors uppercase tracking-wider"
              >
                Cambiar imagen
              </button>
            </div>
          </div>
        </div>
      </motion.div>
      {/* Información Básica y Contacto - Grid de 2 columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Columna Izquierda: Información Básica */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="relative rounded-2xl p-6 border backdrop-blur-xl space-y-5 overflow-hidden group bg-gray-50 dark:bg-[#0F1419] border-gray-200 dark:border-slate-700/30"
        >
          {/* Decorative gradient background */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
            <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-gradient-to-br from-blue-500/20 to-transparent blur-2xl" />
          </div>

          {/* Header with icon */}
          <div className="relative flex items-center gap-3 mb-6">
            <motion.div
              whileHover={{ rotate: 15, scale: 1.1 }}
              className="p-3 rounded-xl"
              style={{ background: 'linear-gradient(135deg, #0A2540, #1e3a5f)' }}
            >
              <Building2 className="w-5 h-5" style={{ color: '#FFFFFF' }} />
            </motion.div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Información Básica</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Datos principales de tu empresa</p>
            </div>
          </div>

          {/* Form Fields with premium styling */}
          <div className="space-y-4">
            <div className="group/input">
              <label htmlFor="name" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Nombre de la Empresa *
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:border-blue-500/50 focus:shadow-lg focus:shadow-blue-500/10 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="Nombre de tu empresa"
                />
              </div>
            </div>

            {/* Switch Show Name */}
             <div className="flex items-center justify-between p-3 rounded-xl border transition-all duration-300 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 hover:border-blue-500/30">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                         <Type className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                         <p className="text-sm font-semibold text-gray-900 dark:text-white">Mostrar nombre en navbar</p>
                         <p className="text-xs text-gray-500 dark:text-gray-400">Ocultar si el logo ya incluye el nombre</p>
                    </div>
                </div>
                <motion.button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, show_navbar_name: !prev.show_navbar_name }))}
                    whileTap={{ scale: 0.95 }}
                    className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
                    style={{
                        backgroundColor: formData.show_navbar_name ? '#3b82f6' : 'rgba(156, 163, 175, 0.3)'
                    }}
                >
                    <motion.span
                        layout
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ml-1"
                        style={{
                            translateX: formData.show_navbar_name ? 20 : 0
                        }}
                    />
                </motion.button>
            </div>

            <div className="group/input">
              <label htmlFor="description" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Descripción
              </label>
              <div className="relative">
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  maxLength={500}
                  className="w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:border-blue-500/50 focus:shadow-lg focus:shadow-blue-500/10 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 resize-none border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="Describe tu empresa..."
                />
                <div className="absolute bottom-3 right-3 text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400">
                  {formData.description.length}/500
                </div>
              </div>
            </div>

            <div className="group/input">
              <label htmlFor="contact_email" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email de Contacto
                </div>
              </label>
              <input
                type="email"
                id="contact_email"
                name="contact_email"
                value={formData.contact_email}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:border-blue-500/50 focus:shadow-lg focus:shadow-blue-500/10 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="contacto@empresa.com"
              />
            </div>

            <div className="group/input">
              <label htmlFor="website_url" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Sitio Web
                </div>
              </label>
              <input
                type="url"
                id="website_url"
                name="website_url"
                value={formData.website_url}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:border-blue-500/50 focus:shadow-lg focus:shadow-blue-500/10 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="https://www.empresa.com"
              />
            </div>

            <div className="group/input">
              <label htmlFor="max_users" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Límite de usuarios
                </div>
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  id="max_users"
                  name="max_users"
                  value={formData.max_users}
                  onChange={handleChange}
                  min="1"
                  className="flex-1 px-4 py-3 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:border-blue-500/50 focus:shadow-lg focus:shadow-blue-500/10 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="10"
                />
                <span className="text-sm text-gray-500 dark:text-gray-400 px-3 py-2 rounded-lg bg-gray-100 dark:bg-white/5">usuarios</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Columna Derecha: Información de Contacto */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative rounded-2xl p-6 border backdrop-blur-xl space-y-5 overflow-hidden group bg-gray-50 dark:bg-[#0F1419] border-gray-200 dark:border-slate-700/30"
          >
            {/* Decorative gradient background */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
              <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-gradient-to-br from-emerald-500/20 to-transparent blur-2xl" />
            </div>

            {/* Header with icon */}
            <div className="relative flex items-center gap-3 mb-4">
              <motion.div
                whileHover={{ rotate: 15, scale: 1.1 }}
                className="p-3 rounded-xl"
                style={{ background: 'linear-gradient(135deg, #0A2540, #1e3a5f)' }}
              >
                <Mail className="w-5 h-5" style={{ color: '#FFFFFF' }} />
              </motion.div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Información de Contacto</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Datos de contacto de tu organización</p>
              </div>
            </div>

            {/* Contact Fields with Premium Copy Buttons */}
            <div className="space-y-4">
              {[
                { label: 'Nombre de Contacto', value: formData.name, field: 'name' },
                { label: 'Descripción', value: formData.description || '', field: 'description' },
                { label: 'Email de Contacto', value: formData.contact_email || '', field: 'email' }
              ].map((item, index) => (
                <motion.div
                  key={item.field}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    {item.label}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={item.value}
                      readOnly
                      className="flex-1 px-4 py-3 rounded-xl border-2 bg-white dark:bg-white/5 cursor-default border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300"
                    />
                    <motion.button
                      type="button"
                      onClick={() => copyToClipboard(item.value, item.field)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-4 py-3 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 shadow-lg"
                      style={{
                        background: copiedFields[item.field]
                          ? 'linear-gradient(135deg, #10b981, #059669)'
                          : 'linear-gradient(135deg, #0A2540, #1e3a5f)',
                        color: '#ffffff',
                        boxShadow: '0 4px 15px rgba(10, 37, 64, 0.3)'
                      }}
                    >
                      {copiedFields[item.field] ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span className="hidden sm:inline">Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span className="hidden sm:inline">Copiar</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

        </div>
      </div>

      {/* Mensajes de Éxito/Error con animaciones premium */}
      {saveSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="relative overflow-hidden rounded-2xl p-5 flex items-center gap-4"
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.1))',
            border: '1px solid rgba(16, 185, 129, 0.3)'
          }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
          >
            <CheckCircle className="w-6 h-6 text-emerald-400" />
          </motion.div>
          <p className="text-emerald-300 font-medium">{saveSuccess}</p>
          <motion.div
            className="absolute inset-0 opacity-30"
            animate={{ x: ['0%', '100%'] }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.3), transparent)'
            }}
          />
        </motion.div>
      )}

      {saveError && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="relative overflow-hidden rounded-2xl p-5 flex items-center gap-4"
          style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.1))',
            border: '1px solid rgba(239, 68, 68, 0.3)'
          }}
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.5 }}
          >
            <AlertCircle className="w-6 h-6 text-red-400" />
          </motion.div>
          <p className="text-red-300 font-medium">{saveError}</p>
        </motion.div>
      )}

      {/* Botones de Acción Premium */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex justify-between gap-4 pt-4"
      >
        <motion.button
          type="button"
          onClick={handleDiscard}
          whileHover={{ scale: 1.02, x: -2 }}
          whileTap={{ scale: 0.98 }}
          className="px-6 py-3.5 rounded-xl font-semibold transition-all duration-300 border-2 flex items-center gap-2"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderColor: 'rgba(255, 255, 255, 0.2)',
            color: 'rgba(255, 255, 255, 0.8)'
          }}
        >
          <X className="w-5 h-5" />
          Descartar Cambios
        </motion.button>

        <motion.button
          type="submit"
          disabled={isSaving}
          whileHover={{ scale: isSaving ? 1 : 1.02, x: isSaving ? 0 : 2 }}
          whileTap={{ scale: isSaving ? 1 : 0.98 }}
          className="px-8 py-3.5 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 shadow-xl"
          style={{
            background: 'linear-gradient(135deg, var(--org-primary-button-color, #3b82f6), var(--org-secondary-button-color, #8b5cf6))',
            color: '#ffffff',
            boxShadow: '0 8px 30px rgba(59, 130, 246, 0.4)'
          }}
        >
          {isSaving ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 className="w-5 h-5" />
              </motion.div>
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Guardar Cambios
            </>
          )}
        </motion.button>
      </motion.div>
    </form>
  )
}
