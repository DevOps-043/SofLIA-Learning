'use client'

import { useTranslation } from 'react-i18next'
import { useBusinessPanelTheme } from '../../../hooks/useBusinessPanelTheme'

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
  onStreetChange: (v: string) => void
  onExternalNumberChange: (v: string) => void
  onInternalNumberChange: (v: string) => void
  onNeighborhoodChange: (v: string) => void
  onZipCodeChange: (v: string) => void
  onCityChange: (v: string) => void
  onNodeStateChange: (v: string) => void
  onCountryChange: (v: string) => void
  onLatitudeChange: (v: string) => void
  onLongitudeChange: (v: string) => void
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
  const theme = useBusinessPanelTheme()
  const { t } = useTranslation('business')
  const isDisabled = loading || isGeocoding

  const inputStyle = {
    backgroundColor: theme.inputBg,
    borderColor: theme.borderColor,
    color: theme.textColor,
  }

  const labelStyle = { color: theme.subtextColor }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="flex items-center gap-2 text-sm font-bold" style={{ color: theme.textColor }}>
          <span className="text-xl">📍</span> {t('hierarchy.location.title')}
        </h4>
        {latitude || longitude ? (
          <button
            type="button"
            onClick={onReverseGeocode}
            disabled={isDisabled}
            className="text-xs underline transition-colors"
            style={{ color: theme.actionColor }}
          >
            {t('hierarchy.location.fillFromCoords')}
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-12 md:col-span-6">
          <label className="mb-1 block text-xs font-medium" style={labelStyle}>{t('hierarchy.location.fields.street')}</label>
          <input
            type="text"
            value={street}
            onChange={event => onStreetChange(event.target.value)}
            placeholder={t('hierarchy.location.placeholders.street')}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={inputStyle}
          />
        </div>
        <div className="col-span-6 md:col-span-3">
          <label className="mb-1 block text-xs font-medium" style={labelStyle}>{t('hierarchy.location.fields.extNum')}</label>
          <input
            type="text"
            value={externalNumber}
            onChange={event => onExternalNumberChange(event.target.value)}
            placeholder="123"
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={inputStyle}
          />
        </div>
        <div className="col-span-6 md:col-span-3">
          <label className="mb-1 block text-xs font-medium" style={labelStyle}>{t('hierarchy.location.fields.intNum')}</label>
          <input
            type="text"
            value={internalNumber}
            onChange={event => onInternalNumberChange(event.target.value)}
            placeholder="PB"
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={inputStyle}
          />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-8">
          <label className="mb-1 block text-xs font-medium" style={labelStyle}>{t('hierarchy.location.fields.neighborhood')}</label>
          <input
            type="text"
            value={neighborhood}
            onChange={event => onNeighborhoodChange(event.target.value)}
            placeholder={t('hierarchy.location.placeholders.neighborhood')}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={inputStyle}
          />
        </div>
        <div className="col-span-4">
          <label className="mb-1 block text-xs font-medium" style={labelStyle}>{t('hierarchy.location.fields.zipCode')}</label>
          <input
            type="text"
            value={zipCode}
            onChange={event => onZipCodeChange(event.target.value)}
            placeholder="06600"
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={inputStyle}
          />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-12 md:col-span-4">
          <label className="mb-1 block text-xs font-medium" style={labelStyle}>{t('hierarchy.location.fields.city')}</label>
          <input
            type="text"
            value={city}
            onChange={event => onCityChange(event.target.value)}
            placeholder={t('hierarchy.location.placeholders.city')}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={inputStyle}
          />
        </div>
        <div className="col-span-6 md:col-span-4">
          <label className="mb-1 block text-xs font-medium" style={labelStyle}>{t('hierarchy.location.fields.state')}</label>
          <input
            type="text"
            value={nodeState}
            onChange={event => onNodeStateChange(event.target.value)}
            placeholder={t('hierarchy.location.placeholders.state')}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={inputStyle}
          />
        </div>
        <div className="col-span-6 md:col-span-4">
          <label className="mb-1 block text-xs font-medium" style={labelStyle}>{t('hierarchy.location.fields.country')}</label>
          <input
            type="text"
            value={country}
            onChange={event => onCountryChange(event.target.value)}
            placeholder={t('hierarchy.location.placeholders.country')}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={inputStyle}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={onGeocode}
        disabled={isDisabled || !street || !city}
        className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors disabled:opacity-50"
        style={{
          backgroundColor: theme.actionSurface,
          color: theme.actionColor,
        }}
      >
        🌍 {t('hierarchy.location.calculateFromFields')}
      </button>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium" style={labelStyle}>{t('hierarchy.location.fields.latitude')}</label>
          <input
            type="number"
            step={0.000001}
            value={latitude}
            onChange={event => onLatitudeChange(event.target.value)}
            placeholder="-34.6037"
            className="w-full rounded-lg border px-3 py-2 text-sm font-mono"
            style={inputStyle}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium" style={labelStyle}>{t('hierarchy.location.fields.longitude')}</label>
          <input
            type="number"
            step={0.000001}
            value={longitude}
            onChange={event => onLongitudeChange(event.target.value)}
            placeholder="-58.3816"
            className="w-full rounded-lg border px-3 py-2 text-sm font-mono"
            style={inputStyle}
          />
        </div>
      </div>
    </div>
  )
}
