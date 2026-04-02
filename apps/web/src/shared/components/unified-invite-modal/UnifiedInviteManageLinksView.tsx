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

  return (
    <div className="flex flex-col overflow-hidden h-full">
      <div
        className="flex-1 overflow-y-auto p-6"
        style={{
          scrollbarColor: 'rgba(255,255,255,0.1) transparent',
          scrollbarWidth: 'thin',
        }}
      >
        {linksError && (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3"
            initial={{ opacity: 0, y: -10 }}
          >
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <span className="text-sm text-red-400 flex-1">{linksError}</span>
            <button
              className="text-red-400 hover:text-red-300"
              onClick={() => setLinksError(null)}
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {isLoadingLinks ? (
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div
                className="p-4 rounded-xl border animate-pulse"
                key={item}
                style={{
                  backgroundColor: theme.inputBg,
                  borderColor: theme.borderColor,
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gray-300 dark:bg-gray-700" />
                  <div className="flex-1">
                    <div className="h-4 w-32 bg-gray-300 dark:bg-gray-700 rounded mb-2" />
                    <div className="h-3 w-48 bg-gray-300 dark:bg-gray-700 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : links.length === 0 ? (
          <div className="text-center py-12">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: theme.inputBg }}
            >
              <Link2 className="w-8 h-8" style={{ color: theme.mutedText }} />
            </div>
            <h4 className="text-lg font-semibold mb-2" style={{ color: theme.textColor }}>
              {t('users.modals.manageLinks.empty.title', 'No hay enlaces')}
            </h4>
            <p className="mb-6" style={{ color: theme.mutedText }}>
              {t(
                'users.modals.manageLinks.empty.subtitle',
                'Crea tu primer enlace de invitacion'
              )}
            </p>
            <motion.button
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-white inline-flex items-center gap-2"
              onClick={() => setMode('bulk')}
              style={{
                backgroundColor: theme.primaryColor,
                boxShadow: `0 4px 15px ${theme.primaryColor}40`,
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className="w-4 h-4" />
              {t('users.buttons.createLink', 'Crear Enlace')}
            </motion.button>
          </div>
        ) : (
          <div className="space-y-3">
            {links.map((link) => {
              const statusConfig = getStatusConfig(link.status);
              const StatusIcon = statusConfig.icon;
              const isExpiredOrExhausted =
                link.status === 'expired' || link.status === 'exhausted';

              return (
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl border transition-colors"
                  initial={{ opacity: 0, y: 10 }}
                  key={link.id}
                  style={{
                    backgroundColor: theme.inputBg,
                    borderColor: theme.borderColor,
                    opacity: isExpiredOrExhausted ? 0.7 : 1,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="p-2 rounded-lg shrink-0"
                      style={{ backgroundColor: statusConfig.bgColor }}
                    >
                      <Link2 className="w-4 h-4" style={{ color: statusConfig.color }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4
                          className="font-medium truncate text-sm"
                          style={{ color: theme.textColor }}
                        >
                          {link.name ||
                            t('users.modals.manageLinks.unnamed', 'Sin nombre')}
                        </h4>
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-1"
                          style={{
                            backgroundColor: statusConfig.bgColor,
                            color: statusConfig.color,
                          }}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <p
                          className="text-xs font-mono truncate flex-1"
                          style={{ color: theme.mutedText }}
                        >
                          {getInviteUrl(link.token)}
                        </p>
                        <button
                          className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors shrink-0"
                          onClick={() => {
                            void handleCopyLink(link);
                          }}
                        >
                          {copiedId === link.id ? (
                            <Check
                              className="w-3.5 h-3.5"
                              style={{ color: theme.accentColor }}
                            />
                          ) : (
                            <Copy
                              className="w-3.5 h-3.5"
                              style={{ color: theme.mutedText }}
                            />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1">
                          <Users
                            className="w-3 h-3"
                            style={{ color: theme.mutedText }}
                          />
                          <span style={{ color: theme.mutedText }}>
                            {link.current_uses}/{link.max_uses}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Shield
                            className="w-3 h-3"
                            style={{ color: theme.mutedText }}
                          />
                          <span style={{ color: theme.mutedText }}>
                            {roleLabels[link.role as keyof typeof roleLabels]?.label ||
                              link.role}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar
                            className="w-3 h-3"
                            style={{ color: theme.mutedText }}
                          />
                          <span style={{ color: theme.mutedText }}>
                            {new Date(link.expires_at).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: 'short',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="relative shrink-0">
                      <button
                        className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
                        disabled={actionLoading === link.id}
                        onClick={() =>
                          setOpenMenuId(openMenuId === link.id ? null : link.id)
                        }
                      >
                        {actionLoading === link.id ? (
                          <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                        ) : (
                          <MoreVertical
                            className="w-4 h-4"
                            style={{ color: theme.mutedText }}
                          />
                        )}
                      </button>

                      <AnimatePresence>
                        {openMenuId === link.id && (
                          <motion.div
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            className="absolute right-0 top-full mt-1 w-36 rounded-xl border shadow-lg overflow-hidden"
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            style={{
                              backgroundColor: theme.menuBg,
                              borderColor: theme.borderColor,
                              zIndex: 10,
                            }}
                          >
                            {link.status === 'active' && (
                              <button
                                className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                onClick={() => {
                                  void handleLinkAction(link.id, 'pause');
                                }}
                                style={{ color: theme.textColor }}
                              >
                                <Pause className="w-4 h-4" style={{ color: '#F59E0B' }} />
                                {t('users.modals.manageLinks.actions.pause', 'Pausar')}
                              </button>
                            )}
                            {link.status === 'paused' && (
                              <button
                                className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                onClick={() => {
                                  void handleLinkAction(link.id, 'resume');
                                }}
                                style={{ color: theme.textColor }}
                              >
                                <Play className="w-4 h-4" style={{ color: '#22C55E' }} />
                                {t('users.modals.manageLinks.actions.resume', 'Reanudar')}
                              </button>
                            )}
                            <button
                              className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-red-500/10 transition-colors text-red-500"
                              onClick={() => {
                                void handleLinkAction(link.id, 'delete');
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                              {t('users.modals.manageLinks.actions.delete', 'Eliminar')}
                            </button>
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

      <div
        className="p-6 border-t flex items-center justify-between shrink-0"
        style={{ borderColor: theme.borderColor }}
      >
        <div className="flex items-center gap-2">
          <button
            className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
            disabled={isLoadingLinks}
            onClick={() => {
              void fetchLinks();
            }}
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoadingLinks ? 'animate-spin' : ''}`}
              style={{ color: theme.mutedText }}
            />
          </button>
          <span className="text-sm" style={{ color: theme.mutedText }}>
            {links.length} {links.length === 1 ? 'enlace' : 'enlaces'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="px-4 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            onClick={onClose}
            style={{ color: theme.mutedText }}
          >
            {t('users.buttons.close', 'Cerrar')}
          </button>
          <motion.button
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-white flex items-center gap-2"
            onClick={() => setMode('bulk')}
            style={{
              backgroundColor: theme.primaryColor,
              boxShadow: `0 4px 15px ${theme.primaryColor}40`,
              color: '#FFFFFF',
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-4 h-4" />
            {t('users.buttons.newLink', 'Nuevo')}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
