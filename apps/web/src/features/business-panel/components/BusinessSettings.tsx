'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Building2,
  CreditCard,
  Settings as SettingsIcon,
  Settings2,
  Save,
  Loader2,
  XCircle,
  CheckCircle,
  Calendar,
  Users,
  Globe,
  Mail,
  Phone,
  Image as ImageIcon,
  Info,
  AlertCircle,
  Upload,
  X,
  Palette,
  Type,
  Link as LinkIcon,
  Copy,
  Check,
  FileText,
  ChevronDown,
  MoreVertical,
  Sparkles
} from 'lucide-react'
import { useBusinessSettings, OrganizationData } from '../hooks/useBusinessSettings'
import { Button } from '@aprende-y-aplica/ui'
import Image from 'next/image'
import { ImageUpload } from '../../admin/components/ImageUpload'
import { CloudArrowUpIcon } from '@heroicons/react/24/outline'
import { useSubscriptionFeatures } from '../hooks/useSubscriptionFeatures'
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext'
import { useBranding } from '../hooks/useBranding'
import { BrandingColorPicker } from './BrandingColorPicker'
import { useThemeStore } from '@/core/stores/themeStore'

export function BusinessSettings() {
  const { data, isLoading, error, refetch, updateOrganization } = useBusinessSettings()
  const { branding, isLoading: isLoadingBranding, updateBranding, detectColors } = useBranding()
  const { plan, canUse, refetch: refetchSubscription } = useSubscriptionFeatures()
  const { refetch: refetchStyles } = useOrganizationStylesContext()
  const params = useParams()
  const orgSlug = params?.orgSlug as string | undefined
  const { resolvedTheme } = useThemeStore()
  const isDark = resolvedTheme === 'dark'
  const [activeTab, setActiveTab] = useState<'organization' | 'branding' | 'personalization'>('organization')
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Validar si puede acceder a tabs premium (recalcula cuando el plan cambia)
  const canUseBranding = canUse('corporate_branding')
  const isEnterprise = plan === 'enterprise'

  // Escuchar eventos de cambio de plan y refrescar características
  useEffect(() => {
    const handlePlanChange = () => {
      refetchSubscription()
      refetch()
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('subscription-plan-changed', handlePlanChange)
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('subscription-plan-changed', handlePlanChange)
      }
    }
  }, [refetchSubscription, refetch])

  // Definición de tabs con iconos y colores
  const tabs = [
    { id: 'organization' as const, label: 'Datos de la Empresa', icon: Building2, color: '#3b82f6' },
    ...(canUseBranding ? [{ id: 'branding' as const, label: 'Branding', icon: Palette, color: '#8b5cf6' }] : []),
    // TODO: Habilitar cuando esté lista la sección de Personalización
    // ...(isEnterprise ? [{ id: 'personalization' as const, label: 'Personalización', icon: Settings2, color: '#f59e0b' }] : []),
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen p-6 lg:p-8">
        <div className="flex items-center justify-center py-32">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 rounded-full"
            style={{
              borderColor: 'rgba(var(--org-primary-button-color-rgb, 59, 130, 246), 0.2)',
              borderTopColor: 'var(--org-primary-button-color, #3b82f6)'
            }}
          />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen p-6 lg:p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-20"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <XCircle className="w-20 h-20 text-red-400 mx-auto mb-6" />
          </motion.div>
          <p className="text-red-400 text-xl font-semibold mb-4">{error}</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={refetch}
            className="px-6 py-3 rounded-xl font-medium transition-all shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: '#ffffff'
            }}
          >
            Reintentar
          </motion.button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6 lg:p-8 space-y-8">
      {/* Hero Header - Redesigned */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
        className="relative overflow-hidden rounded-3xl p-8 shadow-xl"
        style={{
          backgroundColor: '#0A2540',
        }}
      >
        {/* Background Image Layer */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/teams-header.png"
            alt="Settings Header"
            fill
            className="object-cover"
            style={{ opacity: 0.5 }}
            priority
          />
        </div>
        
        {/* Blue Gradient Overlay - Crucial for the 'Blue' look while keeping image visible */}
        <div 
            className="absolute inset-0 bg-gradient-to-r from-[#0A2540]/90 via-[#0A2540]/50 to-transparent z-0 pointer-events-none"
        />

        {/* Decorative Particles/Grid - Subtle */}
        <div 
          className="absolute inset-0 opacity-10 z-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(white 1px, transparent 1px)',
            backgroundSize: '30px 30px'
          }}
        />

        {/* Content Layer */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-inner">
              <SettingsIcon className="w-5 h-5" style={{ color: '#FFFFFF' }} />
            </div>
            <span 
              className="text-sm font-bold tracking-widest uppercase drop-shadow-sm"
              style={{ color: 'rgba(219, 234, 254, 0.9)' }}
            >
              Panel de Control
            </span>
          </div>
          
          <h1 
            className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 tracking-tight drop-shadow-md"
            style={{ color: '#FFFFFF' }}
          >
            Configuración
          </h1>
          
          <p 
            className="text-base max-w-2xl leading-relaxed drop-shadow-sm"
            style={{ color: '#EFF6FF' }}
          >
            Gestiona las configuraciones de tu organización
          </p>
        </div>
      </motion.div>

      {/* Premium Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl border overflow-hidden backdrop-blur-xl bg-white dark:bg-[#0F1419] border-gray-200 dark:border-slate-700/30"
      >
        {/* Tab Navigation */}
        <div className="flex border-b overflow-x-auto border-gray-200 dark:border-slate-700/30">
          {tabs.map((tab, index) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className={`relative px-6 py-5 font-medium transition-all duration-300 whitespace-nowrap flex items-center gap-3 group hover:bg-gray-50 dark:hover:bg-white/5
                  ${isActive ? '' : 'text-gray-500 dark:text-gray-400'}
                `}
                style={isActive ? { color: tab.color } : {}}
              >
                {/* Active Indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ backgroundColor: tab.color }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}

                {/* Icon with glow effect */}
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="relative"
                >
                  <Icon className="w-5 h-5" />
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 0.5, scale: 1.5 }}
                      className="absolute inset-0 blur-md"
                      style={{ backgroundColor: tab.color }}
                    />
                  )}
                </motion.div>

                <span className={`transition-all ${isActive ? 'font-semibold' : 'font-medium'}`}>
                  {tab.label}
                </span>

                {/* Hover effect indicator */}
                <motion.div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                  style={{
                    background: `linear-gradient(to right, transparent, ${tab.color}10, transparent)`
                  }}
                />
              </motion.button>
            )
          })}
        </div>

        {/* Tab Content with Animation */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="p-8"
        >
          {activeTab === 'organization' && (
            <>
              <OrganizationTab
                organization={data.organization}
                updateOrganization={updateOrganization}
                branding={branding}
                updateBranding={updateBranding}
                saveSuccess={saveSuccess}
                setSaveSuccess={setSaveSuccess}
                saveError={saveError}
                setSaveError={setSaveError}
              />
              {/* Sección de Login Personalizado y SSO */}
              {data.organization && (
                <div className="mt-8">
                  <LoginPersonalizadoSection
                    organization={data.organization}
                    updateOrganization={updateOrganization}
                  />
                </div>
              )}
            </>
          )}
          {activeTab === 'branding' && canUseBranding && (
            <BrandingTab />
          )}
          {activeTab === 'branding' && !canUseBranding && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <AlertCircle className="w-20 h-20 text-yellow-400 mx-auto mb-6" />
              </motion.div>
              <p className="text-yellow-400 text-xl font-semibold mb-3">Branding Corporativo No Disponible</p>
              <p className="text-white/60 text-base max-w-md mx-auto">
                Esta función solo está disponible en Enterprise. Actualiza tu plan para acceder a esta funcionalidad.
              </p>
            </motion.div>
          )}
          {activeTab === 'personalization' && isEnterprise && (
            <PersonalizationTab
              organization={data.organization}
              updateOrganization={updateOrganization}
              saveSuccess={saveSuccess}
              setSaveSuccess={setSaveSuccess}
              saveError={saveError}
              setSaveError={setSaveError}
            />
          )}
        </motion.div>
      </motion.div>
    </div>
  )
}

