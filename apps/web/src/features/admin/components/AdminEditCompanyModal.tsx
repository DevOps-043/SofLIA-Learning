import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BuildingOffice2Icon,
  CheckCircleIcon,
  PauseCircleIcon,
  XMarkIcon,
  GlobeAltIcon,
  EnvelopeIcon,
  SparklesIcon,
  ChartBarIcon,
  EyeIcon,
  BoltIcon,
  ChevronDownIcon,
  ArrowPathIcon,
  CloudArrowUpIcon,
  PhotoIcon
} from '@heroicons/react/24/outline'
import { SOFLIA_ADMIN_COLORS } from '../constants/admin-color-tokens'
import type { AdminCompany } from '../types/admin-companies.types'

const colors = SOFLIA_ADMIN_COLORS

interface EditModalProps {
  company: AdminCompany
  onClose: () => void
  onSave: (updates: Partial<AdminCompany>) => Promise<void>
  isSaving: boolean
}

const PLAN_OPTIONS = [
  { value: 'team', label: 'Team', color: colors.info, description: 'Hasta 10 usuarios' },
  { value: 'business', label: 'Business', color: colors.purple, description: 'Hasta 50 usuarios' },
  { value: 'enterprise', label: 'Enterprise', color: colors.warning, description: 'Usuarios ilimitados' }
]

const THEME_PRESETS = [
  { id: 'SOFLIA', name: 'SOFLIA Default', primary: colors.primary, secondary: colors.bgSecondary, accent: colors.accent, description: 'Tema profesional' },
  { id: 'modern-blue', name: 'Moderno Azul', primary: '#1E40AF', secondary: '#1E3A8A', accent: colors.info, description: 'Azul corporativo' },
  { id: 'emerald', name: 'Esmeralda', primary: '#065F46', secondary: '#064E3B', accent: colors.success, description: 'Verde empresarial' },
  { id: 'purple', name: 'Violeta', primary: '#4C1D95', secondary: '#5B21B6', accent: colors.purple, description: 'Morado elegante' },
  { id: 'rose', name: 'Rosa', primary: '#9F1239', secondary: '#881337', accent: '#F43F5E', description: 'Rosa vibrante' },
  { id: 'amber', name: 'Ãmbar', primary: '#92400E', secondary: '#78350F', accent: colors.warning, description: 'Naranja cálido' }
]

type EditTab = 'general' | 'members' | 'branding' | 'themes'
type BrandingColorKey = 'brand_color_primary' | 'brand_color_secondary' | 'brand_color_accent'

interface CompanyFormData {
  name: string
  slug: string
  description: string
  contact_email: string
  contact_phone: string
  website_url: string
  subscription_plan: string
  max_users: number
  is_active: boolean
  brand_logo_url: string
  brand_banner_url: string
  brand_favicon_url: string
  brand_color_primary: string
  brand_color_secondary: string
  brand_color_accent: string
  brand_font_family: string
}

const BRANDING_COLOR_FIELDS: Array<{ k: BrandingColorKey; l: string }> = [
  { k: 'brand_color_primary', l: 'Primario' },
  { k: 'brand_color_secondary', l: 'Secundario' },
  { k: 'brand_color_accent', l: 'Acento' }
]

