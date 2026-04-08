'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, Mail, Shield, Lock, UserPlus, Camera, Sparkles, Briefcase, ChevronRight, Info, AlertCircle } from 'lucide-react'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext'
import { useThemeStore } from '@/core/stores/themeStore'

interface BusinessAddUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (userData: {
    username: string
    email: string
    password: string
    first_name?: string
    last_name?: string
    display_name?: string
    job_title: string
    org_role?: 'owner' | 'admin' | 'member'
    profile_picture_url?: string
  }) => Promise<void>
}

export function BusinessAddUserModal({ isOpen, onClose, onSave }: BusinessAddUserModalProps) {
  const { t } = useTranslation('business')
  const { styles } = useOrganizationStylesContext()
  const { resolvedTheme } = useThemeStore()
  const isDark = resolvedTheme === 'dark'
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Theme Colors
  const primaryColor = isDark ? '#00D4B3' : (styles?.panel?.primary_button_color || '#0066FF')
  const accentColor = isDark ? '#00D4B3' : (styles?.panel?.accent_color || '#00D4B3')
  const textColor = isDark ? '#FFFFFF' : '#0F172A'
  const mutedText = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(15,23,42,0.5)'
  const borderColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
  const inputBg = isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.05)'
  const surfaceColor = isDark ? '#0b0e14' : '#FFFFFF'

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    display_name: '',
    job_title: '',
    org_role: 'member' as 'owner' | 'admin' | 'member',
    profile_picture_url: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)

  useEffect(() => {
    const fullName = `${formData.first_name} ${formData.last_name}`.trim()
    setFormData(prev => {
      if (prev.display_name === fullName) return prev
      return { ...prev, display_name: fullName }
    })
  }, [formData.first_name, formData.last_name])

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        display_name: '',
        job_title: '',
        org_role: 'member',
        profile_picture_url: ''
      })
      setError(null)
      setPreviewImage(null)
      setPendingFile(null)
    }
  }, [isOpen])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => setPreviewImage(reader.result as string)
    reader.readAsDataURL(file)
    setPendingFile(file)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      let profilePictureUrl = formData.profile_picture_url
      if (pendingFile) {
        const formDataUpload = new FormData()
        formDataUpload.append('file', pendingFile)
        const response = await fetch('/api/business/users/upload-picture', { method: 'POST', body: formDataUpload, credentials: 'include' })
        if (response.ok) {
          const { imageUrl } = await response.json()
          profilePictureUrl = imageUrl
        }
      }
      await onSave({ ...formData, profile_picture_url: profilePictureUrl || undefined })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  const roleLabels = {
    member: { label: t('users.roles.member'), desc: t('users.modals.add.roleDesc.member') },
    admin: { label: t('users.roles.admin'), desc: t('users.modals.add.roleDesc.admin') },
    owner: { label: t('users.roles.owner'), desc: t('users.modals.add.roleDesc.owner') }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 flex items-center justify-center p-0 sm:p-4 isolate" style={{ zIndex: 99999 }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-transparent" />
        <motion.div
           initial={{ opacity: 0, scale: 0.95, y: 20 }}
           animate={{ opacity: 1, scale: 1, y: 0 }}
           exit={{ opacity: 0, scale: 0.95, y: 20 }}
           className="relative w-full max-w-5xl h-full sm:h-[85vh] sm:max-h-[750px] flex flex-col bg-transparent overflow-hidden shadow-2xl sm:rounded-[2.5rem]"
           onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col h-full overflow-hidden border" style={{ backgroundColor: surfaceColor, borderColor }}>
            <div className="relative shrink-0 pt-6 pb-4 px-6 lg:px-12 border-b border-white/5">
               <div className="flex flex-col sm:flex-row items-center gap-8">
                  <div className="relative shrink-0 group pointer-events-auto">
                    <div onClick={() => fileInputRef.current?.click()} className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-2xl border-4 cursor-pointer overflow-hidden relative" style={{ background: previewImage ? 'transparent' : `linear-gradient(135deg, ${primaryColor}, ${accentColor})`, borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF' }}>
                       {previewImage ? <Image src={previewImage} alt="Preview" fill className="object-cover" /> : <UserPlus className="w-8 h-8 text-white" strokeWidth={2.5} />}
                       <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Camera className="w-5 h-5 text-white" /></div>
                    </div>
                    <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                     <h2 className="text-2xl font-black tracking-tight mb-1" style={{ color: textColor }}>{formData.display_name || t('users.modals.add.title')}</h2>
                     <div className="px-3 py-1 rounded-xl border text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2" style={{ backgroundColor: inputBg, borderColor, color: mutedText }}><Info className="w-3.5 h-3.5" /><span>{t('users.modals.add.userInfoSubtitle')}</span></div>
                  </div>
                  <button onClick={onClose} className="p-3 rounded-2xl border transition-all" style={{ backgroundColor: inputBg, borderColor, color: mutedText }}><X className="w-5 h-5" /></button>
               </div>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
               <div className="flex-1 overflow-y-auto pt-6 pb-12 px-6 lg:px-12 space-y-8" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.05) transparent' }}>
                  {error && <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3"><AlertCircle className="w-5 h-5 text-red-400 shrink-0" /><span className="text-[10px] font-black uppercase text-red-400 flex-1">{error}</span></div>}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                     <div className="space-y-6">
                        <label className="text-[10px] font-black uppercase tracking-widest px-1 block" style={{ color: mutedText }}>Información Personal</label>
                        <div className="grid grid-cols-2 gap-4">
                           <input className="w-full px-5 py-4 rounded-2xl border bg-transparent focus:outline-none transition-all text-sm font-medium" name="first_name" value={formData.first_name} onChange={handleChange} placeholder="Nombre" style={{ backgroundColor: inputBg, borderColor, color: textColor }} />
                           <input className="w-full px-5 py-4 rounded-2xl border bg-transparent focus:outline-none transition-all text-sm font-medium" name="last_name" value={formData.last_name} onChange={handleChange} placeholder="Apellido" style={{ backgroundColor: inputBg, borderColor, color: textColor }} />
                        </div>
                        <input className="w-full px-5 py-4 rounded-2xl border bg-transparent focus:outline-none transition-all text-sm font-medium" name="username" value={formData.username} onChange={handleChange} required placeholder="Nombre de usuario" style={{ backgroundColor: inputBg, borderColor, color: textColor }} />
                     </div>
                     <div className="space-y-6">
                        <label className="text-[10px] font-black uppercase tracking-widest px-1 block" style={{ color: mutedText }}>Credenciales y Cargo</label>
                        <input className="w-full px-5 py-4 rounded-2xl border bg-transparent focus:outline-none transition-all text-sm font-medium" name="email" value={formData.email} onChange={handleChange} required type="email" placeholder="Correo electrónico" style={{ backgroundColor: inputBg, borderColor, color: textColor }} />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <input className="w-full px-5 py-4 rounded-2xl border bg-transparent focus:outline-none transition-all text-sm font-medium" name="password" value={formData.password} onChange={handleChange} required type="password" placeholder="Contraseña" style={{ backgroundColor: inputBg, borderColor, color: textColor }} />
                           <input className="w-full px-5 py-4 rounded-2xl border bg-transparent focus:outline-none transition-all text-sm font-medium" name="job_title" value={formData.job_title} onChange={handleChange} required placeholder="Cargo / Puesto" style={{ backgroundColor: inputBg, borderColor, color: textColor }} />
                        </div>
                     </div>
                  </div>
                  <div className="space-y-4">
                     <label className="text-[10px] font-black uppercase tracking-widest px-1 block" style={{ color: mutedText }}>Permisos en la Organización</label>
                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {(['member', 'admin', 'owner'] as const).map((role) => {
                           const isActive = formData.org_role === role;
                           return (
                              <button key={role} type="button" onClick={() => setFormData(prev => ({ ...prev, org_role: role }))} className={`relative p-5 rounded-[1.8rem] text-left transition-all border ${isActive ? 'scale-[1.02] shadow-2xl' : 'opacity-60 grayscale hover:opacity-100'}`} style={{ backgroundColor: isActive ? primaryColor : inputBg, borderColor: isActive ? primaryColor : borderColor }}>
                                 <div className="flex items-center gap-2 mb-2 min-w-0">
                                    <Shield className="w-5 h-5 shrink-0" style={{ color: isActive ? (isDark ? '#000000' : '#FFFFFF') : mutedText }} strokeWidth={2.5} />
                                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-tight sm:tracking-widest truncate" style={{ color: isActive ? (isDark ? '#000000' : '#FFFFFF') : textColor }}>{roleLabels[role].label}</span>
                                 </div>
                                 <p className="text-[10px] opacity-60 leading-tight hidden sm:block truncate" style={{ color: isActive ? (isDark ? '#000000' : '#FFFFFF') : mutedText }}>{roleLabels[role].desc}</p>
                              </button>
                           );
                        })}
                     </div>
                  </div>
               </div>
               <div className="shrink-0 p-5 px-8 flex items-center justify-between gap-4 border-t" style={{ backgroundColor: surfaceColor, borderColor }}>
                  <div className="hidden sm:flex items-center gap-2 opacity-30 select-none"><UserPlus className="w-5 h-5" style={{ color: textColor }} /><span className="text-[9px] font-black uppercase tracking-widest" style={{ color: textColor }}>Registrar Miembro</span></div>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                     <button type="button" onClick={onClose} disabled={isLoading} className="flex-1 sm:flex-none px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all" style={{ color: mutedText, backgroundColor: inputBg, borderColor }}>{t('users.buttons.cancel')}</button>
                     <motion.button type="submit" disabled={isLoading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-[2] sm:flex-none px-8 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-3" style={{ backgroundColor: primaryColor, color: isDark ? '#000000' : '#FFFFFF' }}>
                        {isLoading ? <div className={`w-4 h-4 border-2 ${isDark ? 'border-black/30 border-t-black' : 'border-white/30 border-t-white'} rounded-full animate-spin`} /> : <><span className="font-black">{t('users.buttons.create')}</span><ChevronRight className="w-4 h-4" strokeWidth={3} /></>}
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
