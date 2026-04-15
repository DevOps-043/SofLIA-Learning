'use client'

import { X, Mail, Shield, Briefcase, MapPin, Phone, FileText } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import type { UserFormData } from './useUserFormState'

interface UserFormFieldsProps {
  formData: UserFormData
  error: string | null
  isLoading: boolean
  isUploadingImage: boolean
  isDark: boolean
  primaryColor: string
  accentColor: string
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  onRoleChange: (role: UserFormData['org_role']) => void
  onStatusChange: (status: UserFormData['org_status']) => void
  onClose: () => void
  onSubmit: (e: React.FormEvent) => Promise<void>
}

export function UserFormFields({
  formData,
  error,
  isLoading,
  isUploadingImage,
  isDark,
  primaryColor,
  accentColor,
  onChange,
  onRoleChange,
  onStatusChange,
  onClose,
  onSubmit,
}: UserFormFieldsProps) {
  const { t } = useTranslation('business')

  const roleLabels = {
    member: { label: t('users.roles.member'), desc: t('users.modals.add.roleDesc.member') },
    admin: { label: t('users.roles.admin'), desc: t('users.modals.add.roleDesc.admin') },
    owner: { label: t('users.roles.owner'), desc: t('users.modals.add.roleDesc.owner') },
  }
  const statusLabels: Record<string, { label: string; color: string }> = {
    active: { label: t('users.status.active'), color: '#10B981' },
    invited: { label: t('users.status.invited'), color: '#F59E0B' },
    suspended: { label: t('users.status.suspended'), color: '#EF4444' },
    removed: { label: t('users.status.removed'), color: '#6B7280' },
  }

  const inputClass = `w-full px-4 py-3 rounded-2xl border transition-all duration-200 outline-none font-medium text-sm ${
    isDark 
      ? 'bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-white/20 focus:bg-white/10' 
      : 'bg-slate-50 border-slate-200 text-[#0f172a] placeholder:text-slate-400 focus:border-slate-300 focus:bg-white'
  }`
  
  const labelClass = `block text-[11px] font-black uppercase tracking-widest mb-2 ${isDark ? 'text-white/30' : 'text-slate-400'}`
  const iconContainerClass = `absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center ${isDark ? 'text-white/20' : 'text-slate-400'}`

  return (
    <form onSubmit={onSubmit} className="flex-1 flex flex-col h-full overflow-hidden">
      <div
        className={`flex-1 p-5 lg:p-8 overflow-y-auto space-y-7 scrollbar-hide`}
      >
        {error && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
               <X className="w-5 h-5 text-red-500" />
            </div>
            <span className="text-sm font-bold text-red-500">{error}</span>
          </motion.div>
        )}

        {/* Section: Basic Info */}
        <div className="space-y-5">
           <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 rounded-full" style={{ backgroundColor: primaryColor }} />
              <h4 className={`text-xs font-black uppercase tracking-[0.2em] ${isDark ? 'text-white/40' : 'text-slate-500'}`}>{t('users.sections.personalInfo')}</h4>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
             <div className="space-y-1.5">
               <label className={labelClass}>{t('users.modals.add.fields.firstName', 'Nombre')}</label>
               <input type="text" name="first_name" value={formData.first_name} onChange={onChange}
                 className={inputClass} placeholder={t('users.modals.add.placeholders.firstName', 'Ej. Ernesto')} />
             </div>
             <div className="space-y-1.5">
               <label className={labelClass}>{t('users.modals.add.fields.lastName', 'Apellido')}</label>
               <input type="text" name="last_name" value={formData.last_name} onChange={onChange}
                 className={inputClass} placeholder={t('users.modals.add.placeholders.lastName', 'Ej. Hernandez')} />
             </div>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
             <div className="space-y-1.5">
               <label className={labelClass}>{t('users.modals.edit.fields.fullName', 'Nombre para Mostrar')}</label>
               <input type="text" name="display_name" value={formData.display_name} onChange={onChange}
                 className={inputClass} placeholder={t('users.modals.edit.placeholders.fullName', 'Ej. Ernesto Hernandez')} />
             </div>
             <div className="space-y-1.5">
               <label className={labelClass}>{t('users.modals.add.fields.email', 'Email')}</label>
               <div className="relative">
                 <div className={iconContainerClass}>
                    <Mail className="w-4 h-4" />
                 </div>
                 <input type="email" name="email" value={formData.email} onChange={onChange}
                   className={`${inputClass} pl-12`}
                   placeholder={t('users.modals.add.placeholders.email', 'correo@ejemplo.com')} />
               </div>
             </div>
           </div>
        </div>

        {/* Section: Professional Info */}
        <div className="space-y-5 pt-4">
           <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 rounded-full" style={{ backgroundColor: primaryColor }} />
              <h4 className={`text-xs font-black uppercase tracking-[0.2em] ${isDark ? 'text-white/40' : 'text-slate-500'}`}>{t('users.sections.professionalDetails')}</h4>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
             <div className="space-y-1.5">
               <label className={labelClass}>{t('users.modals.add.fields.position', 'Cargo / Puesto')}</label>
               <div className="relative">
                 <div className={iconContainerClass}>
                   <Briefcase className="w-4 h-4" />
                 </div>
                 <input type="text" name="cargo_rol" value={formData.cargo_rol} onChange={onChange}
                   className={`${inputClass} pl-12`}
                   placeholder={t('users.modals.add.placeholders.position', 'Ej. Director de Marketing')} />
               </div>
             </div>
             <div className="space-y-1.5">
               <label className={labelClass}>{t('users.modals.edit.fields.typeRole', 'Especialidad / Departamento')}</label>
               <input type="text" name="job_title" value={formData.job_title} onChange={onChange}
                 className={inputClass} placeholder={t('users.modals.edit.placeholders.typeRole', 'Ej. Ventas')} />
             </div>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
             <div className="space-y-1.5">
               <label className={labelClass}>{t('users.modals.edit.fields.phone', 'Teléfono')}</label>
               <div className="relative">
                 <div className={iconContainerClass}>
                   <Phone className="w-4 h-4" />
                 </div>
                 <input type="tel" name="phone" value={formData.phone} onChange={onChange}
                   className={`${inputClass} pl-12`}
                   placeholder={t('users.modals.edit.placeholders.phone', '+52 ...')} />
               </div>
             </div>
             <div className="space-y-1.5">
               <label className={labelClass}>{t('users.modals.edit.fields.location', 'Ubicación')}</label>
               <div className="relative">
                 <div className={iconContainerClass}>
                   <MapPin className="w-4 h-4" />
                 </div>
                 <input type="text" name="location" value={formData.location} onChange={onChange}
                   className={`${inputClass} pl-12`}
                   placeholder={t('users.modals.edit.placeholders.location', 'Ciudad, País')} />
               </div>
             </div>
           </div>

           <div className="space-y-1.5">
             <label className={labelClass}>{t('users.modals.edit.fields.bio', 'Biografía')}</label>
             <div className="relative">
               <div className="absolute left-4 top-4 flex items-center justify-center text-slate-400 dark:text-white/20">
                 <FileText className="w-4 h-4" />
               </div>
               <textarea name="bio" value={formData.bio} onChange={onChange} rows={3}
                 className={`${inputClass} pl-12 pt-3 resize-none`}
                 placeholder={t('users.modals.edit.placeholders.bio', 'Escribe una breve descripción personal...')} />
             </div>
           </div>
        </div>

        {/* Section: Roles & Safety */}
        <div className="space-y-5 pt-4">
           <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 rounded-full" style={{ backgroundColor: primaryColor }} />
              <h4 className={`text-xs font-black uppercase tracking-[0.2em] ${isDark ? 'text-white/40' : 'text-slate-500'}`}>{t('users.sections.accessConfig')}</h4>
           </div>

           <div className="space-y-4">
             <label className={labelClass}>{t('users.modals.add.fields.orgRole', 'Rol Administrativo')}</label>
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
               {(['member', 'admin', 'owner'] as const).map(role => (
                 <button key={role} type="button" onClick={() => onRoleChange(role)}
                   className={`p-4 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden group ${
                     formData.org_role === role 
                       ? 'border-transparent shadow-xl' 
                       : isDark ? 'border-white/5 bg-white/5 hover:border-white/10' : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                   }`}
                   style={formData.org_role === role ? { 
                     background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                     boxShadow: `0 10px 20px ${primaryColor}20` 
                   } : {}}
                 >
                   <div className="flex flex-col gap-2 relative z-10">
                     <div className={`p-2 rounded-xl w-fit ${formData.org_role === role ? 'bg-white/20' : 'bg-white/5 dark:bg-white/10'}`}>
                        <Shield className={`w-4 h-4 ${formData.org_role === role ? 'text-white' : isDark ? 'text-white/40' : 'text-slate-400'}`} />
                     </div>
                     <span className={`text-xs font-black uppercase tracking-widest ${formData.org_role === role ? 'text-white' : isDark ? 'text-white/70' : 'text-[#0f172a]'}`}>
                       {roleLabels[role].label}
                     </span>
                     <p className={`text-[10px] sm:block leading-relaxed ${formData.org_role === role ? 'text-white/70' : isDark ? 'text-white/30' : 'text-slate-400'}`}>
                       {roleLabels[role].desc}
                     </p>
                   </div>
                   {formData.org_role === role && (
                     <motion.div layoutId="roleActive" className="absolute top-2 right-2 w-2 h-2 rounded-full bg-white shadow-sm" />
                   )}
                 </button>
               ))}
             </div>
           </div>

           <div className="space-y-4">
             <label className={labelClass}>{t('users.modals.edit.fields.status', 'Estado de Cuenta')}</label>
             <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
               {(['active', 'invited', 'suspended', 'removed'] as const).map(status => (
                 <button key={status} type="button" onClick={() => onStatusChange(status)}
                   className={`p-3 rounded-2xl border text-center transition-all duration-300 uppercase tracking-widest text-[10px] font-black ${
                     formData.org_status === status 
                       ? 'shadow-lg bg-white dark:bg-[#1a1f2e]' 
                       : isDark ? 'border-white/5 bg-white/5 opacity-50 grayscale' : 'border-slate-100 bg-slate-50 opacity-50 grayscale'
                   }`}
                   style={formData.org_status === status ? { 
                     borderColor: statusLabels[status].color,
                     color: statusLabels[status].color,
                   } : {}}
                 >
                    {statusLabels[status].label}
                 </button>
               ))}
             </div>
           </div>
        </div>
      </div>

      {/* Footer */}
      <div className={`p-6 lg:p-8 border-t flex items-center justify-end gap-3 shrink-0 ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
        <button type="button" onClick={onClose} disabled={isLoading}
          className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
            isDark ? 'text-white/40 hover:text-white hover:bg-white/5' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          {t('users.buttons.cancel', 'Cancelar')}
        </button>
        <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          disabled={isLoading || isUploadingImage}
          className="px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-[0.1em] flex items-center gap-3 transition-all shadow-xl hover:shadow-2xl active:scale-95 disabled:grayscale"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
            color: isDark ? '#000000' : '#FFFFFF',
            boxShadow: `0 10px 30px ${primaryColor}40`,
          }}
        >
          {isLoading || isUploadingImage ? (
            <>
              <div className={`w-4 h-4 border-2 ${isDark ? 'border-black/30 border-t-black' : 'border-white/30 border-t-white'} rounded-full animate-spin`} />
              <span>{isUploadingImage ? t('users.buttons.uploading', 'Subiendo...') : t('users.buttons.saving', 'Guardando...')}</span>
            </>
          ) : (
            <>
               <span>{t('users.buttons.save', 'Guardar Cambios')}</span>
            </>
          )}
        </motion.button>
      </div>
    </form>
  )
}
