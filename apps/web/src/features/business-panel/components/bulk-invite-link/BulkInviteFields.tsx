'use client'

import type { ChangeEvent } from 'react'
import { Calendar, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { BulkInviteFormData, ModalStatus } from './types'
import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'

interface BulkInviteFieldsProps {
  formData: BulkInviteFormData
  status: ModalStatus
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
}

export function BulkInviteFields({ formData, status, onChange }: BulkInviteFieldsProps) {
  const { t } = useTranslation('business')
  const theme = useBusinessPanelTheme()
  const disabled = status === 'loading'

  return (
    <>
      <label className="block text-sm font-medium" style={{ color: theme.mutedTextColor }}>
        {t('users.modals.bulkInvite.fields.name', 'Nombre del enlace')}
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={onChange}
          disabled={disabled}
          className="mt-2 w-full px-4 py-3 rounded-xl border focus:outline-none transition-colors disabled:opacity-50"
          style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor, color: theme.textColor }}
          placeholder={t('users.modals.bulkInvite.placeholders.name', 'Ej: Invitacion Equipo de Ventas')}
          maxLength={100}
        />
      </label>
      <NumberField value={formData.maxUses} disabled={disabled} onChange={onChange} />
      <label className="block text-sm font-medium" style={{ color: theme.mutedTextColor }}>
        {t('users.modals.bulkInvite.fields.expiresAt', 'Fecha de expiracion')} <span className="text-red-400">*</span>
        <div className="relative mt-2">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: theme.mutedTextColor }} />
          <input
            type="datetime-local"
            name="expiresAt"
            value={formData.expiresAt}
            onChange={onChange}
            required
            disabled={disabled}
            min={new Date().toISOString().slice(0, 16)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none transition-colors disabled:opacity-50"
            style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor, color: theme.textColor }}
          />
        </div>
      </label>
    </>
  )
}

function NumberField({ value, disabled, onChange }: { value: number; disabled: boolean; onChange: BulkInviteFieldsProps['onChange'] }) {
  const { t } = useTranslation('business')
  const theme = useBusinessPanelTheme()

  return (
    <label className="block text-sm font-medium" style={{ color: theme.mutedTextColor }}>
      {t('users.modals.bulkInvite.fields.maxUses', 'Numero maximo de registros')} <span className="text-red-400">*</span>
      <div className="relative mt-2">
        <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: theme.mutedTextColor }} />
        <input type="number" name="maxUses" value={value} onChange={onChange} required min={1} max={10000} disabled={disabled} className="w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none transition-colors disabled:opacity-50" style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor, color: theme.textColor }} />
      </div>
      <span className="text-xs mt-1 block" style={{ color: theme.mutedTextColor }}>
        {t('users.modals.bulkInvite.hints.maxUses', 'Maximo de usuarios que pueden registrarse con este enlace (1-10,000)')}
      </span>
    </label>
  )
}
