'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, Shield, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PremiumSelect } from '../../../../../business-panel/components/PremiumSelect'
import type { useOrganizationsTabLogic } from '../hooks/useOrganizationsTabLogic'
import type { OrganizationRole } from '../types'
import { ORGANIZATION_ROLES } from '../types'
import {
  EMPTY_STATE_CLASS,
  LIST_ROW_CLASS,
  REMOVE_ICON_BUTTON_CLASS,
  SECTION_TITLE_CLASS,
} from '../panel-ui'
import { OrganizationAddForm } from './OrganizationAddForm'

type OrganizationsTabProps = ReturnType<typeof useOrganizationsTabLogic>

export function OrganizationsTab(props: OrganizationsTabProps) {
  const { t } = useTranslation(['admin', 'common'])

  const roleOptions = ORGANIZATION_ROLES.map((role) => ({
    value: role,
    label: t(`admin:users.roles.${role}.label`),
  }))

  return (
    <div className="space-y-6">
      <div>
        <p className={SECTION_TITLE_CLASS}>
          {t('admin:users.masterPanel.organizations.title', {
            count: props.visibleMemberships.length,
          })}
        </p>
        {props.visibleMemberships.length === 0 ? (
          <div className={EMPTY_STATE_CLASS}>
            <p className="text-sm text-gray-400">{t('admin:users.masterPanel.organizations.empty')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {props.visibleMemberships.map((membership) => (
                <motion.div
                  key={membership.membershipId}
                  layout
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  className={LIST_ROW_CLASS}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                      {membership.organizationName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {membership.status === 'active'
                        ? t('admin:users.masterPanel.organizations.statusActive')
                        : membership.status ?? '—'}
                      {membership.jobTitle ? ` · ${membership.jobTitle}` : ''}
                      {membership.joinedAt
                        ? ` · ${new Date(membership.joinedAt).toLocaleDateString()}`
                        : ''}
                    </p>
                  </div>

                  <div className="w-40 flex-shrink-0">
                    {props.updatingRoleOrgId === membership.organizationId ? (
                      <div className="flex justify-center">
                        <Loader2 className="h-4 w-4 animate-spin text-accent" />
                      </div>
                    ) : (
                      <PremiumSelect
                        value={membership.role ?? 'member'}
                        onChange={(value) =>
                          props.handleRoleChange(membership, value as OrganizationRole)
                        }
                        options={roleOptions}
                        icon={<Shield className="h-4 w-4" />}
                      />
                    )}
                  </div>

                  {props.removeConfirmOrgId === membership.organizationId ? (
                    <div className="flex flex-shrink-0 items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => props.handleRemove(membership)}
                        className="rounded-lg bg-red-500 px-2.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-red-600"
                      >
                        {t('common:actions.confirm')}
                      </button>
                      <button
                        type="button"
                        onClick={() => props.setRemoveConfirmOrgId(null)}
                        className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-gray-500 transition-colors hover:bg-black/5 dark:text-gray-400 dark:hover:bg-white/5"
                      >
                        {t('common:actions.cancel')}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => props.setRemoveConfirmOrgId(membership.organizationId)}
                      aria-label={t('admin:users.masterPanel.organizations.removeConfirm')}
                      className={REMOVE_ICON_BUTTON_CLASS}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <OrganizationAddForm {...props} />
    </div>
  )
}