// Tab: Datos de la Empresa
function OrganizationTab({
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
  branding: any | null
  updateBranding: (data: any) => Promise<boolean>
  saveSuccess: string | null
  setSaveSuccess: (msg: string | null) => void
  saveError: string | null
  setSaveError: (msg: string | null) => void
}) {
  const { resolvedTheme } = useThemeStore()
  const isDark = resolvedTheme === 'dark'
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

// Componente: Link Personalizado de Login
function LoginPersonalizadoSection({
  organization,
  updateOrganization
}: {
  organization: OrganizationData
  updateOrganization: (data: Partial<OrganizationData>) => Promise<boolean>
}) {
  const { resolvedTheme } = useThemeStore()
  const isDark = resolvedTheme === 'dark'
  const [copiedLogin, setCopiedLogin] = useState(false)
  const [copiedRegister, setCopiedRegister] = useState(false)
  const [baseUrl, setBaseUrl] = useState('')
  const [isUpdatingGoogle, setIsUpdatingGoogle] = useState(false)
  const [isUpdatingMicrosoft, setIsUpdatingMicrosoft] = useState(false)

  useEffect(() => {
    // Obtener URL base del navegador
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin)
    }
  }, [])

  const loginUrl = `${baseUrl}/auth/${organization.slug}`
  const registerUrl = `${baseUrl}/auth/${organization.slug}/register`

  const copyToClipboard = (text: string, type: 'login' | 'register') => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        if (type === 'login') {
          setCopiedLogin(true)
          setTimeout(() => setCopiedLogin(false), 2000)
        } else {
          setCopiedRegister(true)
          setTimeout(() => setCopiedRegister(false), 2000)
        }
      }).catch(() => {
        // Fallback para navegadores antiguos
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'fixed'
        textArea.style.opacity = '0'
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        if (type === 'login') {
          setCopiedLogin(true)
          setTimeout(() => setCopiedLogin(false), 2000)
        } else {
          setCopiedRegister(true)
          setTimeout(() => setCopiedRegister(false), 2000)
        }
      })
    }
  }

  const handleToggleSSO = async (provider: 'google' | 'microsoft', value: boolean) => {
    if (provider === 'google') setIsUpdatingGoogle(true)
    else setIsUpdatingMicrosoft(true)

    try {
      await updateOrganization({
        [`${provider}_login_enabled`]: value
      })
    } finally {
      if (provider === 'google') setIsUpdatingGoogle(false)
      else setIsUpdatingMicrosoft(false)
    }
  }

  const canUseCustomLogin = () => {
    if (!organization.slug) return false
    const allowedPlans = ['team', 'business', 'enterprise']
    const activeStatuses = ['active', 'trial']
    return (
      allowedPlans.includes(organization.subscription_plan || '') &&
      activeStatuses.includes(organization.subscription_status || '') &&
      organization.is_active
    )
  }

  if (!canUseCustomLogin()) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl p-6 border backdrop-blur-xl"
        style={{
          background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.15), rgba(234, 179, 8, 0.05))',
          borderColor: 'rgba(234, 179, 8, 0.3)'
        }}
      >
        <div className="flex items-start gap-4">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="p-3 rounded-xl bg-yellow-500/20"
          >
            <AlertCircle className="w-6 h-6 text-yellow-400" />
          </motion.div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-yellow-400 mb-2">
              Login Personalizado No Disponible
            </h3>
            <p className="text-yellow-300/80 text-sm">
              Para acceder a login personalizado, necesitas una suscripción activa (Team, Business o Enterprise).
            </p>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="relative rounded-2xl p-6 border backdrop-blur-xl overflow-hidden group bg-gray-50 dark:bg-[#0F1419] border-gray-200 dark:border-slate-700/30"
    >
      {/* Decorative gradient background */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-gradient-to-br from-purple-500/20 to-transparent blur-2xl" />
      </div>

      {/* Header with icon */}
      <div className="relative flex items-center gap-3 mb-6">
        <motion.div
          whileHover={{ rotate: 15, scale: 1.1 }}
          className="p-3 rounded-xl"
          style={{ background: 'linear-gradient(135deg, #0A2540, #1e3a5f)' }}
        >
          <LinkIcon className="w-5 h-5" style={{ color: '#FFFFFF' }} />
        </motion.div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Link Personalizado de Login</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Comparte estos links con tus empleados</p>
        </div>
      </div>

      {/* Links de Login y Registro */}
      <div className="space-y-4 mb-6">
        {[
          { label: 'Link de Login', url: loginUrl, copied: copiedLogin, type: 'login' as const },
          { label: 'Link de Registro', url: registerUrl, copied: copiedRegister, type: 'register' as const }
        ].map((item, index) => (
          <motion.div
            key={item.type}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * index }}
          >
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              {item.label}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={item.url}
                readOnly
                className="flex-1 px-4 py-3 rounded-xl text-sm bg-white dark:bg-white/5 border-2 cursor-default border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300"
              />
              <motion.button
                type="button"
                onClick={() => copyToClipboard(item.url, item.type)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-3 rounded-xl transition-all duration-300 flex items-center gap-2 whitespace-nowrap shadow-lg"
                style={{
                  background: item.copied
                    ? 'linear-gradient(135deg, #10b981, #059669)'
                    : 'linear-gradient(135deg, #0A2540, #1e3a5f)',
                  color: '#ffffff',
                  boxShadow: '0 4px 15px rgba(10, 37, 64, 0.3)'
                }}
                title={`Copiar ${item.label.toLowerCase()}`}
              >
                {item.copied ? (
                  <>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <Check className="w-4 h-4" />
                    </motion.div>
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

      {/* Configuración SSO - Premium Design */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mb-6 p-5 rounded-2xl border backdrop-blur-md bg-white dark:bg-white/[0.02] border-gray-200 dark:border-white/10"
      >
        <h4 className="text-base font-semibold mb-5 text-gray-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-500" />
          Inicio de Sesión Social (SSO)
        </h4>
        <div className="space-y-4">
          {/* Google Switch */}
          <motion.div
            className="flex items-center justify-between p-3 rounded-xl transition-all duration-300 hover:bg-gray-50 dark:hover:bg-white/5"
            whileHover={{ x: 2 }}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center p-2 shadow-lg border border-gray-100 dark:border-transparent">
                <svg viewBox="0 0 24 24" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Google</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Permitir iniciar sesión con Google</p>
              </div>
            </div>
            <motion.button
              type="button"
              onClick={() => handleToggleSSO('google', !organization.google_login_enabled)}
              disabled={isUpdatingGoogle}
              whileTap={{ scale: 0.95 }}
              className="relative inline-flex h-7 w-14 items-center rounded-full transition-all duration-300 focus:outline-none shadow-inner"
              style={{
                background: organization.google_login_enabled
                  ? 'linear-gradient(135deg, #0A2540, #1e3a5f)'
                  : 'rgba(156, 163, 175, 0.3)'
              }}
            >
              <motion.span
                animate={{ x: organization.google_login_enabled ? 30 : 4 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="inline-block h-5 w-5 rounded-full bg-white shadow-lg"
              />
            </motion.button>
          </motion.div>

          <div className="h-px bg-gray-200 dark:bg-white/10" />

          {/* Microsoft Switch */}
          <motion.div
            className="flex items-center justify-between p-3 rounded-xl transition-all duration-300 hover:bg-gray-50 dark:hover:bg-white/5"
            whileHover={{ x: 2 }}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center p-2 shadow-lg border border-gray-100 dark:border-transparent">
                <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 23 23">
                  <path fill="#f35022" d="M1 1h10v10H1z" />
                  <path fill="#80bb03" d="M12 1h10v10H12z" />
                  <path fill="#03a5f0" d="M1 12h10v10H1z" />
                  <path fill="#ffba08" d="M12 12h10v10H12z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Microsoft</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Permitir iniciar sesión con Microsoft</p>
              </div>
            </div>
            <motion.button
              type="button"
              onClick={() => handleToggleSSO('microsoft', !organization.microsoft_login_enabled)}
              disabled={isUpdatingMicrosoft}
              whileTap={{ scale: 0.95 }}
              className="relative inline-flex h-7 w-14 items-center rounded-full transition-all duration-300 focus:outline-none shadow-inner"
              style={{
                background: organization.microsoft_login_enabled
                  ? 'linear-gradient(135deg, #0A2540, #1e3a5f)'
                  : 'rgba(156, 163, 175, 0.3)'
              }}
            >
              <motion.span
                animate={{ x: organization.microsoft_login_enabled ? 30 : 4 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="inline-block h-5 w-5 rounded-full bg-white shadow-lg"
              />
            </motion.button>
          </motion.div>
        </div>
      </motion.div>

      {/* Información adicional - Premium Info Box */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-2xl p-5 border relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(139, 92, 246, 0.1))',
          borderColor: 'rgba(59, 130, 246, 0.3)'
        }}
      >
        <div className="flex items-start gap-4 relative z-10">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="p-2 rounded-lg bg-blue-500/20"
          >
            <Info className="w-5 h-5 text-blue-400" />
          </motion.div>
          <div className="flex-1">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong className="text-blue-800 dark:text-blue-200">Nota:</strong> Los usuarios que accedan a estos links verán el login personalizado con tu logo y nombre de empresa.
              Si intentan acceder al login principal, serán redirigidos automáticamente a tu login personalizado.
            </p>
          </div>
        </div>
        {/* Subtle animated gradient */}
        <motion.div
          className="absolute inset-0 opacity-30 pointer-events-none"
          animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.2), transparent)',
            backgroundSize: '200% 100%'
          }}
        />
      </motion.div>
    </motion.div>
  )
}

// Tab: Personalización (Enterprise only)
function PersonalizationTab({
  organization,
  updateOrganization,
  saveSuccess,
  setSaveSuccess,
  saveError,
  setSaveError
}: {
  organization: OrganizationData | null
  updateOrganization: (data: Partial<OrganizationData>) => Promise<boolean>
  saveSuccess: string | null
  setSaveSuccess: (msg: string | null) => void
  saveError: string | null
  setSaveError: (msg: string | null) => void
}) {
  const [slug, setSlug] = useState(organization?.slug || '')
  const [isSaving, setIsSaving] = useState(false)
  const [slugError, setSlugError] = useState<string | null>(null)
  const [isCheckingSlug, setIsCheckingSlug] = useState(false)
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)
  const [copiedLogin, setCopiedLogin] = useState(false)
  const [copiedRegister, setCopiedRegister] = useState(false)
  const [baseUrl, setBaseUrl] = useState('')
  const [isUpdatingGoogle, setIsUpdatingGoogle] = useState(false)
  const [isUpdatingMicrosoft, setIsUpdatingMicrosoft] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin)
    }
  }, [])

  useEffect(() => {
    if (organization?.slug) {
      setSlug(organization.slug)
    }
  }, [organization?.slug])

  const loginUrl = slug ? `${baseUrl}/auth/${slug}` : ''
  const registerUrl = slug ? `${baseUrl}/auth/${slug}/register` : ''

  // Validar formato del slug
  const validateSlug = (value: string): string | null => {
    if (!value) return 'El identificador es requerido'
    if (value.length < 3) return 'Mínimo 3 caracteres'
    if (value.length > 50) return 'Máximo 50 caracteres'
    if (!/^[a-z0-9-]+$/.test(value)) return 'Solo letras minúsculas, números y guiones'
    if (value.startsWith('-') || value.endsWith('-')) return 'No puede empezar o terminar con guión'
    return null
  }

  // Verificar disponibilidad del slug (debounced)
  useEffect(() => {
    const checkSlugAvailability = async () => {
      if (!slug || slug === organization?.slug) {
        setSlugAvailable(null)
        return
      }

      const error = validateSlug(slug)
      if (error) {
        setSlugError(error)
        setSlugAvailable(null)
        return
      }

      setIsCheckingSlug(true)
      setSlugError(null)

      try {
        const fetchUrl = orgSlug 
          ? `/api/${orgSlug}/business/settings/check-slug?slug=${encodeURIComponent(slug)}`
          : `/api/business/settings/check-slug?slug=${encodeURIComponent(slug)}`;

        const response = await fetch(fetchUrl, {
          credentials: 'include'
        })
        const data = await response.json()
        
        if (data.success) {
          setSlugAvailable(data.available)
          if (!data.available) {
            setSlugError('Este identificador ya está en uso')
          }
        }
      } catch (err) {
        // console.error('Error checking slug:', err)
      } finally {
        setIsCheckingSlug(false)
      }
    }

    const debounceTimeout = setTimeout(checkSlugAvailability, 500)
    return () => clearTimeout(debounceTimeout)
  }, [slug, organization?.slug])

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
    setSlug(value)
    setSlugAvailable(null)
    
    const error = validateSlug(value)
    setSlugError(error)
  }

  const handleSaveSlug = async () => {
    if (!slug || slugError || !slugAvailable) return

    setIsSaving(true)
    setSaveError(null)
    setSaveSuccess(null)

    try {
      const success = await updateOrganization({ slug })
      
      if (success) {
        setSaveSuccess('Identificador de login guardado correctamente')
        setTimeout(() => setSaveSuccess(null), 5000)
        setSlugAvailable(null)
      } else {
        setSaveError('Error al guardar el identificador')
        setTimeout(() => setSaveError(null), 5000)
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Error al guardar')
      setTimeout(() => setSaveError(null), 5000)
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleSSO = async (provider: 'google' | 'microsoft', value: boolean) => {
    if (provider === 'google') setIsUpdatingGoogle(true)
    else setIsUpdatingMicrosoft(true)

    try {
      await updateOrganization({
        [`${provider}_login_enabled`]: value
      })
    } finally {
      if (provider === 'google') setIsUpdatingGoogle(false)
      else setIsUpdatingMicrosoft(false)
    }
  }

  const copyToClipboard = (text: string, type: 'login' | 'register') => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        if (type === 'login') {
          setCopiedLogin(true)
          setTimeout(() => setCopiedLogin(false), 2000)
        } else {
          setCopiedRegister(true)
          setTimeout(() => setCopiedRegister(false), 2000)
        }
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
        <Info className="w-20 h-20 mx-auto mb-6 text-white/60" />
        <p className="text-white/80 text-lg">No hay información de organización disponible</p>
      </motion.div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header de la sección */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20"
      >
        <div className="p-3 rounded-xl bg-amber-500/20">
          <Settings2 className="w-6 h-6 text-amber-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Login Personalizado</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Configura tu enlace de inicio de sesión exclusivo y opciones de SSO</p>
        </div>
      </motion.div>

      {/* Configuración del Slug */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="relative rounded-2xl p-6 border backdrop-blur-xl overflow-hidden group bg-gray-50 dark:bg-[#0F1419] border-gray-200 dark:border-slate-700/30"
      >
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-gradient-to-br from-amber-500/20 to-transparent blur-2xl" />
        </div>

        <div className="relative flex items-center gap-3 mb-6">
          <motion.div
            whileHover={{ rotate: 15, scale: 1.1 }}
            className="p-3 rounded-xl"
            style={{ background: 'linear-gradient(135deg, #0A2540, #1e3a5f)' }}
          >
            <LinkIcon className="w-5 h-5" style={{ color: '#FFFFFF' }} />
          </motion.div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Identificador de URL</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Define el identificador único para tu link de login</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Identificador (slug) *
            </label>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <div className="flex items-center">
                  <span className="px-4 py-3 rounded-l-xl border-2 border-r-0 bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 text-sm border-gray-200 dark:border-white/10">
                    {baseUrl}/auth/
                  </span>
                  <input
                    type="text"
                    value={slug}
                    onChange={handleSlugChange}
                    placeholder="mi-empresa"
                    className={`flex-1 px-4 py-3 rounded-r-xl border-2 transition-all duration-300 focus:outline-none bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 ${
                      slugError 
                        ? 'border-red-500 focus:border-red-500' 
                        : slugAvailable === true 
                          ? 'border-green-500 focus:border-green-500' 
                          : 'border-gray-200 dark:border-white/10 focus:border-amber-500'
                    }`}
                  />
                </div>
                {isCheckingSlug && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-amber-500/30 border-t-amber-500 rounded-full"
                    />
                  </div>
                )}
                {!isCheckingSlug && slugAvailable === true && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                )}
              </div>
              <motion.button
                type="button"
                onClick={handleSaveSlug}
                disabled={isSaving || !slug || !!slugError || slugAvailable !== true}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: '#ffffff'
                }}
              >
                {isSaving ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Loader2 className="w-4 h-4" />
                    </motion.div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Guardar
                  </>
                )}
              </motion.button>
            </div>
            {slugError && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-400 mt-2 flex items-center gap-1"
              >
                <AlertCircle className="w-4 h-4" />
                {slugError}
              </motion.p>
            )}
            {slugAvailable === true && !slugError && slug !== organization?.slug && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-green-400 mt-2 flex items-center gap-1"
              >
                <CheckCircle className="w-4 h-4" />
                Identificador disponible
              </motion.p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Links de Login (solo si hay slug configurado) */}
      {organization.slug && (
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="relative rounded-2xl p-6 border backdrop-blur-xl overflow-hidden group bg-gray-50 dark:bg-[#0F1419] border-gray-200 dark:border-slate-700/30"
        >
          <div className="relative flex items-center gap-3 mb-6">
            <motion.div
              whileHover={{ rotate: 15, scale: 1.1 }}
              className="p-3 rounded-xl"
              style={{ background: isDark ? 'linear-gradient(135deg, #0A2540, #1e3a5f)' : 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
            >
              <LinkIcon className="w-5 h-5" style={{ color: '#FFFFFF' }} />
            </motion.div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Links de Acceso</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Comparte estos links con tus empleados</p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              { label: 'Link de Login', url: loginUrl, copied: copiedLogin, type: 'login' as const },
              { label: 'Link de Registro', url: registerUrl, copied: copiedRegister, type: 'register' as const }
            ].map((item, index) => (
              <motion.div
                key={item.type}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  {item.label}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={item.url}
                    readOnly
                    className="flex-1 px-4 py-3 rounded-xl text-sm bg-white dark:bg-white/5 border-2 cursor-default border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300"
                  />
                  <motion.button
                    type="button"
                    onClick={() => copyToClipboard(item.url, item.type)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-3 rounded-xl transition-all duration-300 flex items-center gap-2 whitespace-nowrap shadow-lg"
                    style={{
                      background: item.copied
                        ? 'linear-gradient(135deg, #10b981, #059669)'
                        : 'linear-gradient(135deg, #0A2540, #1e3a5f)',
                      color: '#ffffff'
                    }}
                  >
                    {item.copied ? (
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
      )}

      {/* Configuración SSO */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        className="relative rounded-2xl p-6 border backdrop-blur-xl overflow-hidden group bg-gray-50 dark:bg-[#0F1419] border-gray-200 dark:border-slate-700/30"
      >
        <div className="relative flex items-center gap-3 mb-6">
          <motion.div
            whileHover={{ rotate: 15, scale: 1.1 }}
            className="p-3 rounded-xl"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}
          >
            <Sparkles className="w-5 h-5 text-white" />
          </motion.div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Inicio de Sesión Social (SSO)</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Permite a tus usuarios iniciar sesión con sus cuentas de Google o Microsoft</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Google Switch */}
          <motion.div
            className="flex items-center justify-between p-4 rounded-xl border transition-all duration-300 hover:bg-gray-100 dark:hover:bg-white/5 bg-white dark:bg-white/[0.02] border-gray-200 dark:border-white/10"
            whileHover={{ x: 2 }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center p-2.5 shadow-lg border border-gray-100 dark:border-transparent">
                <svg viewBox="0 0 24 24" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              </div>
              <div>
                <p className="text-base font-semibold text-gray-900 dark:text-white">Google</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Permitir inicio de sesión con Google</p>
              </div>
            </div>
            <motion.button
              type="button"
              onClick={() => handleToggleSSO('google', !organization.google_login_enabled)}
              disabled={isUpdatingGoogle}
              whileTap={{ scale: 0.95 }}
              className="relative inline-flex h-8 w-16 items-center rounded-full transition-all duration-300 focus:outline-none shadow-inner"
              style={{
                background: organization.google_login_enabled
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : 'rgba(156, 163, 175, 0.3)'
              }}
            >
              <motion.span
                animate={{ x: organization.google_login_enabled ? 34 : 4 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="inline-block h-6 w-6 rounded-full bg-white shadow-lg"
              />
            </motion.button>
          </motion.div>

          {/* Microsoft Switch */}
          <motion.div
            className="flex items-center justify-between p-4 rounded-xl border transition-all duration-300 hover:bg-gray-100 dark:hover:bg-white/5 bg-white dark:bg-white/[0.02] border-gray-200 dark:border-white/10"
            whileHover={{ x: 2 }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center p-2.5 shadow-lg border border-gray-100 dark:border-transparent">
                <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 23 23">
                  <path fill="#f35022" d="M1 1h10v10H1z" />
                  <path fill="#80bb03" d="M12 1h10v10H12z" />
                  <path fill="#03a5f0" d="M1 12h10v10H1z" />
                  <path fill="#ffba08" d="M12 12h10v10H12z" />
                </svg>
              </div>
              <div>
                <p className="text-base font-semibold text-gray-900 dark:text-white">Microsoft</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Permitir inicio de sesión con Microsoft</p>
              </div>
            </div>
            <motion.button
              type="button"
              onClick={() => handleToggleSSO('microsoft', !organization.microsoft_login_enabled)}
              disabled={isUpdatingMicrosoft}
              whileTap={{ scale: 0.95 }}
              className="relative inline-flex h-8 w-16 items-center rounded-full transition-all duration-300 focus:outline-none shadow-inner"
              style={{
                background: organization.microsoft_login_enabled
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : 'rgba(156, 163, 175, 0.3)'
              }}
            >
              <motion.span
                animate={{ x: organization.microsoft_login_enabled ? 34 : 4 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="inline-block h-6 w-6 rounded-full bg-white shadow-lg"
              />
            </motion.button>
          </motion.div>
        </div>
      </motion.div>

      {/* Info Box */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-2xl p-5 border relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(139, 92, 246, 0.1))',
          borderColor: 'rgba(59, 130, 246, 0.3)'
        }}
      >
        <div className="flex items-start gap-4 relative z-10">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="p-2 rounded-lg bg-blue-500/20"
          >
            <Info className="w-5 h-5 text-blue-400" />
          </motion.div>
          <div className="flex-1">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong className="text-blue-800 dark:text-blue-200">Nota:</strong> Los usuarios que accedan a tu link personalizado verán el login con tu logo y branding.
              Si habilitas SSO, podrán elegir iniciar sesión con Google o Microsoft además de email/contraseña.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Mensajes de éxito/error */}
      {saveSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="relative overflow-hidden rounded-2xl p-5 flex items-center gap-4"
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.1))',
            border: '1px solid rgba(16, 185, 129, 0.3)'
          }}
        >
          <CheckCircle className="w-6 h-6 text-emerald-400" />
          <p className="text-emerald-300 font-medium">{saveSuccess}</p>
        </motion.div>
      )}

      {saveError && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="relative overflow-hidden rounded-2xl p-5 flex items-center gap-4"
          style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.1))',
            border: '1px solid rgba(239, 68, 68, 0.3)'
          }}
        >
          <AlertCircle className="w-6 h-6 text-red-400" />
          <p className="text-red-300 font-medium">{saveError}</p>
        </motion.div>
      )}
    </div>
  )
}

