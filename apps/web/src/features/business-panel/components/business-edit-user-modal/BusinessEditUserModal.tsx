'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, Mail, Shield, AlertCircle, Phone, MapPin, Briefcase, ChevronRight, Info } from 'lucide-react'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import { useOrganizationStylesContext } from '../../contexts/OrganizationStylesContext'
import { useThemeStore } from '@/core/stores/themeStore'

interface UserFormData {
  id: string
  username: string
  email: string
  first_name: string
  last_name: string
  display_name: string
  phone_number: string
  location: string
  bio: string
  job_title: string
  org_role: 'owner' | 'admin' | 'member'
  status: 'active' | 'invited' | 'suspended' | 'removed'
  profile_picture_url: string
}

interface BusinessEditUserModalProps {
  isOpen: boolean
  onClose: () => void
  user: UserFormData | null
  onSave: (id: string, data: Partial<UserFormData>) => Promise<void>
}

export function BusinessEditUserModal({ isOpen, onClose, user, onSave }: BusinessEditUserModalProps) {
  const { t } = useTranslation('business')
  const { styles } = useOrganizationStylesContext()
  const { resolvedTheme } = useThemeStore()
  const isDark = resolvedTheme === 'dark'

  const [formData, setFormData] = useState<Partial<UserFormData>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      setFormData(user)
      setError(null)
    }
  }, [user])

  const primaryColor = isDark ? '#00D4B3' : (styles?.panel?.primary_button_color || '#0066FF')
  const accentColor = isDark ? '#00D4B3' : (styles?.panel?.accent_color || '#00D4B3')
  const textColor = isDark ? '#FFFFFF' : '#0F172A'
  const mutedText = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(15,23,42,0.5)'
  const borderColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
  const inputBg = isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.05)'
  const surfaceColor = isDark ? '#0b0e14' : '#FFFFFF'

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return
    setIsSaving(true)
    setError(null)
    try {
      await onSave(user.id, formData)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error.')
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen || !user) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 flex items-center justify-center p-0 sm:p-4 isolate" style={{ zIndex: 99999 }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-transparent" />
        <motion.div
           initial={{ opacity: 0, scale: 0.95, y: 20 }}
           animate={{ opacity: 1, scale: 1, y: 0 }}
           exit={{ opacity: 0, scale: 0.95, y: 20 }}
           transition={{ type: 'spring', damping: 25, stiffness: 300 }}
           className="relative w-full max-w-5xl h-full sm:h-[85vh] sm:max-h-[750px] flex flex-col bg-transparent overflow-hidden shadow-2xl sm:rounded-[2.5rem]"
           onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col h-full overflow-hidden border" style={{ backgroundColor: surfaceColor, borderColor }}>
            
            {/* Header - COMPACT */}
            <div className="relative shrink-0 pt-6 pb-4 px-6 lg:px-12 border-b border-white/5">
               <div className="flex flex-col sm:flex-row items-center gap-8">
                  <div className="relative shrink-0">
                    <div className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-2xl border-4 overflow-hidden relative" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`, borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF' }}>
                       {user.profile_picture_url ? <Image src={user.profile_picture_url} alt={user.display_name} fill className="object-cover" /> : <User className="w-8 h-8 text-white" strokeWidth={2.5} />}
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-white/10" style={{ backgroundColor: primaryColor }}><Info className="w-4 h-4 text-white" /></div>
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                     <h2 className="text-2xl font-black tracking-tight mb-1" style={{ color: textColor }}>{formData.display_name || 'Editar Usuario'}</h2>
                     <div className="px-3 py-1 rounded-xl border text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2" style={{ backgroundColor: inputBg, borderColor, color: mutedText }}><Mail className="w-3.5 h-3.5" /><span>{formData.email}</span></div>
                  </div>
                  <button onClick={onClose} className="p-3 rounded-2xl border transition-all" style={{ backgroundColor: inputBg, borderColor, color: mutedText }}><X className="w-5 h-5" /></button>
               </div>
            </div>

            <form onSubmit={handleSave} className="flex-1 flex flex-col overflow-hidden">
               <div className="flex-1 overflow-y-auto pt-6 pb-12 px-6 lg:px-12 space-y-8" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.05) transparent' }}>
                  {error && <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3"><AlertCircle className="w-5 h-5 text-red-400 shrink-0" /><span className="text-[10px] font-black uppercase text-red-400 flex-1">{error}</span></div>}
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                     <div className="space-y-6">
                        <label className="text-[10px] font-black uppercase tracking-widest px-1 block" style={{ color: mutedText }}>Perfil Personal</label>
                        <div className="grid grid-cols-2 gap-4">
                           <input className="w-full px-5 py-4 rounded-2xl border bg-transparent focus:outline-none transition-all text-sm font-medium" name="first_name" value={formData.first_name || ''} onChange={handleChange} placeholder="Nombre" style={{ backgroundColor: inputBg, borderColor, color: textColor }} />
                           <input className="w-full px-5 py-4 rounded-2xl border bg-transparent focus:outline-none transition-all text-sm font-medium" name="last_name" value={formData.last_name || ''} onChange={handleChange} placeholder="Apellido" style={{ backgroundColor: inputBg, borderColor, color: textColor }} />
                        </div>
                        <input className="w-full px-5 py-4 rounded-[1.8rem] border bg-transparent focus:outline-none transition-all text-sm font-medium" name="bio" value={formData.bio || ''} onChange={handleChange} placeholder="Pequeña biografía..." style={{ backgroundColor: inputBg, borderColor, color: textColor }} />
                     </div>
                     <div className="space-y-6">
                        <label className="text-[10px] font-black uppercase tracking-widest px-1 block" style={{ color: mutedText }}>Contacto y Ubicación</label>
                        <div className="relative"><Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" style={{ color: textColor }} /><input className="w-full pl-12 pr-5 py-4 rounded-2xl border bg-transparent focus:outline-none transition-all text-sm font-medium" name="phone_number" value={formData.phone_number || ''} onChange={handleChange} placeholder="Teléfono" style={{ backgroundColor: inputBg, borderColor, color: textColor }} /></div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="relative"><MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" style={{ color: textColor }} /><input className="w-full pl-12 pr-5 py-4 rounded-2xl border bg-transparent focus:outline-none transition-all text-sm font-medium" name="location" value={formData.location || ''} onChange={handleChange} placeholder="Ubicación" style={{ backgroundColor: inputBg, borderColor, color: textColor }} /></div>
                           <div className="relative"><Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" style={{ color: textColor }} /><input className="w-full pl-12 pr-5 py-4 rounded-2xl border bg-transparent focus:outline-none transition-all text-sm font-medium" name="job_title" value={formData.job_title || ''} onChange={handleChange} placeholder="Cargo" style={{ backgroundColor: inputBg, borderColor, color: textColor }} /></div>
                        </div>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <label className="text-[10px] font-black uppercase tracking-widest px-1 block" style={{ color: mutedText }}>Accesos y Rol</label>
                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {(['member', 'admin', 'owner'] as const).map((role) => {
                           const isActive = formData.org_role === role;
                           return (
                              <button key={role} type="button" onClick={() => setFormData(prev => ({ ...prev, org_role: role }))} className={`relative p-5 rounded-[1.8rem] text-left transition-all border ${isActive ? 'scale-[1.02] shadow-2xl' : 'opacity-60 grayscale hover:opacity-100'}`} style={{ backgroundColor: isActive ? primaryColor : inputBg, borderColor: isActive ? primaryColor : borderColor }}>
                                 <div className="flex items-center gap-2 min-w-0">
                                    <Shield className="w-5 h-5 shrink-0" style={{ color: isActive ? (isDark ? '#000000' : '#FFFFFF') : mutedText }} strokeWidth={2.5} />
                                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-tight sm:tracking-widest truncate" style={{ color: isActive ? (isDark ? '#000000' : '#FFFFFF') : textColor }}>{role}</span>
                                 </div>
                              </button>
                           );
                        })}
                     </div>
                  </div>
               </div>

               {/* Footer - SOLID & Sticky */}
               <div className="shrink-0 p-5 px-8 flex items-center justify-between gap-4 border-t" style={{ backgroundColor: surfaceColor, borderColor }}>
                  <div className="hidden sm:flex items-center gap-2 opacity-30 select-none"><Briefcase className="w-5 h-5" style={{ color: textColor }} /><span className="text-[9px] font-black uppercase tracking-widest" style={{ color: textColor }}>Editor de Colaboradores</span></div>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                     <button type="button" onClick={onClose} disabled={isSaving} className="flex-1 sm:flex-none px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all" style={{ color: mutedText, backgroundColor: inputBg, borderColor }}>{t('users.buttons.cancel')}</button>
                     <motion.button type="submit" disabled={isSaving} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-[2] sm:flex-none px-8 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-3" style={{ backgroundColor: primaryColor, color: isDark ? '#000000' : '#FFFFFF' }}>
                        {isSaving ? <div className={`w-4 h-4 border-2 ${isDark ? 'border-black/30 border-t-black' : 'border-white/30 border-t-white'} rounded-full animate-spin`} /> : <><span className="font-black">{t('users.buttons.save')}</span><ChevronRight className="w-4 h-4" strokeWidth={3} /></>}
                     </motion.button>
                  </div>
               </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
