'use client'

import { CheckCircleIcon } from '@heroicons/react/24/outline'
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

          <div>
            <label className={FIELD_LABEL_CLASS}>{t('admin:users.demographics.emailVerified')}</label>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-gray-200/50 p-3.5 dark:border-gray-500/30 dark:bg-carbon-950">
              <input
                type="checkbox"
                checked={props.formData.email_verified}
                onChange={(e) => props.setField('email_verified', e.target.checked)}
                className="sr-only"
              />
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors duration-200 ${
                  props.formData.email_verified
                    ? 'border-accent bg-accent'
                    : 'border-gray-300 bg-white dark:border-gray-500/40 dark:bg-carbon-900'
                }`}
              >
                {props.formData.email_verified && <CheckCircleIcon className="h-4 w-4 text-white" />}
              </span>
              <span className="text-xs text-gray-500 dark:text-white/60">
                {t('admin:users.demographics.emailVerifiedDesc')}
              </span>
            </label>
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
