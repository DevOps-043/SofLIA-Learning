'use client';

import type { Dispatch, FormEventHandler, SetStateAction } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Briefcase, CheckCircle, Mail, MessageSquare, Send, Sparkles } from 'lucide-react';
import type { BusinessInviteIndividualForm, BusinessInviteRole } from '../../services/business-invite-modal.service';
import { BusinessInviteRoleCards } from './BusinessInviteRoleCards';

interface BusinessInviteIndividualTabProps {
  form: BusinessInviteIndividualForm;
  setForm: Dispatch<SetStateAction<BusinessInviteIndividualForm>>;
  status: 'idle' | 'loading' | 'success' | 'error';
  error: string | null;
  success: string | null;
  onSubmit: FormEventHandler<HTMLFormElement>;
  isDark: boolean;
  textColor: string;
  mutedText: string;
  borderColor: string;
  inputBg: string;
  primaryColor: string;
  accentColor: string;
  roleLabels: Record<BusinessInviteRole, { label: string; desc: string }>;
}

export function BusinessInviteIndividualTab({
  form,
  setForm,
  status,
  error,
  success,
  onSubmit,
  isDark,
  textColor,
  mutedText,
  borderColor,
  inputBg,
  primaryColor,
  accentColor,
  roleLabels,
}: BusinessInviteIndividualTabProps) {
  if (status === 'success') {
    return (
      <div className="p-8 flex flex-col items-center justify-center text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
          className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
          style={{ backgroundColor: `${accentColor}20` }}
        >
          <CheckCircle className="w-10 h-10" style={{ color: accentColor }} />
        </motion.div>
        <h4 className="text-xl font-bold mb-2" style={{ color: textColor }}>
          Invitacion enviada
        </h4>
        <p style={{ color: mutedText }}>{success}</p>
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
          Correo electronico <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: mutedText }} />
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            required
            disabled={status === 'loading'}
            className="w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none transition-colors disabled:opacity-50"
            style={{ backgroundColor: inputBg, borderColor, color: textColor }}
            placeholder="usuario@empresa.com"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: mutedText }}>
          Rol en la organizacion <span className="text-red-400">*</span>
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
          Cargo / Posicion <span style={{ color: mutedText }}>(Opcional)</span>
        </label>
        <div className="relative">
          <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: mutedText }} />
          <input
            type="text"
            value={form.position}
            onChange={(event) => setForm((prev) => ({ ...prev, position: event.target.value }))}
            disabled={status === 'loading'}
            className="w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none transition-colors disabled:opacity-50"
            style={{ backgroundColor: inputBg, borderColor, color: textColor }}
            placeholder="Ej: Gerente de Ventas"
            maxLength={100}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: mutedText }}>
          Mensaje personalizado <span style={{ color: mutedText }}>(Opcional)</span>
        </label>
        <div className="relative">
          <MessageSquare className="absolute left-3 top-3 w-4 h-4" style={{ color: mutedText }} />
          <textarea
            value={form.customMessage}
            onChange={(event) => setForm((prev) => ({ ...prev, customMessage: event.target.value }))}
            disabled={status === 'loading'}
            rows={3}
            className="w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none transition-colors resize-none disabled:opacity-50"
            style={{ backgroundColor: inputBg, borderColor, color: textColor }}
            placeholder="Agrega un mensaje personalizado..."
            maxLength={500}
          />
        </div>
        <p className="text-xs mt-1 text-right" style={{ color: mutedText }}>
          {form.customMessage.length}/500
        </p>
      </div>

      <div className="p-4 rounded-xl border" style={{ backgroundColor: inputBg, borderColor }}>
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 flex-shrink-0" style={{ color: accentColor }} />
          <p className="text-sm" style={{ color: mutedText }}>
            El usuario recibira un correo con un enlace para completar su registro. La invitacion expira en 7 dias.
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
              <span>Enviando...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Enviar Invitacion</span>
            </>
          )}
        </motion.button>
      </div>
    </form>
  );
}
