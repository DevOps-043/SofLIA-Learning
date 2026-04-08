'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  Calendar,
  Check,
  Copy,
  Link2,
  MoreVertical,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Shield,
  Trash2,
  Users,
  X,
  ChevronRight,
} from 'lucide-react';
import type {
  UnifiedInviteModalController,
  UnifiedInviteTheme,
} from './types';

interface UnifiedInviteManageLinksViewProps {
  controller: UnifiedInviteModalController;
  onClose: () => void;
  theme: UnifiedInviteTheme;
}

export function UnifiedInviteManageLinksView({
  controller,
  onClose,
  theme,
}: UnifiedInviteManageLinksViewProps) {
  const {
    actionLoading,
    copiedId,
    fetchLinks,
    getInviteUrl,
    getStatusConfig,
    handleCopyLink,
    handleLinkAction,
    isLoadingLinks,
    links,
    linksError,
    openMenuId,
    roleLabels,
    setLinksError,
    setMode,
    setOpenMenuId,
    t,
  } = controller;

  const footerBg = theme.isDark ? '#0b0e14' : '#FFFFFF';

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div
        className="flex-1 overflow-y-auto pt-4 sm:pt-6 pb-24 sm:pb-32 px-6 lg:px-12 space-y-4"
        style={{
          scrollbarColor: 'rgba(255,255,255,0.05) transparent',
          scrollbarWidth: 'thin',
        }}
      >
        {linksError && (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-3"
            initial={{ opacity: 0, y: -10 }}
          >
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <span className="text-[10px] font-black uppercase text-red-400 flex-1">{linksError}</span>
            <button
              className="text-red-400 hover:text-red-300 p-1"
              onClick={() => setLinksError(null)}
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {isLoadingLinks ? (
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div
                className="h-24 rounded-[1.8rem] border animate-pulse opacity-20"
                key={item}
                style={{
                  backgroundColor: theme.inputBg,
                  borderColor: theme.borderColor,
                }}
              />
            ))}
          </div>
        ) : links.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div
              className="w-20 h-20 rounded-[2.5rem] flex items-center justify-center mb-6 shadow-2xl border"
              style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor }}
            >
              <Link2 className="w-10 h-10 opacity-20" style={{ color: theme.textColor }} strokeWidth={2.5} />
            </div>
            <h4 className="text-xl font-black uppercase tracking-tight mb-2" style={{ color: theme.textColor }}>
              {t('users.modals.manageLinks.empty.title', 'Sin enlaces activos')}
            </h4>
            <p className="text-[11px] font-black uppercase tracking-widest opacity-40 mb-8" style={{ color: theme.mutedText }}>
              {t('users.modals.manageLinks.empty.subtitle', 'Crea tu primer enlace para registros masivos')}
            </p>
            <motion.button
              className="px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 shadow-2xl"
              onClick={() => setMode('bulk')}
              style={{
                backgroundColor: theme.primaryColor,
                color: theme.isDark ? '#000000' : '#FFFFFF',
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus className="w-4 h-4" color={theme.isDark ? '#000000' : '#FFFFFF'} strokeWidth={3} />
              {t('users.buttons.createLink', 'Crear enlace ahora')}
            </motion.button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {links.map((link) => {
              const statusConfig = getStatusConfig(link.status);
              const isExpired = link.status === 'expired' || link.status === 'exhausted';

              return (
                <motion.div
                  animate={{ opacity: 1, scale: 1 }}
                  className="group relative p-5 rounded-[2rem] border transition-all hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.3)] bg-transparent"
                  initial={{ opacity: 0, scale: 0.98 }}
                  key={link.id}
                  style={{
                    backgroundColor: theme.inputBg,
                    borderColor: theme.borderColor,
                  }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Icon & Details */}
                    <div className="flex-1 flex items-start gap-5">
                       <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg border" style={{ backgroundColor: theme.menuBg, borderColor: theme.borderColor }}>
                          <Link2 className="w-6 h-6" style={{ color: statusConfig.color }} strokeWidth={2.5} />
                       </div>
                       
                       <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                             <h4 className="text-sm font-black uppercase tracking-tight truncate max-w-[150px] sm:max-w-none" style={{ color: theme.textColor }}>
                                {link.name || t('users.modals.manageLinks.unnamed', 'Enlace sin nombre')}
                             </h4>
                             <span className="px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest shadow-sm border" style={{ backgroundColor: `${statusConfig.color}15`, color: statusConfig.color, borderColor: `${statusConfig.color}20` }}>
                                {statusConfig.label}
                             </span>
                          </div>
                          
                          <div className="flex items-center gap-2 py-1 px-3 rounded-xl bg-black/10 border border-white/5 mb-3 hidden sm:flex">
                             <p className="text-[10px] font-mono opacity-40 truncate flex-1" style={{ color: theme.textColor }}>
                                {getInviteUrl(link.token)}
                             </p>
                             <button
                                className="p-2 rounded-lg hover:bg-white/5 transition-all text-white/50 hover:text-white"
                                onClick={() => void handleCopyLink(link)}
                             >
                                {copiedId === link.id ? (
                                  <Check className="w-3.5 h-3.5 text-green-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                             </button>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-4">
                             <div className="flex items-center gap-2 opacity-40">
                                <Users className="w-3.5 h-3.5" style={{ color: theme.textColor }} />
                                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: theme.textColor }}>{link.current_uses} / {link.max_uses}</span>
                             </div>
                             <div className="flex items-center gap-2 opacity-40">
                                <Shield className="w-3.5 h-3.5" style={{ color: theme.textColor }} />
                                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: theme.textColor }}>{roleLabels[link.role as keyof typeof roleLabels]?.label || link.role}</span>
                             </div>
                              <div className="flex items-center gap-2 opacity-40">
                                <Calendar className="w-3.5 h-3.5" style={{ color: theme.textColor }} />
                                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: theme.textColor }}>{new Date(link.expires_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</span>
                             </div>
                          </div>
                       </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 border-t sm:border-t-0 sm:border-l pt-4 sm:pt-0 sm:pl-6" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                       <button
                          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all border bg-black/5 hover:bg-black/20"
                          style={{ borderColor: theme.borderColor }}
                          onClick={() => setOpenMenuId(openMenuId === link.id ? null : link.id)}
                       >
                          {actionLoading === link.id ? (
                             <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          ) : (
                             <MoreVertical className="w-4 h-4 opacity-40" style={{ color: theme.textColor }} />
                          )}
                       </button>
                       
                       <button 
                          className="p-1 px-3 py-3 rounded-2xl bg-white/5 border border-white/10 sm:hidden"
                          onClick={() => void handleCopyLink(link)}
                       >
                           {copiedId === link.id ? (
                             <span className="text-[9px] font-black uppercase text-green-400">Copiado</span>
                           ) : (
                             <span className="text-[9px] font-black uppercase tracking-widest opacity-40" style={{ color: theme.textColor }}>Copiar Enlace</span>
                           )}
                       </button>

                       <AnimatePresence>
                         {openMenuId === link.id && (
                           <motion.div
                             animate={{ opacity: 1, scale: 1, y: 0 }}
                             className="absolute right-0 top-full mt-2 w-48 rounded-[1.8rem] border shadow-3xl overflow-hidden z-[100]"
                             exit={{ opacity: 0, scale: 0.95, y: -10 }}
                             initial={{ opacity: 0, scale: 0.95, y: -10 }}
                             style={{
                               backgroundColor: theme.menuBg,
                               borderColor: theme.borderColor,
                             }}
                           >
                              <div className="p-2 space-y-1">
                                {link.status === 'active' && (
                                  <button
                                    className="w-full px-4 py-3 text-left rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-white/5 transition-colors"
                                    onClick={() => void handleLinkAction(link.id, 'pause')}
                                    style={{ color: theme.textColor }}
                                  >
                                    <Pause className="w-4 h-4 text-amber-500" />
                                    {t('users.modals.manageLinks.actions.pause', 'Pausar enlace')}
                                  </button>
                                )}
                                {link.status === 'paused' && (
                                  <button
                                    className="w-full px-4 py-3 text-left rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-white/5 transition-colors"
                                    onClick={() => void handleLinkAction(link.id, 'resume')}
                                    style={{ color: theme.textColor }}
                                  >
                                    <Play className="w-4 h-4 text-green-500" />
                                    {t('users.modals.manageLinks.actions.resume', 'Reanudar enlace')}
                                  </button>
                                )}
                                <button
                                  className="w-full px-4 py-3 text-left rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-red-500/10 transition-colors text-red-500"
                                  onClick={() => void handleLinkAction(link.id, 'delete')}
                                >
                                  <Trash2 className="w-4 h-4" />
                                  {t('users.modals.manageLinks.actions.delete', 'Eliminar enlace')}
                                </button>
                              </div>
                           </motion.div>
                         )}
                       </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer - SOLID & Sticky */}
      <div 
         className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 lg:px-12 flex items-center justify-between gap-4 border-t"
         style={{ backgroundColor: footerBg, borderColor: theme.borderColor }}
      >
        <div className="flex items-center gap-3 opacity-40">
           <button
             className="w-10 h-10 rounded-xl flex items-center justify-center bg-black/10 border border-white/5 hover:bg-black/20 transition-all"
             disabled={isLoadingLinks}
             onClick={() => void fetchLinks()}
           >
             <RefreshCw className={`w-4 h-4 ${isLoadingLinks ? 'animate-spin' : ''}`} style={{ color: theme.textColor }} />
           </button>
           <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: theme.textColor }}>
             {links.length} {links.length === 1 ? 'Enlace' : 'Enlaces'}
           </span>
        </div>

        <div className="flex items-center gap-3">
           <button
             className="px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border"
             onClick={onClose}
             style={{ color: theme.mutedText, backgroundColor: theme.inputBg, borderColor: theme.borderColor }}
           >
             {t('users.buttons.close', 'Cerrar')}
           </button>
           <motion.button
             className="px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl"
             onClick={() => setMode('bulk')}
             style={{ backgroundColor: theme.primaryColor, color: theme.isDark ? '#000000' : '#FFFFFF' }}
             whileHover={{ scale: 1.02 }}
             whileTap={{ scale: 0.98 }}
           >
             <Plus className="w-4 h-4" color={theme.isDark ? '#000000' : '#FFFFFF'} strokeWidth={3} />
             <span>{t('users.buttons.newLink', 'Nuevo Enlace')}</span>
             <ChevronRight className="w-4 h-4" />
           </motion.button>
        </div>
      </div>
    </div>
  );
}