export function AdminEditCompanyModal({ company, onClose, onSave, isSaving }: EditModalProps) {
  const [activeTab, setActiveTab] = useState<EditTab>('general')
  const [formData, setFormData] = useState<CompanyFormData>({
    name: company.name || '',
    slug: company.slug || '',
    description: company.description || '',
    contact_email: company.contact_email || '',
    contact_phone: company.contact_phone || '',
    website_url: company.website_url || '',
    subscription_plan: company.subscription_plan || 'team',
    max_users: company.max_users || 10,
    is_active: company.is_active,
    brand_logo_url: company.brand_logo_url || '',
    brand_banner_url: company.brand_banner_url || '',
    brand_favicon_url: company.brand_favicon_url || '',
    brand_color_primary: company.brand_color_primary || colors.primary,
    brand_color_secondary: company.brand_color_secondary || colors.bgSecondary,
    brand_color_accent: company.brand_color_accent || colors.accent,
    brand_font_family: company.brand_font_family || 'Inter'
  })
  const [isPlanOpen, setIsPlanOpen] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  // Upload image to Supabase
  const handleImageUpload = async (file: File, imageType: 'logo' | 'banner') => {
    const slug = formData.slug || company.slug || 'temp-org'
    
    try {
      if (imageType === 'logo') setUploadingLogo(true)
      else setUploadingBanner(true)

      const formDataUpload = new FormData()
      formDataUpload.append('file', file)
      formDataUpload.append('organizationSlug', slug)
      formDataUpload.append('imageType', imageType)

      const response = await fetch('/api/admin/upload/organization-image', {
        method: 'POST',
        body: formDataUpload
      })

      const result = await response.json()

      if (result.success && result.image?.url) {
        if (imageType === 'logo') {
          setFormData(prev => ({ 
            ...prev, 
            brand_logo_url: result.image.url,
            brand_favicon_url: result.image.favicon_url || result.image.url
          }))
        } else {
          setFormData(prev => ({ ...prev, brand_banner_url: result.image.url }))
        }
      } else {
        console.error('Upload failed:', result.error)
        alert(result.error || 'Error al subir la imagen')
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Error al subir la imagen')
    } finally {
      if (imageType === 'logo') setUploadingLogo(false)
      else setUploadingBanner(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, imageType: 'logo' | 'banner') => {
    const file = e.target.files?.[0]
    if (file) {
      handleImageUpload(file, imageType)
    }
  }

  // Handlers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSave(formData)
  }

  const applyThemePreset = (preset: typeof THEME_PRESETS[0]) => {
    setFormData(prev => ({
      ...prev,
      brand_color_primary: preset.primary,
      brand_color_secondary: preset.secondary,
      brand_color_accent: preset.accent
    }))
  }

  const updateBrandingColor = (key: BrandingColorKey, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  // Derived data
  const selectedPlan = PLAN_OPTIONS.find(p => p.value === formData.subscription_plan) || PLAN_OPTIONS[0]
  const owner = company.members?.find(m => m.role === 'owner')
  const admins = company.members?.filter(m => m.role === 'admin') || []

  // Helpers
  const getUserDisplayName = (user?: { email: string; first_name: string | null; last_name: string | null; display_name: string | null; username: string | null }) => {
    if (!user) return 'Usuario'
    if (user.display_name) return user.display_name
    if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`
    if (user.first_name) return user.first_name
    if (user.username) return user.username
    return user.email.split('@')[0]
  }

  const navItems = [
    { id: 'general' as EditTab, label: 'General', icon: BuildingOffice2Icon, description: 'Info básica y contacto' },
    { id: 'members' as EditTab, label: 'Miembros', icon: ChartBarIcon, description: 'Estadísticas y admins' },
    { id: 'branding' as EditTab, label: 'Branding', icon: SparklesIcon, description: 'Logo, colores y marca' },
    { id: 'themes' as EditTab, label: 'Temas', icon: EyeIcon, description: 'Estilos predefinidos' }
  ]

  const primaryColor = formData.brand_color_primary || colors.primary
  const accentColor = formData.brand_color_accent || colors.accent

  return (
    <AnimatePresence>
      <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 99999 }}>
        {/* Backdrop */}
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           onClick={onClose}
           className="absolute inset-0 backdrop-blur-md"
           style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
        />

        {/* Modal Window */}
        <motion.div
           initial={{ opacity: 0, scale: 0.95, y: 20 }}
           animate={{ opacity: 1, scale: 1, y: 0 }}
           exit={{ opacity: 0, scale: 0.95, y: 20 }}
           className="relative w-full max-w-5xl h-[700px] max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col lg:flex-row border border-white/10"
           style={{ backgroundColor: colors.bgSecondary }}
           onClick={(e) => e.stopPropagation()}
        >
          
          {/* LEFT SIDEBAR - PREVIEW PANEL */}
          <div 
            className="hidden lg:flex w-[320px] flex-col p-8 border-r border-white/5 relative shrink-0"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}15, ${accentColor}10)`,
            }}
          >
            {/* Ambient Background */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            {/* Preview Card */}
            <div className="relative z-10 text-center mb-8">
               <motion.div 
                 className="relative inline-block mb-4"
                 initial={{ scale: 0.9, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
               >
                  <div 
                    className="w-24 h-24 rounded-2xl flex items-center justify-center overflow-hidden shadow-2xl border-2 border-white/10 mx-auto bg-white/5 backdrop-blur-sm"
                    style={{
                      background: formData.brand_logo_url ? '#fff' : `linear-gradient(135deg, ${primaryColor}, ${accentColor})`
                    }}
                  >
                    {formData.brand_logo_url ? (
                      <img src={formData.brand_logo_url} alt="Logo" className="w-full h-full object-contain p-2" />
                    ) : (
                      <BuildingOffice2Icon className="w-10 h-10 text-white" />
                    )}
                  </div>
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 p-1.5 rounded-full shadow-lg border border-bgSecondary"
                    style={{ backgroundColor: formData.is_active ? colors.success : colors.warning }}
                  >
                    {formData.is_active ? <CheckCircleIcon className="w-3.5 h-3.5 text-white" /> : <PauseCircleIcon className="w-3.5 h-3.5 text-white" />}
                  </motion.div>
               </motion.div>
               
               <h3 className="text-xl font-bold text-white mb-1 truncate px-2">{formData.name || 'Nueva Empresa'}</h3>
               <div className="flex items-center justify-center gap-2 opacity-70">
                 <GlobeAltIcon className="w-3 h-3 text-current" style={{ color: accentColor }} />
                 <p className="text-xs font-mono text-white/80">{formData.slug ? `/${formData.slug}` : '/...'}</p>
               </div>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 space-y-2 relative z-10">
              {navItems.map((item) => {
                const isActive = activeTab === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl transition-all text-left relative overflow-hidden group ${isActive ? 'shadow-lg' : 'hover:bg-white/5'}`}
                  >
                    {isActive && (
                      <motion.div 
                        layoutId="activeTabBg"
                        className="absolute inset-0 bg-white/10 ring-1 ring-white/10"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <item.icon 
                      className={`w-5 h-5 relative z-10 transition-colors ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} 
                      style={{ color: isActive ? accentColor : undefined }} 
                    />
                    <div className="flex-1 min-w-0 relative z-10">
                      <p className={`text-sm font-medium ${isActive ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>{item.label}</p>
                      <p className={`text-[10px] ${isActive ? 'text-white/70' : 'text-gray-500'}`}>{item.description}</p>
                    </div>
                  </button>
                )
              })}
            </nav>

            {/* Usage Mini Stat */}
            <div className="mt-6 pt-6 border-t border-white/5 relative z-10">
              <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Licencias</p>
                    <p className="text-lg font-bold text-white leading-none mt-1">{company.active_users} <span className="text-xs font-normal text-gray-500">/ {formData.max_users}</span></p>
                  </div>
                  <ChartBarIcon className="w-5 h-5 opacity-20 text-white" />
                </div>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-1000" 
                    style={{ width: `${Math.min(100, (company.active_users / formData.max_users) * 100)}%`, backgroundColor: accentColor }} 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL - CONTENT */}
          <div className="flex-1 flex flex-col h-full bg-[#1E2329] min-w-0">
             
             {/* Header */}
             <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-2xl font-bold text-white">Editar Empresa</h2>
                  <p className="text-sm text-gray-400 mt-1">Configuración y preferencias de {company.name}</p>
                </div>
                <button 
                  onClick={onClose} 
                  className="p-2.5 rounded-xl hover:bg-white/5 transition-colors text-gray-400 hover:text-white"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
             </div>

             {/* Scrollable Form Area */}
             <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                <AnimatePresence mode="wait">
                   
                   {/* TAB: GENERAL */}
                   {activeTab === 'general' && (
                     <motion.div 
                        key="general" 
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, y: -10 }} 
                        className="space-y-8 max-w-3xl"
                     >
                        {/* Section: Basic Info */}
                        <div className="space-y-5">
                           <div className="flex items-center gap-2 text-sm font-bold text-white/50 uppercase tracking-wider pb-2 border-b border-white/5">
                              <BuildingOffice2Icon className="w-4 h-4" /> Información Básica
                           </div>
                           <div className="grid grid-cols-1 gap-5">
                              <div>
                                 <label className="block text-xs font-medium text-gray-400 mb-2 ml-1">Nombre de la empresa <span className="text-red-400">*</span></label>
                                 <input 
                                   type="text" 
                                   value={formData.name} 
                                   onChange={(e) => setFormData({...formData, name: e.target.value})} 
                                   className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:border-white/20 focus:ring-1 focus:ring-white/20 outline-none transition-all"
                                   placeholder="Ej. Acme Corp"
                                 />
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                 <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-2 ml-1">Slug (URL)</label>
                                    <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-4 py-3 transition-colors focus-within:border-white/20 focus-within:ring-1 focus-within:ring-white/20">
                                       <span className="text-gray-500 text-sm select-none mr-1">app.SOFLIA.com/</span>
                                       <input 
                                         type="text" 
                                         value={formData.slug} 
                                         onChange={(e) => setFormData({...formData, slug: e.target.value})} 
                                         className="flex-1 bg-transparent border-none text-white placeholder-white/20 focus:ring-0 outline-none p-0"
                                         placeholder="acme" 
                                       />
                                    </div>
                                 </div>
                                 <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-2 ml-1">Estado</label>
                                    <button 
                                      type="button" 
                                      onClick={() => setFormData({...formData, is_active: !formData.is_active})} 
                                      className="w-full h-[50px] flex items-center justify-between px-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
                                    >
                                       <span className={`text-sm font-medium ${formData.is_active ? 'text-white' : 'text-gray-400'}`}>
                                          {formData.is_active ? 'Cuenta Activa' : 'Cuenta Pausada'}
                                       </span>
                                       <div className={`w-11 h-6 rounded-full relative transition-colors duration-300 ${formData.is_active ? 'bg-green-500' : 'bg-gray-600'}`}>
                                          <motion.div 
                                            animate={{ x: formData.is_active ? 22 : 2 }} 
                                            className="absolute top-1 left-0 w-4 h-4 rounded-full bg-white shadow-sm" 
                                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                          />
                                       </div>
                                    </button>
                                 </div>
                              </div>
                              <div>
                                 <label className="block text-xs font-medium text-gray-400 mb-2 ml-1">Descripción</label>
                                 <textarea 
                                   rows={3} 
                                   value={formData.description} 
                                   onChange={(e) => setFormData({...formData, description: e.target.value})} 
                                   className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:border-white/20 focus:ring-1 focus:ring-white/20 outline-none resize-none transition-all"
                                   placeholder="Breve descripción de la empresa..."
                                 />
                              </div>
                           </div>
                        </div>

                        {/* Section: Contact */}
                        <div className="space-y-5">
                           <div className="flex items-center gap-2 text-sm font-bold text-white/50 uppercase tracking-wider pb-2 border-b border-white/5">
                              <EnvelopeIcon className="w-4 h-4" /> Contacto
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                              <div>
                                 <label className="block text-xs text-gray-400 mb-2 ml-1">Email de Contacto</label>
                                 <input type="email" value={formData.contact_email} onChange={(e) => setFormData({...formData, contact_email: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:border-white/20 outline-none transition-all" />
                              </div>
                              <div>
                                 <label className="block text-xs text-gray-400 mb-2 ml-1">Teléfono</label>
                                 <input type="tel" value={formData.contact_phone} onChange={(e) => setFormData({...formData, contact_phone: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:border-white/20 outline-none transition-all" />
                              </div>
                              <div className="md:col-span-2">
                                 <label className="block text-xs text-gray-400 mb-2 ml-1">Sitio Web</label>
                                 <input type="url" value={formData.website_url} onChange={(e) => setFormData({...formData, website_url: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:border-white/20 outline-none transition-all" placeholder="https://" />
                              </div>
                           </div>
                        </div>
                        
                        {/* Section: Subscription */}
                        <div className="space-y-5">
                           <div className="flex items-center gap-2 text-sm font-bold text-white/50 uppercase tracking-wider pb-2 border-b border-white/5">
                              <BoltIcon className="w-4 h-4" /> Suscripción
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                              <div className="relative">
                                 <label className="block text-xs text-gray-400 mb-2 ml-1">Plan Actual</label>
                                 <button type="button" onClick={() => setIsPlanOpen(!isPlanOpen)} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white flex items-center justify-between hover:bg-white/10 transition-colors">
                                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full shadow-[0_0_10px_currentColor]" style={{ backgroundColor: selectedPlan.color }} /><span>{selectedPlan.label}</span></div>
                                    <ChevronDownIcon className="w-4 h-4 text-gray-500 transition-transform" style={{ transform: isPlanOpen ? 'rotate(180deg)' : 'none' }} />
                                 </button>
                                 <AnimatePresence>
                                    {isPlanOpen && (
                                       <motion.div 
                                          initial={{ opacity: 0, y: 5 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          exit={{ opacity: 0, y: 5 }}
                                          className="absolute top-full left-0 w-full mt-2 rounded-xl border border-white/10 overflow-hidden z-20 shadow-2xl backdrop-blur-xl" 
                                          style={{ backgroundColor: colors.bgTertiary }}
                                       >
                                          {PLAN_OPTIONS.map(opt => (
                                             <div key={opt.value} onClick={() => { setFormData({...formData, subscription_plan: opt.value}); setIsPlanOpen(false); }} className="px-4 py-3 hover:bg-white/10 cursor-pointer flex items-center gap-3 transition-colors">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: opt.color }} /><div className="flex-1"><span className="text-sm text-white block">{opt.label}</span><span className="text-[10px] text-gray-500">{opt.description}</span></div>
                                                {formData.subscription_plan === opt.value && <CheckCircleIcon className="w-4 h-4 text-white" />}
                                             </div>
                                          ))}
                                       </motion.div>
                                    )}
                                 </AnimatePresence>
                              </div>
                              <div>
                                 <label className="block text-xs text-gray-400 mb-2 ml-1">Usuarios Máximos</label>
                                 <input type="number" min="1" value={formData.max_users} onChange={(e) => setFormData({...formData, max_users: parseInt(e.target.value) || 1 })} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:border-white/20 outline-none transition-all" />
                              </div>
                           </div>
                        </div>

                     </motion.div>
                   )}

                   {/* TAB: MEMBERS */}
                   {activeTab === 'members' && (
                     <motion.div key="members" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8 max-w-3xl">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                           {[{ l: 'Activos', v: company.active_users, c: colors.success }, { l: 'Invitados', v: company.invited_users, c: colors.warning }, { l: 'Suspendidos', v: company.suspended_users, c: colors.error }, { l: 'Total', v: company.total_users, c: '#fff' }].map((s, i) => (
                              <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center group hover:bg-white/10 transition-colors">
                                 <span className="text-2xl font-bold" style={{ color: s.c }}>{s.v}</span>
                                 <span className="text-[10px] uppercase tracking-wider text-gray-500 font-medium group-hover:text-white/70 transition-colors">{s.l}</span>
                              </div>
                           ))}
                        </div>

                        <div>
                           <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                              <h3 className="text-sm font-bold text-white/50 uppercase tracking-wider">Administradores</h3>
                              <span className="text-xs px-2 py-1 rounded bg-white/10 text-white/80">{admins.length} Asignados</span>
                           </div>
                           <div className="space-y-3">
                              {admins.map(admin => (
                                 <div key={admin.id} className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center gap-4 hover:border-white/20 transition-all">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-inner" style={{ background: `${colors.accent}20`, color: colors.accent }}>
                                       {getUserDisplayName(admin.user).charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                       <p className="text-sm font-medium text-white">{getUserDisplayName(admin.user)}</p>
                                       <p className="text-xs text-gray-500">{admin.user?.email}</p>
                                    </div>
                                    <span className="px-2 py-1 rounded text-[10px] bg-accent/10 text-accent uppercase font-bold tracking-wider">Admin</span>
                                 </div>
                              ))}
                              {admins.length === 0 && (
                                 <div className="p-8 text-center border-2 border-dashed border-white/10 rounded-xl text-gray-500 text-sm hover:border-white/20 transition-colors">
                                    No hay administradores adicionales.
                                 </div>
                              )}
                           </div>
                        </div>

                        {owner && (
                           <div className="pt-2">
                              <h3 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-4 border-b border-white/5 pb-2">Propietario</h3>
                              <div className="p-4 rounded-xl bg-gradient-to-r from-white/5 to-transparent border border-white/10 flex items-center gap-4">
                                 <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-lg" style={{ background: `${colors.warning}20`, color: colors.warning }}>
                                    {getUserDisplayName(owner.user).charAt(0).toUpperCase()}
                                 </div>
                                 <div>
                                    <p className="text-sm font-bold text-white">{getUserDisplayName(owner.user)}</p>
                                    <p className="text-xs text-gray-400">{owner.user?.email}</p>
                                 </div>
                                 <div className="ml-auto">
                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-warning/10 text-warning border border-warning/20">OWNER</span>
                                 </div>
                              </div>
                           </div>
                        )}
                     </motion.div>
                   )}

                   {/* TAB: BRANDING */}
                   {activeTab === 'branding' && (
                     <motion.div key="branding" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8 max-w-3xl">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           {/* Logo Upload */}
                           <div>
                              <label className="text-xs text-gray-400 mb-3 block uppercase tracking-wider font-bold ml-1">Logo de la Empresa</label>
                              <input 
                                type="file" 
                                ref={logoInputRef}
                                onChange={(e) => handleFileChange(e, 'logo')}
                                accept="image/*"
                                className="hidden"
                              />
                              <div 
                                onClick={() => !uploadingLogo && logoInputRef.current?.click()}
                                className={`aspect-square rounded-2xl bg-black/20 border-2 border-dashed flex flex-col items-center justify-center p-4 mb-4 group transition-all relative overflow-hidden cursor-pointer ${uploadingLogo ? 'border-accent/50 bg-accent/5' : 'border-white/20 hover:border-accent/50 hover:bg-white/5'}`}
                              >
                                 {uploadingLogo ? (
                                   <div className="flex flex-col items-center gap-3">
                                     <ArrowPathIcon className="w-8 h-8 text-accent animate-spin" />
                                     <p className="text-xs text-accent font-medium">Subiendo...</p>
                                   </div>
                                 ) : formData.brand_logo_url ? (
                                   <>
                                     <img src={formData.brand_logo_url} className="w-full h-full object-contain relative z-10" alt="Logo" />
                                     <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity z-20 backdrop-blur-sm gap-2">
                                        <CloudArrowUpIcon className="w-8 h-8 text-white" />
                                        <p className="text-xs text-white font-medium">Cambiar logo</p>
                                     </div>
                                   </>
                                 ) : (
                                   <div className="flex flex-col items-center gap-3 group-hover:scale-105 transition-transform">
                                     <div className="p-4 rounded-2xl bg-white/5 group-hover:bg-accent/10 transition-colors">
                                       <PhotoIcon className="w-10 h-10 text-gray-500 group-hover:text-accent transition-colors" />
                                     </div>
                                     <div className="text-center">
                                       <p className="text-sm text-gray-400 group-hover:text-white transition-colors">Subir logo</p>
                                       <p className="text-[10px] text-gray-600">PNG, JPG, SVG (máx. 5MB)</p>
                                     </div>
                                   </div>
                                 )}
                              </div>
                              {formData.brand_logo_url && (
                                <button 
                                  type="button"
                                  onClick={() => setFormData({...formData, brand_logo_url: ''})}
                                  className="text-xs text-red-400 hover:text-red-300 transition-colors"
                                >
                                  Eliminar logo
                                </button>
                              )}
                           </div>
                           
                           {/* Banner Upload */}
                           <div>
                              <label className="text-xs text-gray-400 mb-3 block uppercase tracking-wider font-bold ml-1">Banner de Marca</label>
                              <input 
                                type="file" 
                                ref={bannerInputRef}
                                onChange={(e) => handleFileChange(e, 'banner')}
                                accept="image/*"
                                className="hidden"
                              />
                              <div 
                                onClick={() => !uploadingBanner && bannerInputRef.current?.click()}
                                className={`aspect-square rounded-2xl bg-black/20 border-2 border-dashed flex flex-col items-center justify-center p-4 mb-4 group transition-all relative overflow-hidden cursor-pointer ${uploadingBanner ? 'border-accent/50 bg-accent/5' : 'border-white/20 hover:border-accent/50 hover:bg-white/5'}`}
                              >
                                 {uploadingBanner ? (
                                   <div className="flex flex-col items-center gap-3">
                                     <ArrowPathIcon className="w-8 h-8 text-accent animate-spin" />
                                     <p className="text-xs text-accent font-medium">Subiendo...</p>
                                   </div>
                                 ) : formData.brand_banner_url ? (
                                   <>
                                     <img src={formData.brand_banner_url} className="w-full h-full object-cover relative z-10" alt="Banner" />
                                     <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity z-20 backdrop-blur-sm gap-2">
                                        <CloudArrowUpIcon className="w-8 h-8 text-white" />
                                        <p className="text-xs text-white font-medium">Cambiar banner</p>
                                     </div>
                                   </>
                                 ) : (
                                   <div className="flex flex-col items-center gap-3 group-hover:scale-105 transition-transform">
                                     <div className="p-4 rounded-2xl bg-white/5 group-hover:bg-accent/10 transition-colors">
                                       <GlobeAltIcon className="w-10 h-10 text-gray-500 group-hover:text-accent transition-colors" />
                                     </div>
                                     <div className="text-center">
                                       <p className="text-sm text-gray-400 group-hover:text-white transition-colors">Subir banner</p>
                                       <p className="text-[10px] text-gray-600">PNG, JPG (máx. 10MB)</p>
                                     </div>
                                   </div>
                                 )}
                              </div>
                              {formData.brand_banner_url && (
                                <button 
                                  type="button"
                                  onClick={() => setFormData({...formData, brand_banner_url: ''})}
                                  className="text-xs text-red-400 hover:text-red-300 transition-colors"
                                >
                                  Eliminar banner
                                </button>
                              )}
                           </div>
                        </div>

                        <div>
                           <label className="text-xs text-gray-400 mb-4 block uppercase tracking-wider font-bold border-b border-white/5 pb-2">Paleta de Colores Personalizada</label>
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {BRANDING_COLOR_FIELDS.map((c) => (
                                 <div key={c.k} className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                                    <p className="text-[10px] text-gray-400 mb-2 uppercase font-medium">{c.l}</p>
                                    <div className="flex items-center gap-3">
                                       <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/20 shrink-0 relative shadow-lg">
                                          <input type="color" value={formData[c.k]} onChange={(e) => updateBrandingColor(c.k, e.target.value)} className="absolute inset-0 w-full h-full p-0 border-none cursor-pointer scale-150" />
                                       </div>
                                       <div className="flex-1 min-w-0">
                                          <input type="text" value={formData[c.k]} onChange={(e) => updateBrandingColor(c.k, e.target.value)} className="w-full bg-transparent text-sm font-mono text-white outline-none border-b border-transparent focus:border-white/30" />
                                       </div>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        </div>
                     </motion.div>
                   )}

                   {/* TAB: THEMES */}
                   {activeTab === 'themes' && (
                     <motion.div key="themes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 max-w-3xl">
                        <div className="text-sm text-gray-400 border-b border-white/5 pb-4 mb-6">
                           Selecciona un tema predefinido para aplicar colores automáticamente. Puedes personalizarlos después en la pestaña Branding.
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           {THEME_PRESETS.map(preset => {
                              const isActive = formData.brand_color_primary === preset.primary && formData.brand_color_accent === preset.accent
                              return (
                                 <div key={preset.id} onClick={() => applyThemePreset(preset)} 
                                      className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-4 group hover:scale-[1.02] ${isActive ? 'bg-white/5 border-accent shadow-lg' : 'bg-transparent border-white/10 hover:border-white/30 hover:bg-white/5'}`}>
                                    <div className="flex-1">
                                       <div className="flex items-center gap-2 mb-2">
                                          <h4 className={`font-bold transition-colors ${isActive ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>{preset.name}</h4>
                                          {isActive && <CheckCircleIcon className="w-5 h-5 text-accent" />}
                                       </div>
                                       <p className="text-xs text-gray-500 mb-4 h-8">{preset.description}</p>
                                       <div className="flex gap-2">
                                          {[preset.primary, preset.secondary, preset.accent].map((c, i) => (
                                             <div key={i} className="w-8 h-8 rounded-full border border-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.3)] transition-transform group-hover:scale-110" style={{ backgroundColor: c, transitionDelay: `${i * 50}ms` }} />
                                          ))}
                                       </div>
                                    </div>
                                 </div>
                              )
                           })}
                        </div>
                     </motion.div>
                   )}

                </AnimatePresence>
             </div>

             {/* Footer Actions */}
             <div className="p-6 border-t border-white/5 shrink-0 flex items-center justify-end gap-3 bg-[#1E2329]">
                <button 
                  onClick={onClose} 
                  className="px-6 py-2.5 rounded-xl font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSubmit} 
                  disabled={isSaving} 
                  className="px-8 py-2.5 rounded-xl font-bold text-white shadow-lg flex items-center gap-2 disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
                  style={{ 
                    background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                    boxShadow: `0 4px 20px ${primaryColor}40`
                  }}
                >
                   {isSaving && <ArrowPathIcon className="w-4 h-4 animate-spin" />}
                   {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
             </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
