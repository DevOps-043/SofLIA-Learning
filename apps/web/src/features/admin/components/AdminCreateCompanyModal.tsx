import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BuildingOffice2Icon,
  CheckCircleIcon,
  XMarkIcon,
  GlobeAltIcon,
  EnvelopeIcon,
  SparklesIcon,
  BoltIcon,
  ChevronDownIcon,
  ArrowPathIcon,
  PlusIcon,
  CloudArrowUpIcon,
  PhotoIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline'

// ============================================
// DESIGN SYSTEM - SOFLIA COLORS
// ============================================
const colors = {
  primary: '#0A2540',
  accent: '#00D4B3',
  accentLight: '#00E5C4',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  purple: '#8B5CF6',
  bgPrimary: '#0F1419',
  bgSecondary: '#1E2329',
  bgTertiary: '#0A0D12',
  grayLight: '#E9ECEF',
  grayMedium: '#6C757D',
}

export interface CreateCompanyData {
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
  google_login_enabled: boolean
  microsoft_login_enabled: boolean
  owner_email?: string
  owner_position?: string
}

interface CreateModalProps {
  onClose: () => void
  onCreate: (data: CreateCompanyData) => Promise<void>
  isCreating: boolean
}

const PLAN_OPTIONS = [
  { value: 'team', label: 'Team', color: '#3B82F6', description: 'Hasta 10 usuarios' },
  { value: 'business', label: 'Business', color: '#8B5CF6', description: 'Hasta 50 usuarios' },
  { value: 'enterprise', label: 'Enterprise', color: '#F59E0B', description: 'Usuarios ilimitados' }
]

type CreateTab = 'general' | 'branding' | 'owner'

