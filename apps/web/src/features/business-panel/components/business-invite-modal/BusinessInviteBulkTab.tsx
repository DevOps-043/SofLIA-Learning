'use client';

import type { Dispatch, FormEventHandler, SetStateAction } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Calendar, Check, CheckCircle, ChevronRight, Copy, Link2, Shield, Sparkles, Users } from 'lucide-react';
import type {
  BusinessInviteBulkForm,
  BusinessInviteRole,
  CreatedLink,
} from '../../services/business-invite-modal.service';
import { BusinessInviteRoleCards } from './BusinessInviteRoleCards';

interface BusinessInviteBulkTabProps {
  form: BusinessInviteBulkForm;
  setForm: Dispatch<SetStateAction<BusinessInviteBulkForm>>;
  status: 'idle' | 'loading' | 'success' | 'error';
  error: string | null;
  createdLink: CreatedLink | null;
  copied: boolean;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onCopyLink: (token: string) => Promise<void>;
  onCreateAnother: () => void;
  onGoToManage: () => void;
  getInviteUrl: (token: string) => string;
  textColor: string;
  mutedText: string;
  borderColor: string;
  inputBg: string;
  primaryColor: string;
  accentColor: string;
  isDark: boolean;
  roleLabels: Record<BusinessInviteRole, { label: string; desc: string }>;
}

export function BusinessInviteBulkTab({
  form,
  setForm,
  status,
  error,
  createdLink,
  copied,
  onSubmit,
  onCopyLink,
  onCreateAnother,
  onGoToManage,
  getInviteUrl,
  textColor,
  mutedText,
  borderColor,
  inputBg,
  primaryColor,
  accentColor,
  isDark,
  roleLabels,
}: BusinessInviteBulkTabProps) {
  if (status === 'success' && createdLink) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: `${accentColor}20` }}
          >
            <CheckCircle className="w-10 h-10" style={{ color: accentColor }} />
          </motion.div>
          <h4 className="text-xl font-bold mb-2" style={{ color: textColor }}>
            Enlace creado
          </h4>
          <p style={{ color: mutedText }}>Comparte este enlace con las personas que deseas invitar</p>
        </div>

        <div className="p-4 rounded-xl border" style={{ backgroundColor: inputBg, borderColor }}>
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium mb-1" style={{ color: mutedText }}>
                Enlace de invitacion
              </p>
              <p className="text-sm font-mono truncate" style={{ color: textColor }}>
                {getInviteUrl(createdLink.token)}
              </p>
            </div>
            <button
              onClick={() => void onCopyLink(createdLink.token)}
              className="p-2 rounded-lg transition-colors flex-shrink-0"
              style={{ backgroundColor: copied ? `${accentColor}20` : inputBg, color: copied ? accentColor : textColor }}
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-xl text-center" style={{ backgroundColor: inputBg }}>
            <Users className="w-5 h-5 mx-auto mb-1" style={{ color: accentColor }} />
            <p className="text-lg font-bold" style={{ color: textColor }}>
              {createdLink.max_uses}
            </p>
            <p className="text-xs" style={{ color: mutedText }}>
              Max. usuarios
            </p>
          </div>
          <div className="p-3 rounded-xl text-center" style={{ backgroundColor: inputBg }}>
            <Shield className="w-5 h-5 mx-auto mb-1" style={{ color: accentColor }} />
            <p className="text-lg font-bold capitalize" style={{ color: textColor }}>
              {roleLabels[createdLink.role as BusinessInviteRole]?.label || createdLink.role}
            </p>
            <p className="text-xs" style={{ color: mutedText }}>
              Rol
            </p>
          </div>
          <div className="p-3 rounded-xl text-center" style={{ backgroundColor: inputBg }}>
            <Calendar className="w-5 h-5 mx-auto mb-1" style={{ color: accentColor }} />
            <p className="text-lg font-bold" style={{ color: textColor }}>
              {new Date(createdLink.expires_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
            </p>
            <p className="text-xs" style={{ color: mutedText }}>
              Expira
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor }}>
          <button
            onClick={onCreateAnother}
            className="px-4 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            style={{ color: mutedText }}
          >
            Crear otro enlace
          </button>
          <button
            onClick={onGoToManage}
            className="px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            style={{ color: textColor }}
          >
            Ver todos los enlaces
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="p-6 space-y-5">
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <span className="text-sm text-red-400 flex-1">{error}</span>
        </motion.div>
      )}

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: mutedText }}>
          Nombre del enlace <span style={{ color: mutedText }}>(Opcional)</span>
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          disabled={status === 'loading'}
          className="w-full px-4 py-3 rounded-xl border focus:outline-none transition-colors disabled:opacity-50"
          style={{ backgroundColor: inputBg, borderColor, color: textColor }}
          placeholder="Ej: Invitacion Equipo de Ventas"
          maxLength={100}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: mutedText }}>
          Numero maximo de registros <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: mutedText }} />
          <input
            type="number"
            value={form.maxUses}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, maxUses: Number.parseInt(event.target.value, 10) || 0 }))
            }
            required
            min={1}
            max={10000}
            disabled={status === 'loading'}
            className="w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none transition-colors disabled:opacity-50"
            style={{ backgroundColor: inputBg, borderColor, color: textColor }}
          />
        </div>
        <p className="text-xs mt-1" style={{ color: mutedText }}>
          Maximo de usuarios que pueden registrarse con este enlace (1-10,000)
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: mutedText }}>
          Rol asignado <span className="text-red-400">*</span>
        </label>
        <BusinessInviteRoleCards
          currentRole={form.role}
          disabled={status === 'loading'}
          isDark={isDark}
          inputBg={inputBg}
          borderColor={borderColor}
          primaryColor={primaryColor}
          mutedText={mutedText}
          textColor={textColor}
          roleLabels={roleLabels}
          onSelect={(role) => setForm((prev) => ({ ...prev, role }))}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: mutedText }}>
          Fecha de expiracion <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: mutedText }} />
          <input
            type="datetime-local"
            value={form.expiresAt}
            onChange={(event) => setForm((prev) => ({ ...prev, expiresAt: event.target.value }))}
            required
            disabled={status === 'loading'}
            className="w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none transition-colors disabled:opacity-50"
            style={{ backgroundColor: inputBg, borderColor, color: textColor }}
            min={new Date().toISOString().slice(0, 16)}
          />
        </div>
      </div>

      <div className="p-4 rounded-xl border" style={{ backgroundColor: inputBg, borderColor }}>
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 flex-shrink-0" style={{ color: accentColor }} />
          <p className="text-sm" style={{ color: mutedText }}>
            El enlace permitira que cualquier persona se registre en tu organizacion con el rol especificado. Puedes pausar o eliminar el enlace en cualquier momento.
          </p>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <motion.button
          type="submit"
          whileHover={{ scale: status === 'loading' ? 1 : 1.02 }}
          whileTap={{ scale: status === 'loading' ? 1 : 0.98 }}
          disabled={status === 'loading'}
          className="px-5 py-2.5 rounded-xl text-sm font-medium text-white flex items-center gap-2 disabled:opacity-70"
          style={{ backgroundColor: primaryColor, boxShadow: `0 4px 15px ${primaryColor}40` }}
        >
          {status === 'loading' ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Creando...</span>
            </>
          ) : (
            <>
              <Link2 className="w-4 h-4" />
              <span>Crear Enlace</span>
            </>
          )}
        </motion.button>
      </div>
    </form>
  );
}
