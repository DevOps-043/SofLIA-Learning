'use client'

import { Globe2, LocateFixed, MapPin } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import styles from '../HierarchyExperience.module.css'

interface PropertiesFormBuilderProps {
  street: string
  externalNumber: string
  internalNumber: string
  neighborhood: string
  zipCode: string
  city: string
  nodeState: string
  country: string
  latitude: string
  longitude: string
  loading: boolean
  isGeocoding: boolean
  onStreetChange: (value: string) => void
  onExternalNumberChange: (value: string) => void
  onInternalNumberChange: (value: string) => void
  onNeighborhoodChange: (value: string) => void
  onZipCodeChange: (value: string) => void
  onCityChange: (value: string) => void
  onNodeStateChange: (value: string) => void
  onCountryChange: (value: string) => void
  onLatitudeChange: (value: string) => void
  onLongitudeChange: (value: string) => void
  onGeocode: () => void
  onReverseGeocode: () => void
}

export function PropertiesFormBuilder({
  street,
  externalNumber,
  internalNumber,
  neighborhood,
  zipCode,
  city,
  nodeState,
  country,
  latitude,
  longitude,
  loading,
  isGeocoding,
  onStreetChange,
  onExternalNumberChange,
  onInternalNumberChange,
  onNeighborhoodChange,
  onZipCodeChange,
  onCityChange,
  onNodeStateChange,
  onCountryChange,
  onLatitudeChange,
  onLongitudeChange,
  onGeocode,
  onReverseGeocode,
}: PropertiesFormBuilderProps) {
  const { t } = useTranslation('business')
  const isDisabled = loading || isGeocoding

  return (
    <section className={styles.formSection}>
      <div className={styles.cardHeader}>
        <h3 className={styles.formSectionTitle}>
          <MapPin aria-hidden="true" />
          {t('hierarchy.location.title')}
        </h3>
        {latitude || longitude ? (
          <button type="button" onClick={onReverseGeocode} disabled={isDisabled} className={styles.ghostButton}>
            <LocateFixed aria-hidden="true" />
            {t('hierarchy.location.fillFromCoords')}
          </button>
        ) : null}
      </div>

      <div className={styles.addressPrimary}>
        <Field label={t('hierarchy.location.fields.street')} value={street} onChange={onStreetChange} placeholder={t('hierarchy.location.placeholders.street')} />
        <Field label={t('hierarchy.location.fields.extNum')} value={externalNumber} onChange={onExternalNumberChange} placeholder="123" />
        <Field label={t('hierarchy.location.fields.intNum')} value={internalNumber} onChange={onInternalNumberChange} placeholder="PB" />
      </div>

      <div className={styles.addressSecondary}>
        <Field label={t('hierarchy.location.fields.neighborhood')} value={neighborhood} onChange={onNeighborhoodChange} placeholder={t('hierarchy.location.placeholders.neighborhood')} />
        <Field label={t('hierarchy.location.fields.zipCode')} value={zipCode} onChange={onZipCodeChange} placeholder="06600" />
      </div>

      <div className={styles.addressLocation}>
        <Field label={t('hierarchy.location.fields.city')} value={city} onChange={onCityChange} placeholder={t('hierarchy.location.placeholders.city')} />
        <Field label={t('hierarchy.location.fields.state')} value={nodeState} onChange={onNodeStateChange} placeholder={t('hierarchy.location.placeholders.state')} />
        <Field label={t('hierarchy.location.fields.country')} value={country} onChange={onCountryChange} placeholder={t('hierarchy.location.placeholders.country')} />
      </div>

      <button
        type="button"
        onClick={onGeocode}
        disabled={isDisabled || !street || !city}
        className={styles.secondaryButton}
      >
        <Globe2 aria-hidden="true" />
        {t('hierarchy.location.calculateFromFields')}
      </button>

      <div className={styles.coordinateGrid}>
        <Field label={t('hierarchy.location.fields.latitude')} value={latitude} onChange={onLatitudeChange} placeholder="-34.6037" type="number" />
        <Field label={t('hierarchy.location.fields.longitude')} value={longitude} onChange={onLongitudeChange} placeholder="-58.3816" type="number" />
      </div>
    </section>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  type?: 'text' | 'number'
}) {
  return (
    <label className={styles.fieldGroup}>
      <span className={styles.fieldLabel}>{label}</span>
      <input
        type={type}
        step={type === 'number' ? 0.000001 : undefined}
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder={placeholder}
        className={styles.input}
      />
    </label>
  )
}