export function AdminCreateCompanyModal({ onClose, onCreate, isCreating }: CreateModalProps) {
  const [activeTab, setActiveTab] = useState<CreateTab>('general')
  const [formData, setFormData] = useState<CreateCompanyData>({
    name: '',
    slug: '',
    description: '',
    contact_email: '',
    contact_phone: '',
    website_url: '',
    subscription_plan: 'team',
    max_users: 10,
    is_active: true,
    brand_logo_url: '',
    brand_banner_url: '',
    brand_favicon_url: '',
    brand_color_primary: '#0A2540',
    brand_color_secondary: '#1E2329',
    brand_color_accent: '#00D4B3',
    brand_font_family: 'Inter',
    google_login_enabled: false,
    microsoft_login_enabled: false,
    owner_email: '',
    owner_position: ''
  })
  const [isPlanOpen, setIsPlanOpen] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  // Upload image to Supabase
  const handleImageUpload = async (file: File, imageType: 'logo' | 'banner') => {
    const slug = formData.slug || 'new-org-' + Date.now()
    
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

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
    setFormData({ ...formData, name, slug })
  }

  // Handlers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return
    await onCreate(formData)
  }

  // Derived data
  const selectedPlan = PLAN_OPTIONS.find(p => p.value === formData.subscription_plan) || PLAN_OPTIONS[0]

  const navItems = [
    { id: 'general' as CreateTab, label: 'General', icon: BuildingOffice2Icon, description: 'Info básica y contacto' },
    { id: 'branding' as CreateTab, label: 'Branding', icon: SparklesIcon, description: 'Logo, colores y marca' },
    { id: 'owner' as CreateTab, label: 'Propietario', icon: UserCircleIcon, description: 'Invitar al dueño' }
  ]

  const primaryColor = formData.brand_color_primary || colors.primary
  const accentColor = formData.brand_color_accent || colors.accent

  const isFormValid = formData.name.trim().length > 0 && formData.owner_email && formData.owner_email.includes('@')

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
                      <PlusIcon className="w-10 h-10 text-white" />
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
                        layoutId="activeCreateTabBg"
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

            {/* Plan Preview */}
            <div className="mt-6 pt-6 border-t border-white/5 relative z-10">
              <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">Plan Seleccionado</p>
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedPlan.color }} />
                </div>
                <p className="text-lg font-bold text-white leading-none">{selectedPlan.label}</p>
                <p className="text-xs text-gray-500 mt-1">{formData.max_users} usuarios máx.</p>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL - CONTENT */}
          <div className="flex-1 flex flex-col h-full bg-[#1E2329] min-w-0">
             
             {/* Header */}
             <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between shrink-0">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: `${accentColor}20` }}>
                      <PlusIcon className="w-5 h-5" style={{ color: accentColor }} />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Nueva Organización</h2>
                  </div>
                  <p className="text-sm text-gray-400 ml-12">Crea una nueva empresa en la plataforma SOFLIA</p>
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
                                   onChange={(e) => handleNameChange(e.target.value)} 
                                   className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:border-white/20 focus:ring-1 focus:ring-white/20 outline-none transition-all"
                                   placeholder="Ej. Acme Corp"
                                 />
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                 <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-2 ml-1">Slug (URL) <span className="text-xs text-gray-500">- auto-generado</span></label>
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
                                    <label className="block text-xs font-medium text-gray-400 mb-2 ml-1">Estado Inicial</label>
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
                                 <input type="email" value={formData.contact_email} onChange={(e) => setFormData({...formData, contact_email: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:border-white/20 outline-none transition-all" placeholder="contacto@empresa.com" />
                              </div>
                              <div>
                                 <label className="block text-xs text-gray-400 mb-2 ml-1">Teléfono</label>
                                 <input type="tel" value={formData.contact_phone} onChange={(e) => setFormData({...formData, contact_phone: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:border-white/20 outline-none transition-all" placeholder="+52 55 1234 5678" />
                              </div>
                              <div className="md:col-span-2">
                                 <label className="block text-xs text-gray-400 mb-2 ml-1">Sitio Web</label>
                                 <input type="url" value={formData.website_url} onChange={(e) => setFormData({...formData, website_url: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:border-white/20 outline-none transition-all" placeholder="https://empresa.com" />
                              </div>
                           </div>
                        </div>
                        
                        {/* Section: Subscription & Access */}
                        <div className="space-y-5">
                           <div className="flex items-center gap-2 text-sm font-bold text-white/50 uppercase tracking-wider pb-2 border-b border-white/5">
                              <BoltIcon className="w-4 h-4" /> Suscripción y Acceso
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                              <div className="relative">
                                 <label className="block text-xs text-gray-400 mb-2 ml-1">Plan</label>
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
                              
                              {/* SSO Options in Create Modal */}
                              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                                 <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#4285F4' }} />
                                    <span className="text-sm text-white">Google SSO</span>
                                 </div>
                                 <button 
                                    type="button" 
                                    onClick={() => setFormData({...formData, google_login_enabled: !formData.google_login_enabled})} 
                                    className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${formData.google_login_enabled ? 'bg-green-500' : 'bg-gray-600'}`}
                                 >
                                    <motion.div 
                                       animate={{ x: formData.google_login_enabled ? 22 : 2 }} 
                                       className="absolute top-0.5 left-0 w-4 h-4 rounded-full bg-white shadow-sm" 
                                       transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    />
                                 </button>
                              </div>

                              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                                 <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#00a6f0' }} />
                                    <span className="text-sm text-white">Microsoft SSO</span>
                                 </div>
                                 <button 
                                    type="button" 
                                    onClick={() => setFormData({...formData, microsoft_login_enabled: !formData.microsoft_login_enabled})} 
                                    className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${formData.microsoft_login_enabled ? 'bg-green-500' : 'bg-gray-600'}`}
                                 >
                                    <motion.div 
                                       animate={{ x: formData.microsoft_login_enabled ? 22 : 2 }} 
                                       className="absolute top-0.5 left-0 w-4 h-4 rounded-full bg-white shadow-sm" 
                                       transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    />
                                 </button>
                              </div>
                           </div>
                        </div>

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
                              {[{k:'brand_color_primary', l:'Primario'}, {k:'brand_color_secondary', l:'Secundario'}, {k:'brand_color_accent', l:'Acento'}].map((c) => (
                                 <div key={c.k} className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                                    <p className="text-[10px] text-gray-400 mb-2 uppercase font-medium">{c.l}</p>
                                    <div className="flex items-center gap-3">
                                       <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/20 shrink-0 relative shadow-lg">
                                          <input type="color" value={(formData as any)[c.k]} onChange={(e) => setFormData({...formData, [c.k]: e.target.value} as any)} className="absolute inset-0 w-full h-full p-0 border-none cursor-pointer scale-150" />
                                       </div>
                                       <div className="flex-1 min-w-0">
                                          <input type="text" value={(formData as any)[c.k]} onChange={(e) => setFormData({...formData, [c.k]: e.target.value} as any)} className="w-full bg-transparent text-sm font-mono text-white outline-none border-b border-transparent focus:border-white/30" />
                                       </div>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        </div>
                     </motion.div>
                   )}

                   {/* TAB: OWNER */}
                   {activeTab === 'owner' && (
                     <motion.div key="owner" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 max-w-3xl">
                        <div className="text-sm text-gray-400 border-b border-white/5 pb-4 mb-6">
                           Ingresa los datos del propietario de la organización. Se le enviará una invitación por correo electrónico para que configure su cuenta.
                        </div>
                        
                        {/* Owner Info Card */}
                        <div className="p-6 rounded-2xl bg-gradient-to-br from-accent/10 to-transparent border border-accent/20">
                           <div className="flex items-start gap-4 mb-6">
                              <div className="p-3 rounded-xl bg-accent/20">
                                 <UserCircleIcon className="w-8 h-8" style={{ color: accentColor }} />
                              </div>
                              <div>
                                 <h4 className="text-white font-bold text-lg">Propietario de la Organización</h4>
                                 <p className="text-sm text-gray-400">Tendrá control total sobre la organización</p>
                              </div>
                           </div>
                           
                           <div className="space-y-5">
                              {/* Email del propietario */}
                              <div>
                                 <label className="block text-xs font-medium text-gray-400 mb-2 ml-1">
                                    Correo electrónico del propietario <span className="text-red-400">*</span>
                                 </label>
                                 <div className="relative">
                                    <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <input 
                                       type="email" 
                                       value={formData.owner_email || ''} 
                                       onChange={(e) => setFormData({...formData, owner_email: e.target.value})} 
                                       className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-accent/50 focus:ring-1 focus:ring-accent/30 outline-none transition-all"
                                       placeholder="propietario@empresa.com"
                                    />
                                 </div>
                              </div>
                              
                              {/* Cargo del propietario */}
                              <div>
                                 <label className="block text-xs font-medium text-gray-400 mb-2 ml-1">
                                    Cargo / Posición <span className="text-xs text-gray-600">(Opcional)</span>
                                 </label>
                                 <input 
                                    type="text" 
                                    value={formData.owner_position || ''} 
                                    onChange={(e) => setFormData({...formData, owner_position: e.target.value})} 
                                    className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-white/20 outline-none transition-all"
                                    placeholder="Ej: CEO, Director General, Gerente"
                                 />
                              </div>
                           </div>
                        </div>
                        
                        {/* Info Note */}
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                           <div className="flex items-start gap-3">
                              <SparklesIcon className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                              <div className="text-sm text-gray-400">
                                 <p className="mb-2"><strong className="text-white">¿Qué sucederá después?</strong></p>
                                 <ul className="space-y-1 text-xs">
                                    <li>â€¢ Se creará la organización con la configuración especificada</li>
                                    <li>â€¢ El propietario recibirá un email con un enlace para registrarse</li>
                                    <li>â€¢ La invitación expira en 7 días</li>
                                    <li>â€¢ Podrás ver el estado de la invitación en el panel de administración</li>
                                 </ul>
                              </div>
                           </div>
                        </div>
                     </motion.div>
                   )}

                </AnimatePresence>
             </div>

             {/* Footer Actions */}
             <div className="p-6 border-t border-white/5 shrink-0 flex items-center justify-between bg-[#1E2329]">
                <p className="text-xs text-gray-500">
                  {isFormValid ? (
                    <span className="text-green-400 flex items-center gap-1"><CheckCircleIcon className="w-3.5 h-3.5" /> Listo para crear</span>
                  ) : (
                    <span className="text-gray-500">Completa nombre y email del propietario</span>
                  )}
                </p>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={onClose} 
                    className="px-6 py-2.5 rounded-xl font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleSubmit} 
                    disabled={isCreating || !isFormValid} 
                    className="px-8 py-2.5 rounded-xl font-bold text-white shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
                    style={{ 
                      background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                      boxShadow: `0 4px 20px ${primaryColor}40`
                    }}
                  >
                     {isCreating && <ArrowPathIcon className="w-4 h-4 animate-spin" />}
                     {isCreating ? 'Creando...' : 'Crear Organización'}
                  </button>
                </div>
             </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
