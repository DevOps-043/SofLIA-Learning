'use client'

import type { Dispatch, FormEventHandler, SetStateAction } from 'react'
import { motion } from 'framer-motion'
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle,
  ChevronRight,
  Copy,
  Link2,
  Loader2,
  Shield,
  Sparkles,
  Users,
} from 'lucide-react'
import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'
import type {
  BusinessInviteBulkForm,
  BusinessInviteRole,
  CreatedLink,
} from '../../services/business-invite-modal.service'
import { BusinessInviteRoleCards } from './BusinessInviteRoleCards'

interface BusinessInviteBulkTabProps {
  form: BusinessInviteBulkForm
  setForm: Dispatch<SetStateAction<BusinessInviteBulkForm>>
  status: 'idle' | 'loading' | 'success' | 'error'
  error: string | null
  createdLink: CreatedLink | null
  copied: boolean
  onSubmit: FormEventHandler<HTMLFormElement>
  onCopyLink: (token: string) => Promise<void>
  onCreateAnother: () => void
  onGoToManage: () => void
  getInviteUrl: (token: string) => string
  roleLabels: Record<BusinessInviteRole, { label: string; desc: string }>
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
  roleLabels,
}: BusinessInviteBulkTabProps) {
  const theme = useBusinessPanelTheme()
  const successSurface = theme.isDark ? 'rgba(16, 185, 129, 0.16)' : 'rgba(16, 185, 129, 0.1)'
  const dangerSurface = theme.isDark ? 'rgba(239, 68, 68, 0.16)' : 'rgba(239, 68, 68, 0.1)'
  const primarySurface = theme.isDark ? 'rgba(0, 212, 179, 0.14)' : 'rgba(10, 37, 64, 0.08)'

  if (status === 'success' && createdLink) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
            className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full"
            style={{ backgroundColor: successSurface }}
          >
            <CheckCircle className="h-10 w-10" style={{ color: theme.successColor }} />
          </motion.div>
          <h4 className="mb-2 text-xl font-bold" style={{ color: theme.textColor }}>
            Enlace creado
          </h4>
          <p style={{ color: theme.subtextColor }}>
            Comparte este enlace con las personas que deseas invitar
          </p>
        </div>

        <div
          className="rounded-xl border p-4"
          style={{
            backgroundColor: theme.inputBg,
            borderColor: theme.borderColor,
          }}
        >
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="mb-1 text-xs font-medium" style={{ color: theme.subtextColor }}>
                Enlace de invitacion
              </p>
              <p className="truncate font-mono text-sm" style={{ color: theme.textColor }}>
                {getInviteUrl(createdLink.token)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void onCopyLink(createdLink.token)}
              className="flex-shrink-0 rounded-lg p-2 transition-colors"
              style={{
                backgroundColor: copied ? successSurface : theme.hoverBg,
                color: copied ? theme.successColor : theme.textColor,
              }}
            >
              {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl p-3 text-center" style={{ backgroundColor: theme.inputBg }}>
            <Users className="mx-auto mb-1 h-5 w-5" style={{ color: theme.primaryColor }} />
            <p className="text-lg font-bold" style={{ color: theme.textColor }}>
              {createdLink.max_uses}
            </p>
            <p className="text-xs" style={{ color: theme.subtextColor }}>
              Max. usuarios
            </p>
          </div>
          <div className="rounded-xl p-3 text-center" style={{ backgroundColor: theme.inputBg }}>
            <Shield className="mx-auto mb-1 h-5 w-5" style={{ color: theme.primaryColor }} />
            <p className="text-lg font-bold capitalize" style={{ color: theme.textColor }}>
              {roleLabels[createdLink.role as BusinessInviteRole]?.label || createdLink.role}
            </p>
            <p className="text-xs" style={{ color: theme.subtextColor }}>
              Rol
            </p>
          </div>
          <div className="rounded-xl p-3 text-center" style={{ backgroundColor: theme.inputBg }}>
            <Calendar className="mx-auto mb-1 h-5 w-5" style={{ color: theme.primaryColor }} />
            <p className="text-lg font-bold" style={{ color: theme.textColor }}>
              {new Date(createdLink.expires_at).toLocaleDateString('es-MX', {
                day: '2-digit',
                month: 'short',
              })}
            </p>
            <p className="text-xs" style={{ color: theme.subtextColor }}>
              Expira
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between border-t pt-4" style={{ borderColor: theme.dividerColor }}>
          <button
            type="button"
            onClick={onCreateAnother}
            className="rounded-xl px-4 py-2.5 text-sm font-medium transition-colors"
            style={{ color: theme.subtextColor }}
          >
            Crear otro enlace
          </button>
          <button
            type="button"
            onClick={onGoToManage}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors"
            style={{ color: theme.textColor }}
          >
            Ver todos los enlaces
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
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
          Nombre del enlace <span style={{ color: theme.subtextColor }}>(Opcional)</span>
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          disabled={status === 'loading'}
          className="w-full rounded-xl border px-4 py-3 transition-colors focus:outline-none disabled:opacity-50"
          style={{
            backgroundColor: theme.inputBg,
            borderColor: theme.borderColor,
            color: theme.textColor,
          }}
          placeholder="Ej: Invitacion Equipo de Ventas"
          maxLength={100}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium" style={{ color: theme.subtextColor }}>
          Numero maximo de registros <span style={{ color: theme.dangerColor }}>*</span>
        </label>
        <div className="relative">
          <Users
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
            style={{ color: theme.subtextColor }}
          />
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
            className="w-full rounded-xl border py-3 pl-10 pr-4 transition-colors focus:outline-none disabled:opacity-50"
            style={{
              backgroundColor: theme.inputBg,
              borderColor: theme.borderColor,
              color: theme.textColor,
            }}
          />
        </div>
        <p className="mt-1 text-xs" style={{ color: theme.subtextColor }}>
          Maximo de usuarios que pueden registrarse con este enlace (1-10,000)
        </p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium" style={{ color: theme.subtextColor }}>
          Rol asignado <span style={{ color: theme.dangerColor }}>*</span>
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
          Fecha de expiracion <span style={{ color: theme.dangerColor }}>*</span>
        </label>
        <div className="relative">
          <Calendar
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
            style={{ color: theme.subtextColor }}
          />
          <input
            type="datetime-local"
            value={form.expiresAt}
            onChange={(event) => setForm((prev) => ({ ...prev, expiresAt: event.target.value }))}
            required
            disabled={status === 'loading'}
            className="w-full rounded-xl border py-3 pl-10 pr-4 transition-colors focus:outline-none disabled:opacity-50"
            style={{
              backgroundColor: theme.inputBg,
              borderColor: theme.borderColor,
              color: theme.textColor,
            }}
            min={new Date().toISOString().slice(0, 16)}
          />
        </div>
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
            El enlace permitira que cualquier persona se registre en tu organizacion
            con el rol especificado. Puedes pausar o eliminar el enlace en cualquier momento.
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
              <span>Creando...</span>
            </>
          ) : (
            <>
              <Link2 className="h-4 w-4" />
              <span>Crear enlace</span>
            </>
          )}
        </motion.button>
      </div>
    </form>
  )
}
