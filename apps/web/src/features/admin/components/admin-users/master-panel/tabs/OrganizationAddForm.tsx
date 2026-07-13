'use client'

import { Building2, Loader2, Plus, Shield } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PremiumSelect } from '../../../../../business-panel/components/PremiumSelect'
import type { useOrganizationsTabLogic } from '../hooks/useOrganizationsTabLogic'
import type { OrganizationRole } from '../types'
import { ORGANIZATION_ROLES } from '../types'
import {
  FIELD_INPUT_CLASS,
  FIELD_LABEL_CLASS,
  PRIMARY_BUTTON_CLASS,
  SECTION_TITLE_CLASS,
} from '../panel-ui'

type OrganizationAddFormProps = Pick<
  ReturnType<typeof useOrganizationsTabLogic>,
  | 'availableOrganizations'
  | 'addOrgId'
  | 'setAddOrgId'
  | 'addRole'
  | 'setAddRole'
  | 'addJobTitle'
  | 'setAddJobTitle'
  | 'isAdding'
  | 'handleAdd'
>

export function OrganizationAddForm(props: OrganizationAddFormProps) {
  const { t } = useTranslation('admin')

  const roleOptions = ORGANIZATION_ROLES.map((role) => ({
    value: role,
    label: t(`users.roles.${role}.label`),
  }))

  return (
    <div className="rounded-xl border border-gray-200 p-4 dark:border-white/10">
      <p className={SECTION_TITLE_CLASS}>{t('users.masterPanel.organizations.addTitle')}</p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <label className={FIELD_LABEL_CLASS}>
            {t('users.masterPanel.organizations.organizationLabel')}
          </label>
          <PremiumSelect
            value={props.addOrgId}
            onChange={props.setAddOrgId}
            options={props.availableOrganizations}
            placeholder={t('users.masterPanel.organizations.organizationLabel')}
            icon={<Building2 className="h-4 w-4" />}
            emptyMessage={t('users.masterPanel.organizations.noAvailable')}
          />
        </div>
        <div>
          <label className={FIELD_LABEL_CLASS}>{t('users.masterPanel.organizations.roleLabel')}</label>
          <PremiumSelect
            value={props.addRole}
            onChange={(value) => props.setAddRole(value as OrganizationRole)}
            options={roleOptions}
            icon={<Shield className="h-4 w-4" />}
          />
        </div>
        <div>
          <label className={FIELD_LABEL_CLASS}>
            {t('users.masterPanel.organizations.jobTitleLabel')}
          </label>
          <input
            type="text"
            value={props.addJobTitle}
            onChange={(e) => props.setAddJobTitle(e.target.value)}
            maxLength={120}
            className={FIELD_INPUT_CLASS}
          />
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={props.handleAdd}
          disabled={props.isAdding || !props.addOrgId}
          className={PRIMARY_BUTTON_CLASS}
        >
          {props.isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          {t('users.masterPanel.organizations.add')}
        </button>
      </div>
    </div>
  )
}
