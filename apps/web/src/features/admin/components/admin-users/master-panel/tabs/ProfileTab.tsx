'use client'

import { Loader2 } from 'lucide-react'
import {
  EnvelopeIcon,
  FlagIcon,
  MapPinIcon,
  PhoneIcon,
  UserIcon,
} from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'
import { USER_GENDER_VALUES } from '../../../../../../lib/schemas/user-demographics.schema'
import type { UserGender } from '../../../../../../lib/schemas/user-demographics.schema'
import { PremiumSelect } from '../../../../../business-panel/components/PremiumSelect'
import type { useProfileTabLogic } from '../hooks/useProfileTabLogic'
import {
  FIELD_ICON_CLASS,
  FIELD_INPUT_CLASS,
  FIELD_INPUT_WITH_ICON_CLASS,
  FIELD_LABEL_CLASS,
  PRIMARY_BUTTON_CLASS,
} from '../panel-ui'

type ProfileTabProps = ReturnType<typeof useProfileTabLogic>

export function ProfileTab({ formData, setField, handleSave, isSaving }: ProfileTabProps) {
  const { t } = useTranslation(['admin', 'common'])
  const maxDateOfBirth = new Date().toISOString().slice(0, 10)

  const genderOptions = [
    { value: '', label: t('common:demographics.gender.placeholder') },
    ...USER_GENDER_VALUES.map((gender) => ({
      value: gender,
      label: t(`common:demographics.gender.options.${gender}`),
    })),
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="group">
          <label className={FIELD_LABEL_CLASS}>{t('admin:users.demographics.username')} *</label>
          <div className="relative">
            <UserIcon className={FIELD_ICON_CLASS} />
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setField('username', e.target.value)}
              className={FIELD_INPUT_WITH_ICON_CLASS}
              required
            />
          </div>
        </div>

        <div className="group">
          <label className={FIELD_LABEL_CLASS}>{t('admin:users.demographics.email')} *</label>
          <div className="relative">
            <EnvelopeIcon className={FIELD_ICON_CLASS} />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setField('email', e.target.value)}
              className={FIELD_INPUT_WITH_ICON_CLASS}
              required
            />
          </div>
        </div>

        <div>
          <label className={FIELD_LABEL_CLASS}>{t('admin:users.demographics.firstName')}</label>
          <input
            type="text"
            value={formData.first_name}
            onChange={(e) => setField('first_name', e.target.value)}
            className={FIELD_INPUT_CLASS}
          />
        </div>

        <div>
          <label className={FIELD_LABEL_CLASS}>{t('admin:users.demographics.lastName')}</label>
          <input
            type="text"
            value={formData.last_name}
            onChange={(e) => setField('last_name', e.target.value)}
            className={FIELD_INPUT_CLASS}
          />
        </div>

        <div>
          <label className={FIELD_LABEL_CLASS}>{t('admin:users.demographics.displayName')}</label>
          <input
            type="text"
            value={formData.display_name}
            onChange={(e) => setField('display_name', e.target.value)}
            className={FIELD_INPUT_CLASS}
          />
        </div>

        <div>
          <label className={FIELD_LABEL_CLASS}>{t('common:demographics.dateOfBirth')}</label>
          <input
            type="date"
            value={formData.date_of_birth}
            max={maxDateOfBirth}
            onChange={(e) => setField('date_of_birth', e.target.value)}
            className={FIELD_INPUT_CLASS}
          />
        </div>

        <div>
          <label className={FIELD_LABEL_CLASS}>{t('common:demographics.gender.label')}</label>
          <PremiumSelect
            value={formData.gender}
            onChange={(value) => setField('gender', value as UserGender | '')}
            options={genderOptions}
            placeholder={t('common:demographics.gender.placeholder')}
          />
        </div>

        <div className="group">
          <label className={FIELD_LABEL_CLASS}>{t('admin:users.demographics.phone')}</label>
          <div className="relative">
            <PhoneIcon className={FIELD_ICON_CLASS} />
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setField('phone', e.target.value)}
              className={FIELD_INPUT_WITH_ICON_CLASS}
            />
          </div>
        </div>

        <div className="group">
          <label className={FIELD_LABEL_CLASS}>{t('admin:users.demographics.location')}</label>
          <div className="relative">
            <MapPinIcon className={FIELD_ICON_CLASS} />
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setField('location', e.target.value)}
              className={FIELD_INPUT_WITH_ICON_CLASS}
            />
          </div>
        </div>

        <div className="group">
          <label className={FIELD_LABEL_CLASS}>{t('admin:users.demographics.countryCode')}</label>
          <div className="relative">
            <FlagIcon className={FIELD_ICON_CLASS} />
            <input
              type="text"
              value={formData.country_code}
              onChange={(e) => setField('country_code', e.target.value)}
              placeholder="MX, US, etc."
              className={FIELD_INPUT_WITH_ICON_CLASS}
            />
          </div>
        </div>
      </div>

      <div>
        <label className={FIELD_LABEL_CLASS}>{t('admin:users.demographics.bio')}</label>
        <textarea
          value={formData.bio}
          onChange={(e) => setField('bio', e.target.value)}
          rows={3}
          className={`${FIELD_INPUT_CLASS} resize-none`}
          placeholder={t('admin:users.demographics.bioPlaceholder')}
        />
      </div>

      <div className="flex justify-end">
        <button type="button" onClick={handleSave} disabled={isSaving} className={PRIMARY_BUTTON_CLASS}>
          {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSaving ? t('common:actions.saving') : t('common:actions.saveChanges')}
        </button>
      </div>
    </div>
  )
}
