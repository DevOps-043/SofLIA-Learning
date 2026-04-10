'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Search,
  Check,
  Clock,
  Sparkles,
  UserCheck,
  AlertCircle,
  Users,
  ChevronRight,
  BookOpen,
  Calendar,
  XCircle,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useBusinessPanelTheme } from '../hooks/useBusinessPanelTheme'
import {
  getBusinessAssignCourseDisplayName,
  getDateInputValue,
  toEndOfDayIso,
  type BusinessAssignCourseModalProps,
  useBusinessAssignCourseModal,
} from './business-assign-course-modal'

export function BusinessAssignCourseModal({
  isOpen,
  onClose,
  courseId,
  courseTitle,
  orgSlug,
  onAssignComplete,
}: BusinessAssignCourseModalProps) {
  const { t } = useTranslation('business')
  const panelTheme = useBusinessPanelTheme()

  const primaryColor = panelTheme.primaryColor
  const accentColor = panelTheme.accentColor
  const textColor = panelTheme.textColor
  const mutedText = panelTheme.mutedTextColor
  const borderColor = panelTheme.borderColor
  const inputBg = panelTheme.inputBg
  const surfaceColor = panelTheme.panelBg
  const onPrimaryColor = panelTheme.onPrimaryColor

  const modal = useBusinessAssignCourseModal({
    isOpen,
    courseId,
    courseTitle,
    orgSlug,
    onAssignComplete,
    onClose,
    t,
  })

  if (!isOpen) {
    return null
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 flex items-center justify-center p-0 sm:p-4 isolate" style={{ zIndex: 99999 }}>
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          onClick={modal.handleClose} 
          className="absolute inset-0 backdrop-blur-sm" 
          style={{ backgroundColor: panelTheme.overlayBg }}
        />

        {/* Modal Container */}
        <motion.div
           initial={{ opacity: 0, scale: 0.95, y: 30 }}
           animate={{ opacity: 1, scale: 1, y: 0 }}
           exit={{ opacity: 0, scale: 0.95, y: 20 }}
           className="relative w-full max-w-5xl h-full sm:h-[85vh] sm:max-h-[850px] flex flex-col bg-transparent overflow-hidden shadow-2xl sm:rounded-[2.5rem]"
           onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col h-full overflow-hidden border" style={{ backgroundColor: surfaceColor, borderColor }}>
            
            {/* Header: Exact replica of AddUserModal */}
            <div className="relative shrink-0 pt-8 pb-6 px-6 lg:px-12 border-b" style={{ borderColor }}>
               <div className="flex flex-col sm:flex-row items-center gap-8">
                  <div className="relative shrink-0">
                    <div className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-2xl border-4" 
                         style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`, borderColor }}>
                       <BookOpen className="w-8 h-8" style={{ color: onPrimaryColor }} strokeWidth={2.5} />
                       <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="absolute -top-2 -right-2 w-7 h-7 rounded-lg flex items-center justify-center shadow-lg"
                          style={{ backgroundColor: accentColor }}
                        >
                          <Sparkles className="w-4 h-4" style={{ color: onPrimaryColor }} />
                        </motion.div>
                    </div>
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                     <h2 className="text-2xl font-black tracking-tight mb-1" style={{ color: textColor }}>
                       {t('assignCourse.title', 'Asignar Curso')}
                     </h2>
                     <div className="px-3 py-1 rounded-xl border text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2" 
                          style={{ backgroundColor: inputBg, borderColor, color: mutedText }}>
                       <Users className="w-3.5 h-3.5" />
                       <span>{courseTitle}</span>
                     </div>
                  </div>
                  <button onClick={modal.handleClose} 
                          className="p-3 rounded-2xl border transition-all" 
                          style={{ backgroundColor: inputBg, borderColor, color: mutedText }}
                          onMouseEnter={(event) => {
                            event.currentTarget.style.backgroundColor = panelTheme.hoverBg
                          }}
                          onMouseLeave={(event) => {
                            event.currentTarget.style.backgroundColor = inputBg
                          }}>
                    <X className="w-5 h-5" />
                  </button>
               </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto pt-8 pb-12 px-6 lg:px-12 space-y-10" style={{ scrollbarWidth: 'thin', scrollbarColor: `${borderColor} transparent` }}>
               
               {/* Selection Error */}
               <AnimatePresence>
                 {modal.error && (
                   <motion.div
                     initial={{ opacity: 0, scale: 0.9 }}
                     animate={{ opacity: 1, scale: 1 }}
                     exit={{ opacity: 0, scale: 0.9 }}
                     className="p-4 rounded-xl border flex items-center gap-3"
                     style={{ backgroundColor: `${panelTheme.dangerColor}10`, borderColor: `${panelTheme.dangerColor}20` }}
                   >
                     <AlertCircle className="w-5 h-5 shrink-0" style={{ color: panelTheme.dangerColor }} />
                     <span className="text-[10px] font-black uppercase flex-1" style={{ color: panelTheme.dangerColor }}>{modal.error}</span>
                   </motion.div>
                 )}
               </AnimatePresence>

               {/* Section 1: Users Selection */}
               <div className="space-y-6">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-black uppercase tracking-widest" style={{ color: mutedText }}>
                      Seleccionar Destinatarios ({modal.selectedUserCount} seleccionados)
                    </label>
                    <div className="flex items-center gap-3">
                       <div className="text-[10px] font-black uppercase tracking-widest opacity-40">
                         {modal.availableUserCount} disponibles
                       </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    <div className="lg:col-span-8 relative group">
                      <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30 group-focus-within:opacity-100 transition-opacity" style={{ color: textColor }} />
                      <input 
                        className="w-full pl-12 pr-6 py-4 rounded-2xl border bg-transparent focus:outline-none transition-all text-sm font-medium" 
                        placeholder={t('assignCourse.search.users', 'Buscar usuarios...')} 
                        value={modal.searchTerm}
                        onChange={(event) => modal.setSearchTerm(event.target.value)}
                        style={{ backgroundColor: inputBg, borderColor, color: textColor }} 
                      />
                    </div>
                    {modal.availableUserCount > 0 && (
                      <button 
                        type="button"
                        onClick={modal.handleSelectAllUsers}
                        className="lg:col-span-4 flex items-center justify-center gap-3 py-4 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-widest"
                        style={{ 
                          backgroundColor: modal.allUsersSelected ? `${primaryColor}15` : inputBg, 
                          borderColor: modal.allUsersSelected ? primaryColor : borderColor,
                          color: textColor
                        }}
                      >
                         <div className="w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all"
                              style={{ backgroundColor: modal.allUsersSelected ? primaryColor : 'transparent', borderColor: modal.allUsersSelected ? primaryColor : borderColor }}>
                            {modal.allUsersSelected ? <Check className="w-3.5 h-3.5" style={{ color: onPrimaryColor }} strokeWidth={3} /> : null}
                         </div>
                         <span>{t('assignCourse.selectAll', 'Seleccionar Todos')}</span>
                      </button>
                    )}
                  </div>

                  {/* Users Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {modal.loadingUsers ? (
                       <div className="col-span-full py-12 flex flex-col items-center justify-center opacity-30 gap-4">
                          <div className="w-10 h-10 border-4 rounded-full animate-spin" style={{ borderColor: `${onPrimaryColor}1A`, borderTopColor: primaryColor }} />
                          <span className="text-[10px] font-black uppercase tracking-widest">{t('assignCourse.loading.users', 'Cargando usuarios...')}</span>
                       </div>
                    ) : modal.availableUsers.length === 0 ? (
                      <div className="col-span-full py-12 text-center opacity-30">
                        <span className="text-[10px] font-black uppercase tracking-widest">{t('assignCourse.empty.noUsers', 'No se encontraron usuarios')}</span>
                      </div>
                    ) : (
                      modal.availableUsers.map((user, index) => {
                        const isAlreadyAssigned = modal.alreadyAssignedUserIds.has(user.id)
                        const isSelected = modal.selectedUserIds.has(user.id)
                        const displayName = getBusinessAssignCourseDisplayName(user)

                        return (
                          <motion.button
                            key={user.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.02 }}
                            onClick={() => !isAlreadyAssigned && modal.handleToggleUser(user.id)}
                            disabled={isAlreadyAssigned}
                            className={`group relative p-4 rounded-[1.8rem] text-left transition-all border flex items-center gap-4 ${isSelected ? 'scale-[1.02] shadow-xl' : 'hover:border-white/20'}`}
                            style={{ 
                              backgroundColor: isSelected ? `${primaryColor}15` : inputBg, 
                              borderColor: isSelected ? primaryColor : borderColor,
                              opacity: isAlreadyAssigned ? 0.4 : 1
                            }}
                          >
                            <div className="relative shrink-0">
                               {user.profile_picture_url ? (
                                 <div className="w-12 h-12 rounded-2xl overflow-hidden border border-white/5">
                                   <img src={user.profile_picture_url} alt={displayName} className="w-full h-full object-cover" />
                                 </div>
                              ) : (
                                 <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black" style={{ backgroundColor: primaryColor, color: onPrimaryColor }}>
                                   {displayName[0].toUpperCase()}
                                 </div>
                              )}
                              {isSelected && (
                                 <div className="absolute -top-1 -right-1 w-5 h-5 rounded-lg flex items-center justify-center shadow-lg" style={{ backgroundColor: primaryColor }}>
                                   <Check className="w-3 h-3" style={{ color: onPrimaryColor }} strokeWidth={4} />
                                 </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                               <h4 className="text-sm font-bold truncate" style={{ color: textColor }}>{displayName}</h4>
                               <p className="text-[10px] font-medium opacity-40 truncate">{user.email}</p>
                            </div>
                            {isAlreadyAssigned && (
                               <div className="absolute top-2 right-2">
                                  <XCircle className="w-4 h-4 opacity-50" />
                               </div>
                            )}
                          </motion.button>
                        )
                      })
                    )}
                  </div>
               </div>

               {/* Section 2: Configuration */}
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="space-y-6">
                    <label className="text-[10px] font-black uppercase tracking-widest px-1 block" style={{ color: mutedText }}>
                      Configuración de Asignación
                    </label>
                    <div className="relative group">
                       <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 opacity-30" style={{ color: textColor }} />
                       <input 
                          type="date"
                          value={getDateInputValue(modal.dueDate)}
                          onChange={(e) => {
                            if (!e.target.value) { modal.setDueDate(''); modal.setSuggestionReason(null); return; }
                            modal.setDueDate(toEndOfDayIso(e.target.value));
                            modal.setSuggestionReason(null);
                          }}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full pl-14 pr-6 py-4 rounded-2xl border bg-transparent focus:outline-none transition-all text-sm font-medium" 
                          style={{ backgroundColor: inputBg, borderColor, color: textColor }} 
                        />
                        {modal.dueDate && (
                          <button onClick={() => { modal.setDueDate(''); modal.setSuggestionReason(null); }} 
                                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all"
                                  style={{ color: mutedText }}
                                  onMouseEnter={(event) => {
                                    event.currentTarget.style.backgroundColor = panelTheme.hoverBg
                                  }}
                                  onMouseLeave={(event) => {
                                    event.currentTarget.style.backgroundColor = 'transparent'
                                  }}>
                             <X className="w-4 h-4" />
                          </button>
                        )}
                    </div>
                  </div>

                  <div className="space-y-6 flex flex-col justify-end">
                    <div className="flex items-center gap-3">
                       <motion.button 
                          type="button"
                          onClick={modal.handleSuggestLiaDate}
                          disabled={modal.isSuggesting}
                          className="px-6 py-4 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-3 shadow-sm"
                          style={{ backgroundColor: `${accentColor}10`, borderColor: `${accentColor}25`, color: accentColor }}
                          whileHover={{ scale: 1.02, backgroundColor: `${accentColor}20`, borderColor: `${accentColor}40` }}
                          whileTap={{ scale: 0.98 }}
                       >
                          {modal.isSuggesting ? (
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Sparkles className="w-4 h-4 animate-pulse" />
                          )}
                          <span>{t('assignCourse.buttons.suggestLia', 'Sugerir con SofLIA')}</span>
                       </motion.button>
                       {modal.suggestionReason && (
                         <div className="flex-1 text-[10px] font-bold italic opacity-40 px-2 leading-tight">
                           SofLIA: {modal.suggestionReason}
                         </div>
                       )}
                    </div>
                  </div>
               </div>
            </div>

            {/* Footer: Exact replica of AddUserModal */}
            <div className="shrink-0 p-5 px-8 flex items-center justify-between gap-4 border-t" style={{ backgroundColor: surfaceColor, borderColor }}>
               <div className="hidden sm:flex items-center gap-2 opacity-30 select-none">
                  <UserCheck className="w-5 h-5" style={{ color: textColor }} />
                  <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: textColor }}>Asignar Contenido</span>
               </div>
               <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button type="button" onClick={modal.handleClose} className="flex-1 sm:flex-none px-6 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all" style={{ color: mutedText, backgroundColor: inputBg, borderColor }}>{t('users.buttons.cancel')}</button>
                  <motion.button 
                    onClick={modal.handleAssign}
                    disabled={modal.isAssigning || modal.selectedUserCount === 0}
                    whileHover={{ scale: 1.02 }} 
                    whileTap={{ scale: 0.98 }} 
                    className="flex-[2] sm:flex-none px-10 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:grayscale" 
                    style={{ backgroundColor: primaryColor, color: onPrimaryColor }}
                  >
                     {modal.isAssigning ? (
                       <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: `${onPrimaryColor}4D`, borderTopColor: onPrimaryColor }} />
                     ) : (
                       <>
                         <span className="font-black">{t('assignCourse.buttons.confirmAssign', 'Confirmar Asignación')} ({modal.selectedUserCount})</span>
                         <ChevronRight className="w-4 h-4" strokeWidth={3} />
                       </>
                     )}
                  </motion.button>
               </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
