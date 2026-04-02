'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Calendar, Check, CheckCircle, Clock, Copy, ExternalLink, Link2, MoreVertical, Pause, Play, Plus, RefreshCw, Shield, Trash2, Users, X, XCircle } from 'lucide-react';
import type { BulkInviteLink, BusinessInviteRole, BusinessInviteStatusConfig } from '../../services/business-invite-modal.service';

const STATUS_ICONS = {
  'check-circle': CheckCircle,
  pause: Pause,
  clock: Clock,
  'x-circle': XCircle,
  'alert-circle': AlertCircle,
};

interface BusinessInviteManageTabProps {
  links: BulkInviteLink[];
  linksLoading: boolean;
  linksError: string | null;
  copiedId: string | null;
  actionLoading: string | null;
  openMenuId: string | null;
  textColor: string;
  mutedText: string;
  borderColor: string;
  inputBg: string;
  isDark: boolean;
  accentColor: string;
  roleLabels: Record<BusinessInviteRole, { label: string; desc: string }>;
  getInviteUrl: (token: string) => string;
  getStatusConfig: (status: string) => BusinessInviteStatusConfig;
  onDismissError: () => void;
  onRefresh: () => Promise<void>;
  onCopyLink: (token: string, linkId?: string) => Promise<void>;
  onAction: (linkId: string, action: 'pause' | 'resume' | 'delete') => Promise<void>;
  onCreateLink: () => void;
  onToggleMenu: (linkId: string | null) => void;
}

export function BusinessInviteManageTab({
  links,
  linksLoading,
  linksError,
  copiedId,
  actionLoading,
  openMenuId,
  textColor,
  mutedText,
  borderColor,
  inputBg,
  isDark,
  accentColor,
  roleLabels,
  getInviteUrl,
  getStatusConfig,
  onDismissError,
  onRefresh,
  onCopyLink,
  onAction,
  onCreateLink,
  onToggleMenu,
}: BusinessInviteManageTabProps) {
  return (
    <div className="p-6">
      {linksError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <span className="text-sm text-red-400 flex-1">{linksError}</span>
          <button onClick={onDismissError} className="text-red-400 hover:text-red-300">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm" style={{ color: mutedText }}>
          {links.length} {links.length === 1 ? 'enlace' : 'enlaces'} creados
        </p>
        <button
          onClick={() => void onRefresh()}
          disabled={linksLoading}
          className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
          title="Actualizar"
        >
          <RefreshCw className={`w-4 h-4 ${linksLoading ? 'animate-spin' : ''}`} style={{ color: mutedText }} />
        </button>
      </div>

      {linksLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="p-4 rounded-xl border animate-pulse" style={{ backgroundColor: inputBg, borderColor }}>
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
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: inputBg }}>
            <Link2 className="w-8 h-8" style={{ color: mutedText }} />
          </div>
          <h4 className="text-lg font-semibold mb-2" style={{ color: textColor }}>
            No hay enlaces
          </h4>
          <p className="mb-6" style={{ color: mutedText }}>
            Crea tu primer enlace de invitacion masiva
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onCreateLink}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-white inline-flex items-center gap-2"
            style={{ backgroundColor: textColor, boxShadow: `0 4px 15px ${textColor}20` }}
          >
            <Plus className="w-4 h-4" />
            Crear Enlace
          </motion.button>
        </div>
      ) : (
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
          {links.map((link) => {
            const statusConfig = getStatusConfig(link.status);
            const StatusIcon = STATUS_ICONS[statusConfig.icon];
            const isExpiredOrExhausted = link.status === 'expired' || link.status === 'exhausted';

            return (
              <div
                key={link.id}
                className="p-4 rounded-xl border transition-colors"
                style={{ backgroundColor: inputBg, borderColor, opacity: isExpiredOrExhausted ? 0.7 : 1 }}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg shrink-0" style={{ backgroundColor: statusConfig.bgColor }}>
                    <Link2 className="w-4 h-4" style={{ color: statusConfig.color }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium truncate text-sm" style={{ color: textColor }}>
                        {link.name || 'Sin nombre'}
                      </h4>
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-1"
                        style={{ backgroundColor: statusConfig.bgColor, color: statusConfig.color }}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-xs font-mono truncate flex-1" style={{ color: mutedText }}>
                        {getInviteUrl(link.token)}
                      </p>
                      <button
                        onClick={() => void onCopyLink(link.token, link.id)}
                        className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors shrink-0"
                      >
                        {copiedId === link.id ? (
                          <Check className="w-3.5 h-3.5" style={{ color: accentColor }} />
                        ) : (
                          <Copy className="w-3.5 h-3.5" style={{ color: mutedText }} />
                        )}
                      </button>
                      <a
                        href={getInviteUrl(link.token)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors shrink-0"
                      >
                        <ExternalLink className="w-3.5 h-3.5" style={{ color: mutedText }} />
                      </a>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1" style={{ color: mutedText }}>
                        <Users className="w-3 h-3" />
                        {link.current_uses}/{link.max_uses}
                      </span>
                      <span className="flex items-center gap-1" style={{ color: mutedText }}>
                        <Shield className="w-3 h-3" />
                        {roleLabels[link.role as BusinessInviteRole]?.label || link.role}
                      </span>
                      <span className="flex items-center gap-1" style={{ color: mutedText }}>
                        <Calendar className="w-3 h-3" />
                        {new Date(link.expires_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                  </div>

                  <div className="relative shrink-0">
                    <button
                      onClick={() => onToggleMenu(openMenuId === link.id ? null : link.id)}
                      disabled={actionLoading === link.id}
                      className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
                    >
                      {actionLoading === link.id ? (
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                      ) : (
                        <MoreVertical className="w-4 h-4" style={{ color: mutedText }} />
                      )}
                    </button>

                    <AnimatePresence>
                      {openMenuId === link.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          className="absolute right-0 top-full mt-1 w-36 rounded-xl border shadow-lg overflow-hidden"
                          style={{ backgroundColor: isDark ? '#252b3b' : '#FFFFFF', borderColor, zIndex: 10 }}
                        >
                          {link.status === 'active' && (
                            <button
                              onClick={() => void onAction(link.id, 'pause')}
                              className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                              style={{ color: textColor }}
                            >
                              <Pause className="w-4 h-4" style={{ color: '#F59E0B' }} />
                              Pausar
                            </button>
                          )}
                          {link.status === 'paused' && (
                            <button
                              onClick={() => void onAction(link.id, 'resume')}
                              className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                              style={{ color: textColor }}
                            >
                              <Play className="w-4 h-4" style={{ color: '#22C55E' }} />
                              Reanudar
                            </button>
                          )}
                          <button
                            onClick={() => void onAction(link.id, 'delete')}
                            className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-red-500/10 transition-colors text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                            Eliminar
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
