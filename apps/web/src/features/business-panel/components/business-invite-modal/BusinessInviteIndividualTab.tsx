'use client'

import type { Dispatch, FormEventHandler, SetStateAction } from 'react'
import { motion } from 'framer-motion'
import {
  AlertCircle,
  Briefcase,
  CheckCircle,
  Loader2,
  Mail,
  MessageSquare,
  Send,
  Sparkles,
} from 'lucide-react'
import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'
import type {
  BusinessInviteIndividualForm,
  BusinessInviteRole,
} from '../../services/business-invite-modal.service'
import { BusinessInviteRoleCards } from './BusinessInviteRoleCards'

interface BusinessInviteIndividualTabProps {
  form: BusinessInviteIndividualForm
  setForm: Dispatch<SetStateAction<BusinessInviteIndividualForm>>
  status: 'idle' | 'loading' | 'success' | 'error'
  error: string | null
  success: string | null
  onSubmit: FormEventHandler<HTMLFormElement>
  roleLabels: Record<BusinessInviteRole, { label: string; desc: string }>
}

export function BusinessInviteIndividualTab({
  form,
  setForm,
  status,
  error,
  success,
  onSubmit,
  roleLabels,
}: BusinessInviteIndividualTabProps) {
  const theme = useBusinessPanelTheme()
  const successSurface = theme.isDark ? 'rgba(16, 185, 129, 0.16)' : 'rgba(16, 185, 129, 0.1)'
  const dangerSurface = theme.isDark ? 'rgba(239, 68, 68, 0.16)' : 'rgba(239, 68, 68, 0.1)'
  const primarySurface = theme.isDark ? 'rgba(0, 212, 179, 0.14)' : 'rgba(10, 37, 64, 0.08)'

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
          className="mb-4 flex h-20 w-20 items-center justify-center rounded-full"
          style={{ backgroundColor: successSurface }}
        >
          <CheckCircle className="h-10 w-10" style={{ color: theme.successColor }} />
        </motion.div>
        <h4 className="mb-2 text-xl font-bold" style={{ color: theme.textColor }}>
          Invitacion enviada
        </h4>
        <p style={{ color: theme.subtextColor }}>{success}</p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 p-6">
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-xl border p-4"
          style={{
            backgroundColor: dangerSurface,
            borderColor: theme.dangerColor,
          }}
        >
          <AlertCircle className="h-5 w-5 flex-shrink-0" style={{ color: theme.dangerColor }} />
          <span className="flex-1 text-sm" style={{ color: theme.dangerColor }}>
            {error}
          </span>
        </motion.div>
      )}

      <div>
        <label className="mb-2 block text-sm font-medium" style={{ color: theme.subtextColor }}>
          Correo electronico <span style={{ color: theme.dangerColor }}>*</span>
        </label>
        <div className="relative">
          <Mail
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
            style={{ color: theme.subtextColor }}
          />
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            required
            disabled={status === 'loading'}
            className="w-full rounded-xl border py-3 pl-10 pr-4 transition-colors focus:outline-none disabled:opacity-50"
            style={{
              backgroundColor: theme.inputBg,
              borderColor: theme.borderColor,
              color: theme.textColor,
            }}
            placeholder="usuario@empresa.com"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium" style={{ color: theme.subtextColor }}>
          Rol en la organizacion <span style={{ color: theme.dangerColor }}>*</span>
        </label>
        <BusinessInviteRoleCards
          currentRole={form.role}
          disabled={status === 'loading'}
          roleLabels={roleLabels}
          onSelect={(role) => setForm((prev) => ({ ...prev, role }))}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium" style={{ color: theme.subtextColor }}>
          Cargo / Posicion <span style={{ color: theme.subtextColor }}>(Opcional)</span>
        </label>
        <div className="relative">
          <Briefcase
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
            style={{ color: theme.subtextColor }}
          />
          <input
            type="text"
            value={form.position}
            onChange={(event) => setForm((prev) => ({ ...prev, position: event.target.value }))}
            disabled={status === 'loading'}
            className="w-full rounded-xl border py-3 pl-10 pr-4 transition-colors focus:outline-none disabled:opacity-50"
            style={{
              backgroundColor: theme.inputBg,
              borderColor: theme.borderColor,
              color: theme.textColor,
            }}
            placeholder="Ej: Gerente de Ventas"
            maxLength={100}
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium" style={{ color: theme.subtextColor }}>
          Mensaje personalizado <span style={{ color: theme.subtextColor }}>(Opcional)</span>
        </label>
        <div className="relative">
          <MessageSquare
            className="absolute left-3 top-3 h-4 w-4"
            style={{ color: theme.subtextColor }}
          />
          <textarea
            value={form.customMessage}
            onChange={(event) => setForm((prev) => ({ ...prev, customMessage: event.target.value }))}
            disabled={status === 'loading'}
            rows={3}
            className="w-full resize-none rounded-xl border py-3 pl-10 pr-4 transition-colors focus:outline-none disabled:opacity-50"
            style={{
              backgroundColor: theme.inputBg,
              borderColor: theme.borderColor,
              color: theme.textColor,
            }}
            placeholder="Agrega un mensaje personalizado..."
            maxLength={500}
          />
        </div>
        <p className="mt-1 text-right text-xs" style={{ color: theme.subtextColor }}>
          {form.customMessage.length}/500
        </p>
      </div>

      <div
        className="rounded-xl border p-4"
        style={{
          backgroundColor: primarySurface,
          borderColor: theme.borderColor,
        }}
      >
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 flex-shrink-0" style={{ color: theme.primaryColor }} />
          <p className="text-sm" style={{ color: theme.subtextColor }}>
            El usuario recibira un correo con un enlace para completar su registro.
            La invitacion expira en 7 dias.
          </p>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <motion.button
          type="submit"
          whileHover={{ scale: status === 'loading' ? 1 : 1.02 }}
          whileTap={{ scale: status === 'loading' ? 1 : 0.98 }}
          disabled={status === 'loading'}
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium disabled:opacity-70"
          style={{
            backgroundColor: theme.primaryColor,
            color: theme.onPrimaryColor,
            boxShadow: theme.isDark
              ? '0 10px 24px rgba(0, 212, 179, 0.18)'
              : '0 10px 24px rgba(15, 23, 42, 0.12)',
          }}
        >
          {status === 'loading' ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Enviando...</span>
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              <span>Enviar invitacion</span>
            </>
          )}
        </motion.button>
      </div>
    </form>
  )
}
