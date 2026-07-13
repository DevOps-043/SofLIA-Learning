'use client'

import { KeyRound, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { useAccountTabLogic } from '../hooks/useAccountTabLogic'
import {
  FIELD_INPUT_CLASS,
  FIELD_LABEL_CLASS,
  PRIMARY_BUTTON_CLASS,
  SECTION_TITLE_CLASS,
} from '../panel-ui'

type AccountPasswordSectionProps = Pick<
  ReturnType<typeof useAccountTabLogic>,
  | 'newPassword'
  | 'setNewPassword'
  | 'confirmPassword'
  | 'setConfirmPassword'
  | 'passwordError'
  | 'isSettingPassword'
  | 'handleSetPassword'
>

export function AccountPasswordSection(props: AccountPasswordSectionProps) {
  const { t } = useTranslation('admin')

  return (
    <div className="rounded-xl border border-gray-200 p-4 dark:border-white/10">
      <p className={SECTION_TITLE_CLASS}>
        <KeyRound className="mr-1.5 inline h-4 w-4" />
        {t('users.masterPanel.account.password.title')}
      </p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className={FIELD_LABEL_CLASS}>
            {t('users.masterPanel.account.password.newLabel')}
          </label>
          <input
            type="password"
            value={props.newPassword}
            onChange={(e) => props.setNewPassword(e.target.value)}
            autoComplete="new-password"
            className={FIELD_INPUT_CLASS}
          />
        </div>
        <div>
          <label className={FIELD_LABEL_CLASS}>
            {t('users.masterPanel.account.password.confirmLabel')}
          </label>
          <input
            type="password"
            value={props.confirmPassword}
            onChange={(e) => props.setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            className={FIELD_INPUT_CLASS}
          />
        </div>
      </div>
      <p className="mt-2 text-xs text-gray-500 dark:text-white/60">
        {t('users.masterPanel.account.password.requirements')}
      </p>
      {props.passwordError ? (
        <p className="mt-2 text-xs font-medium text-red-500">{props.passwordError}</p>
      ) : null}
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={props.handleSetPassword}
          disabled={props.isSettingPassword || !props.newPassword || !props.confirmPassword}
          className={PRIMARY_BUTTON_CLASS}
        >
          {props.isSettingPassword && <Loader2 className="h-4 w-4 animate-spin" />}
          {t('users.masterPanel.account.password.submit')}
        </button>
      </div>
    </div>
  )
}