// Tab: Branding
function BrandingTab() {
  const { branding, isLoading, error, updateBranding, detectColors } = useBranding()
  const { refetch: refetchStyles } = useOrganizationStylesContext()
  const [isSaving, setIsSaving] = useState(false)
  const [isDetecting, setIsDetecting] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [localBranding, setLocalBranding] = useState({
    favicon_url: '',
    banner_url: '',
    color_primary: '#3b82f6',
    color_secondary: '#10b981',
    color_accent: '#8b5cf6'
  })
  const isInitialLoad = useRef(true)
  const previousBannerUrl = useRef<string>('')

  // Sincronizar estado local cuando se carga el branding
  useEffect(() => {
    if (branding) {
      setLocalBranding({
        favicon_url: branding.favicon_url || '',
        banner_url: branding.banner_url || '',
        color_primary: branding.color_primary,
        color_secondary: branding.color_secondary,
        color_accent: branding.color_accent
      })
      previousBannerUrl.current = branding.banner_url || ''
      isInitialLoad.current = false
    }
  }, [branding])

  // Detectar colores automáticamente cuando se sube un nuevo banner
  useEffect(() => {
    // No detectar en la carga inicial
    if (isInitialLoad.current) return

    // Solo detectar si el banner_url cambió y no es vacío
    if (localBranding.banner_url &&
      localBranding.banner_url !== previousBannerUrl.current &&
      localBranding.banner_url.trim() !== '') {

      // Actualizar la referencia
      previousBannerUrl.current = localBranding.banner_url

      // Detectar colores automáticamente
      const autoDetectColors = async () => {
        setIsDetecting(true)
        setSaveError(null)
        setSaveSuccess(null)

        try {
          const colors = await detectColors(localBranding.banner_url)

          if (colors && colors.color_primary && colors.color_secondary && colors.color_accent) {
            setLocalBranding(prev => ({
              ...prev,
              color_primary: colors.color_primary,
              color_secondary: colors.color_secondary,
              color_accent: colors.color_accent
            }))
            setSaveSuccess('Colores detectados automáticamente')
            setTimeout(() => setSaveSuccess(null), 5000)
          }
        } catch (err) {
          console.error('Error detectando colores automáticamente:', err)
          // No mostrar error si falla la detección automática, solo loguear
        } finally {
          setIsDetecting(false)
        }
      }

      // Pequeño delay para asegurar que la imagen esté cargada
      setTimeout(() => {
        autoDetectColors()
      }, 500)
    }
  }, [localBranding.banner_url, detectColors])

  const handleSave = async () => {
    setIsSaving(true)
    setSaveError(null)
    setSaveSuccess(null)

    try {
      const success = await updateBranding(localBranding)

      if (success) {
        setSaveSuccess('Branding actualizado correctamente')
        setTimeout(() => setSaveSuccess(null), 5000)
        // Refrescar estilos para aplicar cambios
        await refetchStyles()
      } else {
        setSaveError('Error al actualizar el branding')
        setTimeout(() => setSaveError(null), 5000)
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Error al actualizar el branding')
      setTimeout(() => setSaveError(null), 5000)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDetectColors = async () => {
    if (!localBranding.banner_url) {
      setSaveError('Primero debes subir un banner')
      setTimeout(() => setSaveError(null), 5000)
      return
    }

    setIsDetecting(true)
    setSaveError(null)
    setSaveSuccess(null)

    try {
      // Validar que la URL del banner sea válida
      if (!localBranding.banner_url || typeof localBranding.banner_url !== 'string') {
        throw new Error('URL del banner inválida')
      }

      // Usar la función de detección de colores del hook (ahora es cliente)
      const colors = await detectColors(localBranding.banner_url)

      if (colors && colors.color_primary && colors.color_secondary && colors.color_accent) {
        setLocalBranding(prev => ({
          ...prev,
          color_primary: colors.color_primary,
          color_secondary: colors.color_secondary,
          color_accent: colors.color_accent
        }))
        setSaveSuccess('Colores detectados automáticamente')
        setTimeout(() => setSaveSuccess(null), 5000)
      } else {
        throw new Error('No se pudieron detectar colores del banner. Asegúrate de que la imagen sea accesible.')
      }
    } catch (err) {
      console.error('Error detectando colores:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error al detectar colores'
      setSaveError(errorMessage)
      setTimeout(() => setSaveError(null), 5000)
    } finally {
      setIsDetecting(false)
    }
  }

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-24"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="w-20 h-20 rounded-full mb-6"
          style={{
            border: '4px solid rgba(255, 255, 255, 0.1)',
            borderTopColor: 'var(--org-primary-button-color, #3b82f6)'
          }}
        />
        <p className="text-white/60">Cargando configuración de marca...</p>
      </motion.div>
    )
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-20"
      >
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <XCircle className="w-20 h-20 mx-auto mb-6 text-red-400" />
        </motion.div>
        <p className="text-lg mb-4 text-red-300">{error}</p>
      </motion.div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Main Grid - Logo y Favicon lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Card: Logo Principal - Más compacto */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative overflow-hidden rounded-2xl p-5 border backdrop-blur-xl group"
          style={{
            backgroundColor: 'rgba(var(--org-card-background-rgb, 15, 23, 42), 0.6)',
            borderColor: 'rgba(255, 255, 255, 0.1)'
          }}
        >
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
            <div className="absolute -top-16 -right-16 w-32 h-32 rounded-full bg-gradient-to-br from-blue-500/20 to-transparent blur-2xl" />
          </div>

          <div className="relative z-10">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <motion.div
                whileHover={{ rotate: 15, scale: 1.1 }}
                className="p-2.5 rounded-xl"
                style={{ background: `linear-gradient(135deg, ${localBranding.color_primary}, ${localBranding.color_secondary})` }}
              >
                <ImageIcon className="w-4 h-4 text-white" />
              </motion.div>
              <div>
                <h3 className="text-base font-bold text-white">Logo Principal</h3>
                <p className="text-xs text-white/50">Tu imagen de marca</p>
              </div>
            </div>

            {/* Logo Preview Zone - Más pequeño */}
            <motion.div
              className="relative mb-4 rounded-xl overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(245,245,245,0.95))',
                height: '120px'
              }}
            >
              {localBranding.banner_url ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center justify-center h-full p-4"
                >
                  <img
                    src={localBranding.banner_url}
                    alt="Logo preview"
                    className="max-w-full max-h-full object-contain"
                  />
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <ImageIcon className="w-10 h-10 mb-2 opacity-50" />
                  <p className="text-xs">Sin logo</p>
                </div>
              )}

              {/* Detecting Overlay */}
              {isDetecting && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-8 h-8 border-3 rounded-full mb-2"
                    style={{ borderColor: 'transparent', borderTopColor: localBranding.color_primary }}
                  />
                  <p className="text-white text-xs">Detectando colores...</p>
                </motion.div>
              )}
            </motion.div>

            {/* Upload Zone - Compacto */}
            <motion.div
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
                        setLocalBranding(prev => ({ ...prev, banner_url: result.url }))
                      }
                    } catch (err) {
                      setSaveError('Error al subir la imagen')
                      setTimeout(() => setSaveError(null), 5000)
                    }
                  }
                }
                input.click()
              }}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
              onDrop={async (e) => {
                e.preventDefault()
                e.stopPropagation()
                const file = e.dataTransfer.files[0]
                if (file && file.type.startsWith('image/')) {
                  const formData = new FormData()
                  formData.append('file', file)
                  formData.append('bucket', 'Panel-Business')
                  formData.append('folder', 'Logo-Empresa')
                  try {
                    const response = await fetch('/api/upload', { method: 'POST', body: formData })
                    const result = await response.json()
                    if (result.success && result.url) {
                      setLocalBranding(prev => ({ ...prev, banner_url: result.url }))
                    }
                  } catch (err) {
                    setSaveError('Error al subir la imagen')
                    setTimeout(() => setSaveError(null), 5000)
                  }
                }
              }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-300"
              style={{ borderColor: 'rgba(255, 255, 255, 0.15)' }}
            >
              <Upload className="w-6 h-6 mx-auto mb-2 text-white/50" />
              <p className="text-white/70 text-sm font-medium">Arrastra o haz clic</p>
              <p className="text-white/40 text-xs mt-1">PNG, JPG hasta 5MB</p>
            </motion.div>
          </div>
        </motion.div>

        {/* Card: Favicon con Preview de Auth/Login */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="relative overflow-hidden rounded-2xl p-5 border backdrop-blur-xl group"
          style={{
            backgroundColor: 'rgba(var(--org-card-background-rgb, 15, 23, 42), 0.6)',
            borderColor: 'rgba(255, 255, 255, 0.1)'
          }}
        >
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
            <div className="absolute -top-16 -left-16 w-32 h-32 rounded-full bg-gradient-to-br from-purple-500/20 to-transparent blur-2xl" />
          </div>

          <div className="relative z-10">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <motion.div
                whileHover={{ rotate: 15, scale: 1.1 }}
                className="p-2.5 rounded-xl"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}
              >
                <Globe className="w-4 h-4 text-white" />
              </motion.div>
              <div>
                <h3 className="text-base font-bold text-white">Favicon & Login</h3>
                <p className="text-xs text-white/50">Vista previa del login</p>
              </div>
            </div>

            {/* Auth/Login Preview Mockup */}
            <motion.div
              className="mb-4 rounded-xl overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${localBranding.color_primary}15, ${localBranding.color_secondary}10)`,
                border: `1px solid ${localBranding.color_primary}30`,
                height: '120px'
              }}
            >
              <div className="h-full flex items-center justify-center p-3">
                <div className="flex items-center gap-4">
                  {/* Logo/Favicon preview */}
                  <div className="flex-shrink-0">
                    {localBranding.favicon_url ? (
                      <motion.img
                        src={localBranding.favicon_url}
                        alt="Favicon"
                        className="w-14 h-14 object-contain"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring" }}
                      />
                    ) : (
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${localBranding.color_primary}30` }}
                      >
                        <Globe className="w-7 h-7" style={{ color: localBranding.color_primary }} />
                      </div>
                    )}
                  </div>

                  {/* Login form preview */}
                  <div className="space-y-2">
                    <div className="w-28 h-2.5 rounded bg-white/20" />
                    <div className="w-28 h-6 rounded bg-white/10 border border-white/20" />
                    <div
                      className="w-28 h-5 rounded text-xs flex items-center justify-center text-white font-medium"
                      style={{ background: `linear-gradient(135deg, ${localBranding.color_primary}, ${localBranding.color_secondary})` }}
                    >
                      Iniciar Sesión
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Upload Button */}
            <motion.button
              type="button"
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
                    formData.append('folder', 'Favicon')
                    try {
                      const response = await fetch('/api/upload', { method: 'POST', body: formData })
                      const result = await response.json()
                      if (result.success && result.url) {
                        setLocalBranding(prev => ({ ...prev, favicon_url: result.url }))
                      }
                    } catch (err) {
                      setSaveError('Error al subir la imagen')
                      setTimeout(() => setSaveError(null), 5000)
                    }
                  }
                }
                input.click()
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-300"
              style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(124, 58, 237, 0.08))',
                border: '1px solid rgba(139, 92, 246, 0.25)',
                color: '#a78bfa'
              }}
            >
              <Upload className="w-4 h-4" />
              Subir Favicon
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Color Palette Section - 3 Colores en una fila */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative overflow-hidden rounded-2xl p-5 border backdrop-blur-xl"
        style={{
          backgroundColor: 'rgba(var(--org-card-background-rgb, 15, 23, 42), 0.6)',
          borderColor: 'rgba(255, 255, 255, 0.1)'
        }}
      >
        {/* Header con botón de auto-detectar */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ rotate: 15, scale: 1.1 }}
              className="p-2.5 rounded-xl"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
            >
              <Palette className="w-4 h-4 text-white" />
            </motion.div>
            <div>
              <h3 className="text-base font-bold text-white">Paleta de Colores</h3>
              <p className="text-xs text-white/50">Define los 3 colores de tu marca</p>
            </div>
          </div>

          <motion.button
            type="button"
            onClick={handleDetectColors}
            disabled={isDetecting || !localBranding.banner_url}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 rounded-lg font-medium text-xs flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.08))',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              color: '#fbbf24'
            }}
          >
            {isDetecting ? (
              <>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                  <Loader2 className="w-3.5 h-3.5" />
                </motion.div>
                Detectando...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                Auto-detectar
              </>
            )}
          </motion.button>
        </div>

        {/* 3 Color Pickers en una fila */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          {/* Primary Color */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="relative overflow-hidden rounded-xl p-4"
            style={{
              background: `linear-gradient(135deg, ${localBranding.color_primary}15, ${localBranding.color_primary}05)`,
              border: `1px solid ${localBranding.color_primary}30`
            }}
          >
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="w-10 h-10 rounded-lg shadow-lg cursor-pointer relative overflow-hidden flex-shrink-0"
                style={{ backgroundColor: localBranding.color_primary }}
              >
                <input
                  type="color"
                  value={localBranding.color_primary}
                  onChange={(e) => setLocalBranding(prev => ({ ...prev, color_primary: e.target.value }))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </motion.div>
              <div className="min-w-0">
                <p className="text-white font-semibold text-sm">Primario</p>
                <p className="text-white/50 text-xs uppercase font-mono truncate">{localBranding.color_primary}</p>
              </div>
            </div>
          </motion.div>

          {/* Secondary Color */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="relative overflow-hidden rounded-xl p-4"
            style={{
              background: `linear-gradient(135deg, ${localBranding.color_secondary}15, ${localBranding.color_secondary}05)`,
              border: `1px solid ${localBranding.color_secondary}30`
            }}
          >
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="w-10 h-10 rounded-lg shadow-lg cursor-pointer relative overflow-hidden flex-shrink-0"
                style={{ backgroundColor: localBranding.color_secondary }}
              >
                <input
                  type="color"
                  value={localBranding.color_secondary}
                  onChange={(e) => setLocalBranding(prev => ({ ...prev, color_secondary: e.target.value }))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </motion.div>
              <div className="min-w-0">
                <p className="text-white font-semibold text-sm">Secundario</p>
                <p className="text-white/50 text-xs uppercase font-mono truncate">{localBranding.color_secondary}</p>
              </div>
            </div>
          </motion.div>

          {/* Accent Color */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="relative overflow-hidden rounded-xl p-4"
            style={{
              background: `linear-gradient(135deg, ${localBranding.color_accent}15, ${localBranding.color_accent}05)`,
              border: `1px solid ${localBranding.color_accent}30`
            }}
          >
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="w-10 h-10 rounded-lg shadow-lg cursor-pointer relative overflow-hidden flex-shrink-0"
                style={{ backgroundColor: localBranding.color_accent }}
              >
                <input
                  type="color"
                  value={localBranding.color_accent}
                  onChange={(e) => setLocalBranding(prev => ({ ...prev, color_accent: e.target.value }))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </motion.div>
              <div className="min-w-0">
                <p className="text-white font-semibold text-sm">Acento</p>
                <p className="text-white/50 text-xs uppercase font-mono truncate">{localBranding.color_accent}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Vista Previa Compacta */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">Vista Previa</p>

          {/* Gradient Bar más pequeña */}
          <div
            className="h-12 rounded-xl overflow-hidden flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${localBranding.color_primary}, ${localBranding.color_secondary}, ${localBranding.color_accent})`,
              boxShadow: `0 8px 30px ${localBranding.color_primary}25`
            }}
          >
            <span className="font-bold text-sm tracking-wide" style={{ color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>Tu Marca</span>
          </div>

          {/* Button Previews */}
          <div className="flex flex-wrap gap-3">
            <motion.div
              whileHover={{ scale: 1.03 }}
              className="px-4 py-2 rounded-lg font-medium text-sm shadow-md"
              style={{
                background: `linear-gradient(135deg, ${localBranding.color_primary}, ${localBranding.color_secondary})`,
                color: '#ffffff',
                textShadow: '0 1px 2px rgba(0,0,0,0.1)'
              }}
            >
              Primario
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.03 }}
              className="px-4 py-2 rounded-lg font-medium text-sm"
              style={{
                backgroundColor: 'transparent',
                border: `1.5px solid ${localBranding.color_primary}`,
                color: localBranding.color_primary
              }}
            >
              Secundario
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.03 }}
              className="px-4 py-2 rounded-lg font-medium text-sm"
              style={{ 
                backgroundColor: localBranding.color_accent,
                color: '#ffffff',
                textShadow: '0 1px 2px rgba(0,0,0,0.1)'
              }}
            >
              Acento
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Messages y Botón de Guardar */}
      <div className="space-y-4">
        {/* Success/Error Messages */}
        {saveSuccess && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-xl p-4 flex items-center gap-3"
            style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.08))',
              border: '1px solid rgba(16, 185, 129, 0.25)'
            }}
          >
            <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <p className="text-emerald-300 text-sm font-medium">{saveSuccess}</p>
          </motion.div>
        )}

        {saveError && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-xl p-4 flex items-center gap-3"
            style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.08))',
              border: '1px solid rgba(239, 68, 68, 0.25)'
            }}
          >
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-300 text-sm font-medium">{saveError}</p>
          </motion.div>
        )}

        {/* Botón Guardar Premium */}
        <div className="flex justify-end">
          <motion.button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            whileHover={{ scale: isSaving ? 1 : 1.02 }}
            whileTap={{ scale: isSaving ? 1 : 0.98 }}
            className="relative overflow-hidden px-8 py-3.5 rounded-xl font-semibold text-sm text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2.5"
            style={{
              background: `linear-gradient(135deg, ${localBranding.color_primary}, ${localBranding.color_secondary})`,
              boxShadow: `0 8px 30px ${localBranding.color_primary}40`,
              color: '#ffffff',
              textShadow: '0 1px 2px rgba(0,0,0,0.2)'
            }}
          >
            {/* Shine effect */}
            <motion.div
              className="absolute inset-0 w-full"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
              }}
            />

            <div className="relative flex items-center gap-2.5">
              {isSaving ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 className="w-4 h-4" />
                  </motion.div>
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Guardar Cambios
                </>
              )}
            </div>
          </motion.button>
        </div>
      </div>
    </div>
  )
}

