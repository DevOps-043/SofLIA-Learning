'use client'

import { Loader2, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PremiumSelect } from '../../../../../business-panel/components/PremiumSelect'
import type { useAccountTabLogic } from '../hooks/useAccountTabLogic'
import {
  FIELD_LABEL_CLASS,
  PRIMARY_BUTTON_CLASS,
} from '../panel-ui'
import { AccountDangerZone } from './AccountDangerZone'
import { AccountInfoSection } from './AccountInfoSection'
import { AccountPasswordSection } from './AccountPasswordSection'

const PLATFORM_ROLES = ['Usuario', 'Instructor', 'Administrador', 'Business'] as const

type AccountTabProps = ReturnType<typeof useAccountTabLogic> & {
  onRequestDelete?: () => void
}

export function AccountTab(props: AccountTabProps) {
  const { t } = useTranslation(['admin', 'common'])

  const roleOptions = PLATFORM_ROLES.map((role) => ({
    value: role,
    label: t(`admin:users.roles.${role}`, { defaultValue: role }),
  }))

  return (
    <div className="space-y-6">
      <AccountInfoSection user={props.user} />

      <div className="rounded-xl border border-gray-200 p-4 dark:border-white/10">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className={FIELD_LABEL_CLASS}>{t('admin:users.demographics.platformRole')} *</label>
            <PremiumSelect
              value={props.formData.platform_role}
              onChange={(value) => props.setField('platform_role', value)}
              options={roleOptions}
              icon={<ShieldCheck className="h-4 w-4" />}
            />
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3.5 dark:border-gray-500/30 dark:bg-carbon-950">
            <label className={FIELD_LABEL_CLASS}>{t('admin:users.demographics.emailVerified')}</label>
            <p className="mt-1 text-xs text-gray-500 dark:text-white/60">
              {props.user.email_verified
                ? t('admin:users.status.verified', { defaultValue: 'Verificado por el proveedor de identidad' })
                : t('admin:users.status.unverified', { defaultValue: 'Pendiente de confirmacion de correo' })}
            </p>
          </div>
        </div>

        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={props.handleSaveAccount}
            disabled={props.isSaving}
            className={PRIMARY_BUTTON_CLASS}
          >
            {props.isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            {props.isSaving ? t('common:actions.saving') : t('common:actions.saveChanges')}
          </button>
        </div>
      </div>

      <AccountPasswordSection {...props} />

      <AccountDangerZone {...props} onRequestDelete={props.onRequestDelete} />
    </div>
  )
}
