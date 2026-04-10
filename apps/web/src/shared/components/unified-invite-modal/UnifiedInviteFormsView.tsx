'use client';

import { motion } from 'framer-motion';
import {
  AlertCircle,
  Briefcase,
  Calendar,
  Link2,
  Mail,
  MessageSquare,
  Send,
  Shield,
  Sparkles,
  Users,
  ChevronRight,
} from 'lucide-react';
import type {
  BulkInviteForm,
  IndividualInviteForm,
  InviteRole,
  ModalStatus,
  UnifiedInviteModalController,
  UnifiedInviteTheme,
} from './types';

interface UnifiedInviteFormsViewProps {
  controller: UnifiedInviteModalController;
  mode: 'bulk' | 'individual';
  onClose: () => void;
  theme: UnifiedInviteTheme;
}

interface InviteRoleSelectorProps<TForm extends BulkInviteForm | IndividualInviteForm> {
  form: TForm;
  onRoleChange: (role: InviteRole) => void;
  roleLabels: UnifiedInviteModalController['roleLabels'];
  status: ModalStatus;
  theme: UnifiedInviteTheme;
}

function InviteRoleSelector<TForm extends BulkInviteForm | IndividualInviteForm>({
  form,
  onRoleChange,
  roleLabels,
  status,
  theme,
}: InviteRoleSelectorProps<TForm>) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
      {(['member', 'admin', 'owner'] as const).map((role) => {
         const isActive = form.role === role;
         return (
            <button
               key={role}
               type="button"
               disabled={status === 'loading'}
               onClick={() => onRoleChange(role)}
               className={`relative p-3 sm:p-4 rounded-[1.5rem] text-left transition-all border shrink-0 ${isActive ? 'scale-[1.02] shadow-2xl' : 'opacity-60 grayscale hover:opacity-100 hover:grayscale-0'}`}
               style={{
                  backgroundColor: isActive ? theme.primaryColor : theme.inputBg,
                  borderColor: isActive ? theme.primaryColor : theme.borderColor,
               }}
            >
               <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 min-w-0">
                    <Shield className="w-5 h-5 shrink-0" style={{ color: isActive ? theme.onPrimaryColor : theme.mutedText }} strokeWidth={2.5} />
                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-tight sm:tracking-widest truncate" style={{ color: isActive ? theme.onPrimaryColor : theme.textColor }}>
                       {roleLabels[role].label}
                    </span>
                  </div>
                  <p className="text-[9px] sm:text-[10px] opacity-60 leading-tight hidden sm:block truncate" style={{ color: isActive ? theme.onPrimaryColor : theme.mutedText }}>
                     {roleLabels[role].desc}
                  </p>
               </div>
            </button>
         );
      })}
    </div>
  );
}

