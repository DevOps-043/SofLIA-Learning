'use client'

import { Ban, Loader2, ShieldAlert, Trash2, UserCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { useAccountTabLogic } from '../hooks/useAccountTabLogic'
import { FIELD_INPUT_CLASS, FIELD_LABEL_CLASS } from '../panel-ui'

type AccountDangerZoneProps = Pick<
  ReturnType<typeof useAccountTabLogic>,
  | 'user'
  | 'isRevokeConfirmOpen'
  | 'setIsRevokeConfirmOpen'
  | 'isRevoking'
  | 'handleRevokeSessions'
  | 'banReason'
  | 'setBanReason'
  | 'isBanConfirmOpen'
  | 'setIsBanConfirmOpen'
  | 'isTogglingBan'
  | 'handleToggleBan'
> & {
  onRequestDelete?: () => void
}

const DANGER_ACTION_CLASS =
  'rounded-xl border border-red-500/40 px-4 py-1.5 text-xs font-bold text-red-500 transition-colors hover:bg-red-500/10 disabled:opacity-50'
const DANGER_CONFIRM_CLASS =
  'flex items-center gap-2 rounded-xl bg-red-500 px-4 py-1.5 text-xs font-bold text-white transition-all hover:bg-red-600 disabled:opacity-50'
const DANGER_CANCEL_CLASS =
  'rounded-xl px-4 py-1.5 text-xs font-bold text-gray-500 transition-colors hover:bg-black/5 dark:text-gray-400 dark:hover:bg-white/5'

export function AccountDangerZone(props: AccountDangerZoneProps) {
  const { t } = useTranslation(['admin', 'common'])
  const isBanned = Boolean(props.user.is_banned)

  return (
    <div className="space-y-4 rounded-xl border border-red-500/30 bg-red-500/5 p-4">
      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-500">
        <ShieldAlert className="h-4 w-4" />
        {t('admin:users.masterPanel.account.sessions.title')}
      </p>

      {/* Revocar sesiones */}
      <div>
        <p className="mb-2 text-xs text-gray-500 dark:text-white/60">
          {t('admin:users.masterPanel.account.sessions.description')}
        </p>
        {props.isRevokeConfirmOpen ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-red-500">
              {t('admin:users.masterPanel.account.sessions.confirm')}
            </span>
            <button
              type="button"
              onClick={props.handleRevokeSessions}
              disabled={props.isRevoking}
              className={DANGER_CONFIRM_CLASS}
            >
              {props.isRevoking && <Loader2 className="h-3 w-3 animate-spin" />}
              {t('common:actions.confirm')}
            </button>
            <button
              type="button"
              onClick={() => props.setIsRevokeConfirmOpen(false)}
              disabled={props.isRevoking}
              className={DANGER_CANCEL_CLASS}
            >
              {t('common:actions.cancel')}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => props.setIsRevokeConfirmOpen(true)}
            className={DANGER_ACTION_CLASS}
          >
            {t('admin:users.masterPanel.account.sessions.revoke')}
          </button>
        )}
      </div>

      {/* Suspender / reactivar cuenta */}
      <div className="border-t border-red-500/20 pt-4">
        <p className="mb-2 text-xs text-gray-500 dark:text-white/60">
          {isBanned
            ? t('admin:users.masterPanel.account.ban.unbanDescription')
            : t('admin:users.masterPanel.account.ban.banDescription')}
        </p>
        {props.isBanConfirmOpen ? (
          <div className="space-y-2">
            {!isBanned ? (
              <div>
                <label className={FIELD_LABEL_CLASS}>
                  {t('admin:users.masterPanel.account.ban.reasonLabel')}
                </label>
                <input
                  type="text"
                  value={props.banReason}
                  onChange={(e) => props.setBanReason(e.target.value)}
                  maxLength={500}
                  placeholder={t('admin:users.masterPanel.account.ban.reasonPlaceholder')}
                  className={FIELD_INPUT_CLASS}
                />
              </div>
            ) : null}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-red-500">
                {isBanned
                  ? t('admin:users.masterPanel.account.ban.unbanConfirm')
                  : t('admin:users.masterPanel.account.ban.banConfirm')}
              </span>
              <button
                type="button"
                onClick={props.handleToggleBan}
                disabled={props.isTogglingBan}
                className={DANGER_CONFIRM_CLASS}
              >
                {props.isTogglingBan && <Loader2 className="h-3 w-3 animate-spin" />}
                {t('common:actions.confirm')}
              </button>
              <button
                type="button"
                onClick={() => props.setIsBanConfirmOpen(false)}
                disabled={props.isTogglingBan}
                className={DANGER_CANCEL_CLASS}
              >
                {t('common:actions.cancel')}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => props.setIsBanConfirmOpen(true)}
            className={
              isBanned
                ? 'inline-flex items-center gap-1.5 rounded-xl border border-green-500/40 px-4 py-1.5 text-xs font-bold text-green-600 transition-colors hover:bg-green-500/10 dark:text-green-400'
                : `inline-flex items-center gap-1.5 ${DANGER_ACTION_CLASS}`
            }
          >
            {isBanned ? <UserCheck className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
            {isBanned
              ? t('admin:users.masterPanel.account.ban.unban')
              : t('admin:users.masterPanel.account.ban.ban')}
          </button>
        )}
      </div>

      {/* Eliminar usuario (delega en el modal de borrado existente) */}
      {props.onRequestDelete ? (
        <div className="border-t border-red-500/20 pt-4">
          <p className="mb-2 text-xs text-gray-500 dark:text-white/60">
            {t('admin:users.masterPanel.account.delete.description')}
          </p>
          <button
            type="button"
            onClick={props.onRequestDelete}
            className={`inline-flex items-center gap-1.5 ${DANGER_ACTION_CLASS}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
            {t('admin:users.masterPanel.account.delete.button')}
          </button>
        </div>
      ) : null}
    </div>
  )
}