export function UnifiedInviteFormsView({
  controller,
  mode,
  onClose,
  theme,
}: UnifiedInviteFormsViewProps) {
  const {
    bulkForm,
    error,
    handleBulkSubmit,
    handleIndividualSubmit,
    individualForm,
    roleLabels,
    setBulkForm,
    setIndividualForm,
    status,
    t,
  } = controller;

  const scrollStyle = {
    scrollbarColor: 'rgba(255,255,255,0.05) transparent',
    scrollbarWidth: 'thin' as const,
  };

  const footerBg = theme.surfaceColor;

  if (mode === 'individual') {
    return (
      <form className="flex flex-col h-full overflow-hidden" onSubmit={handleIndividualSubmit}>
        <div className="flex-1 overflow-y-auto pt-4 sm:pt-6 pb-8 px-6 lg:px-12 space-y-6 sm:space-y-8" style={scrollStyle}>
          {error && (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3"
              initial={{ opacity: 0, y: -10 }}
            >
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <span className="text-[11px] font-black uppercase text-red-400 flex-1">{error}</span>
            </motion.div>
          )}

          {/* Email & Position - Grid for compact layout on 13" laptops */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
             {/* Email */}
             <div className="space-y-3">
               <label className="text-[10px] font-black uppercase tracking-widest px-1 block" style={{ color: theme.mutedText }}>
                  {t('users.modals.invite.fields.email', 'Email Address')} <span className="text-red-400">*</span>
               </label>
               <div className="relative group">
                 <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors" style={{ color: theme.mutedText }} />
                 <input
                   className="w-full pl-12 pr-4 py-4 rounded-2xl border bg-transparent focus:outline-none transition-all text-xs sm:text-sm font-medium"
                   disabled={status === 'loading'}
                   onChange={(event) =>
                     setIndividualForm((currentForm) => ({
                       ...currentForm,
                       email: event.target.value,
                     }))
                   }
                   placeholder="usuario@empresa.com"
                   required
                   style={{
                     backgroundColor: theme.inputBg,
                     borderColor: theme.borderColor,
                     color: theme.textColor,
                   }}
                   type="email"
                   value={individualForm.email}
                 />
               </div>
             </div>

             {/* Position */}
             <div className="space-y-3">
               <label className="text-[10px] font-black uppercase tracking-widest px-1 block" style={{ color: theme.mutedText }}>
                  {t('users.modals.invite.fields.position', 'Cargo / Posición')}
                  <span className="ml-1 opacity-40 uppercase">({t('common.optional', 'Opcional')})</span>
               </label>
               <div className="relative group">
                 <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors" style={{ color: theme.mutedText }} />
                 <input
                   className="w-full pl-12 pr-4 py-4 rounded-2xl border bg-transparent focus:outline-none transition-all text-xs sm:text-sm font-medium"
                   disabled={status === 'loading'}
                   maxLength={100}
                   onChange={(event) =>
                     setIndividualForm((currentForm) => ({
                       ...currentForm,
                       position: event.target.value,
                     }))
                   }
                   placeholder="Ej: Gerente de Ventas"
                   style={{
                     backgroundColor: theme.inputBg,
                     borderColor: theme.borderColor,
                     color: theme.textColor,
                   }}
                   type="text"
                   value={individualForm.position}
                 />
               </div>
             </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest px-1 block" style={{ color: theme.mutedText }}>
               {t('users.modals.invite.fields.role', 'Rol en la organización')} <span className="text-red-400">*</span>
            </label>
            <InviteRoleSelector
              form={individualForm}
              onRoleChange={(role) =>
                setIndividualForm((currentForm) => ({ ...currentForm, role }))
              }
              roleLabels={roleLabels}
              status={status}
              theme={theme}
            />
          </div>

          {/* Message */}
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest px-1 block" style={{ color: theme.mutedText }}>
               {t('users.modals.invite.fields.message', 'Mensaje personalizado')}
               <span className="ml-1 opacity-40 uppercase">({t('common.optional', 'Opcional')})</span>
            </label>
            <div className="relative group">
              <MessageSquare className="absolute left-4 top-4 w-4 h-4 transition-colors" style={{ color: theme.mutedText }} />
              <textarea
                className="w-full pl-12 pr-4 py-4 rounded-[2rem] border bg-transparent focus:outline-none transition-all text-xs sm:text-sm font-medium resize-none"
                disabled={status === 'loading'}
                maxLength={500}
                onChange={(event) =>
                  setIndividualForm((currentForm) => ({
                    ...currentForm,
                    customMessage: event.target.value,
                  }))
                }
                placeholder="Agrega un mensaje de bienvenida..."
                rows={3}
                style={{
                  backgroundColor: theme.inputBg,
                  borderColor: theme.borderColor,
                  color: theme.textColor,
                }}
                value={individualForm.customMessage}
              />
              <p className="absolute bottom-4 right-6 text-[10px] font-black uppercase tracking-widest opacity-20" style={{ color: theme.mutedText }}>
                {individualForm.customMessage.length}/500
              </p>
            </div>
          </div>

          {/* Info Hint - Extra Compact */}
          <div className="p-4 rounded-[1.5rem] border bg-transparent" style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor }}>
            <div className="flex items-center gap-4">
              <Sparkles className="w-5 h-5 shrink-0" style={{ color: theme.accentColor }} />
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest opacity-60 leading-relaxed" style={{ color: theme.mutedText }}>
                {t('users.modals.invite.hints.info', 'El usuario recibirá un correo con el enlace. Expira en 7 días.')}
              </p>
            </div>
          </div>
        </div>

        {/* Footer - ULTRA COMPACT */}
        <div 
           className="shrink-0 p-4 sm:p-5 lg:px-8 flex items-center justify-between gap-4 border-t"
           style={{ backgroundColor: footerBg, borderColor: theme.borderColor }}
        >
          <div className="hidden sm:flex items-center gap-2 opacity-30 select-none">
             <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/5 border border-white/10">
                <Send className="w-3.5 h-3.5" style={{ color: theme.textColor }} />
             </div>
             <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: theme.textColor }}>{t('users.modals.unified.tabs.individual', 'Individual')}</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
             <button
               className="flex-1 sm:flex-none px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border"
               disabled={status === 'loading'}
               onClick={onClose}
               style={{ color: theme.mutedText, backgroundColor: theme.inputBg, borderColor: theme.borderColor }}
               type="button"
             >
               {t('users.buttons.cancel', 'Cancelar')}
             </button>
             <motion.button
               className="flex-[2] sm:flex-none px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg"
               disabled={status === 'loading'}
               style={{ backgroundColor: theme.primaryColor, color: theme.onPrimaryColor }}
               type="submit"
               whileHover={{ scale: 1.02 }}
               whileTap={{ scale: 0.98 }}
             >
               {status === 'loading' ? (
                 <>
                   <div className={`w-4 h-4 border-2 ${theme.isDark ? 'border-black/30 border-t-black' : 'border-white/30 border-t-white'} rounded-full animate-spin`} />
                   <span>{t('users.buttons.sending', 'Enviando...')}</span>
                 </>
               ) : (
                 <>
                   <span>{t('users.buttons.sendInvite', 'Enviar Invitación')}</span>
                   <ChevronRight className="w-4 h-4" />
                 </>
               )}
             </motion.button>
          </div>
        </div>
      </form>
    );
  }

  return (
    <form className="flex flex-col h-full overflow-hidden" onSubmit={handleBulkSubmit}>
      <div className="flex-1 overflow-y-auto pt-4 sm:pt-6 pb-8 px-6 lg:px-12 space-y-6 sm:space-y-8" style={scrollStyle}>
        {error && (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3"
            initial={{ opacity: 0, y: -10 }}
          >
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <span className="text-[11px] font-black uppercase text-red-400 flex-1">{error}</span>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
           {/* Link Name */}
           <div className="space-y-3">
             <label className="text-[10px] font-black uppercase tracking-widest px-1 block" style={{ color: theme.mutedText }}>
                {t('users.modals.bulkInvite.fields.name', 'Nombre del enlace')}
                <span className="ml-1 opacity-40 uppercase">({t('common.optional', 'Opcional')})</span>
             </label>
             <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors" style={{ color: theme.mutedText }} />
                <input
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border bg-transparent focus:outline-none transition-all text-xs sm:text-sm font-medium"
                  disabled={status === 'loading'}
                  maxLength={100}
                  onChange={(event) =>
                    setBulkForm((currentForm) => ({
                      ...currentForm,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Ej: Invitación Equipo de Ventas"
                  style={{
                    backgroundColor: theme.inputBg,
                    borderColor: theme.borderColor,
                    color: theme.textColor,
                  }}
                  type="text"
                  value={bulkForm.name}
                />
             </div>
           </div>

           {/* Max Uses */}
           <div className="space-y-3">
             <label className="text-[10px] font-black uppercase tracking-widest px-1 block" style={{ color: theme.mutedText }}>
                {t('users.modals.bulkInvite.fields.maxUses', 'Número máximo de registros')} <span className="text-red-400">*</span>
             </label>
             <div className="relative group">
               <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors" style={{ color: theme.mutedText }} />
               <input
                 className="w-full pl-12 pr-4 py-4 rounded-2xl border bg-transparent focus:outline-none transition-all text-xs sm:text-sm font-medium"
                 disabled={status === 'loading'}
                 max={10000}
                 min={1}
                 onChange={(event) =>
                   setBulkForm((currentForm) => ({
                     ...currentForm,
                     maxUses: parseInt(event.target.value, 10) || 0,
                   }))
                 }
                 required
                 style={{
                   backgroundColor: theme.inputBg,
                   borderColor: theme.borderColor,
                   color: theme.textColor,
                 }}
                 type="number"
                 value={bulkForm.maxUses}
               />
             </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-end">
           {/* Role Selection */}
           <div className="space-y-4">
             <label className="text-[10px] font-black uppercase tracking-widest px-1 block" style={{ color: theme.mutedText }}>
                {t('users.modals.bulkInvite.fields.role', 'Rol asignado')} <span className="text-red-400">*</span>
             </label>
             <InviteRoleSelector
               form={bulkForm}
               onRoleChange={(role) =>
                 setBulkForm((currentForm) => ({ ...currentForm, role }))
               }
               roleLabels={roleLabels}
               status={status}
               theme={theme}
             />
           </div>

           {/* Expiration */}
           <div className="space-y-3">
             <label className="text-[10px] font-black uppercase tracking-widest px-1 block" style={{ color: theme.mutedText }}>
                {t('users.modals.bulkInvite.fields.expiresAt', 'Fecha de expiración')} <span className="text-red-400">*</span>
             </label>
             <div className="relative group">
               <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors" style={{ color: theme.mutedText }} />
               <input
                 className="w-full pl-12 pr-4 py-4 rounded-2xl border bg-transparent focus:outline-none transition-all text-sm font-medium"
                 disabled={status === 'loading'}
                 min={new Date().toISOString().slice(0, 16)}
                 onChange={(event) =>
                   setBulkForm((currentForm) => ({
                     ...currentForm,
                     expiresAt: event.target.value,
                   }))
                 }
                 required
                 style={{
                   backgroundColor: theme.inputBg,
                   borderColor: theme.borderColor,
                   color: theme.textColor,
                 }}
                 type="datetime-local"
                 value={bulkForm.expiresAt}
               />
             </div>
           </div>
        </div>

        <div
          className="p-4 rounded-[1.5rem] border bg-transparent"
          style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor }}
        >
          <div className="flex items-center gap-4">
            <Sparkles className="w-5 h-5 shrink-0" style={{ color: theme.accentColor }} />
            <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest opacity-60 leading-relaxed" style={{ color: theme.mutedText }}>
               {t('users.modals.bulkInvite.hints.info', 'El enlace permitirá registros masivos con el rol especificado.')}
            </p>
          </div>
        </div>
      </div>

      {/* Footer - ULTRA COMPACT */}
      <div 
         className="shrink-0 p-4 sm:p-5 lg:px-8 flex items-center justify-between gap-4 border-t"
         style={{ backgroundColor: footerBg, borderColor: theme.borderColor }}
      >
        <div className="hidden sm:flex items-center gap-2 opacity-30 select-none">
           <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/5 border border-white/10">
              <Link2 className="w-3.5 h-3.5" style={{ color: theme.textColor }} />
           </div>
           <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: theme.textColor }}>{t('users.modals.unified.tabs.bulk', 'Enlace')}</span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
           <button
             className="flex-1 sm:flex-none px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border"
             disabled={status === 'loading'}
             onClick={onClose}
             style={{ color: theme.mutedText, backgroundColor: theme.inputBg, borderColor: theme.borderColor }}
             type="button"
           >
             {t('users.buttons.cancel', 'Cancelar')}
           </button>
           <motion.button
             className="flex-[2] sm:flex-none px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg"
             disabled={status === 'loading'}
             style={{ backgroundColor: theme.primaryColor, color: theme.onPrimaryColor }}
             type="submit"
             whileHover={{ scale: 1.02 }}
             whileTap={{ scale: 0.98 }}
           >
             {status === 'loading' ? (
               <>
                 <div className={`w-4 h-4 border-2 ${theme.isDark ? 'border-black/30 border-t-black' : 'border-white/30 border-t-white'} rounded-full animate-spin`} />
                 <span>{t('users.buttons.creating', 'Creando...')}</span>
               </>
             ) : (
               <>
                 <span>{t('users.buttons.createLink', 'Crear Enlace')}</span>
                 <ChevronRight className="w-4 h-4" />
               </>
             )}
           </motion.button>
        </div>
      </div>
    </form>
  );
}
