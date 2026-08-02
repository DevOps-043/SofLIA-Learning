'use client'

import { useMemo, useState } from 'react'
import { RotateCcw, Save } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { PremiumSelect } from '@/features/business-panel/components/PremiumSelect'
import {
  AI_MODEL_SETTINGS_LIMITS,
  AI_THINKING_LEVELS,
  inferAiProvider,
  type AiProviderSelection,
  type AiThinkingLevel,
} from '@/lib/ai/model-settings'
import { cn } from '@/utils/cn'

import type { AdminAiPurpose, PurposeFormState } from './types'

interface PurposeSettingsCardProps {
  isSaving: boolean
  onReset: (purposeId: string) => void
  onSave: (purposeId: string, form: PurposeFormState) => void
  purpose: AdminAiPurpose
}

function buildInitialForm(purpose: AdminAiPurpose): PurposeFormState {
  const settings = purpose.settings

  return {
    maxOutputTokens:
      settings?.maxOutputTokens === null || settings?.maxOutputTokens === undefined
        ? ''
        : String(settings.maxOutputTokens),
    model: settings?.model ?? purpose.defaults.model,
    provider: settings?.providerSelection ?? 'auto',
    temperature:
      settings?.temperature === null || settings?.temperature === undefined
        ? ''
        : String(settings.temperature),
    thinkingLevel: settings?.thinkingLevel ?? purpose.defaults.thinkingLevel,
  }
}

const FIELD_CLASSES = cn(
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900',
  'placeholder:text-gray-400 focus:border-gray-400 focus:outline-none',
  'dark:border-white/10 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500',
)

const LABEL_CLASSES = 'mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400'

export function PurposeSettingsCard({
  isSaving,
  onReset,
  onSave,
  purpose,
}: PurposeSettingsCardProps) {
  const { t } = useTranslation('admin')
  const initialForm = useMemo(() => buildInitialForm(purpose), [purpose])
  const [form, setForm] = useState<PurposeFormState>(initialForm)

  // El formulario se reinicia cuando cambian los datos del servidor (tras
  // guardar o restablecer), sin necesidad de un efecto de sincronización.
  const [syncedSettingsKey, setSyncedSettingsKey] = useState(
    JSON.stringify(purpose.settings),
  )
  const currentSettingsKey = JSON.stringify(purpose.settings)
  if (currentSettingsKey !== syncedSettingsKey) {
    setSyncedSettingsKey(currentSettingsKey)
    setForm(initialForm)
  }

  const thinkingOptions = AI_THINKING_LEVELS.map((level) => ({
    label: t(`aiSettings.thinkingLevels.${level}`),
    value: level,
  }))

  // Solo se ofrecen los proveedores que el propósito admite: los que envían
  // audio o vídeo en línea únicamente funcionan con Gemini.
  const providerOptions = [
    { label: t('aiSettings.providers.auto'), value: 'auto' },
    ...purpose.supportedProviders.map((provider) => ({
      label: t(`aiSettings.providers.${provider}`),
      value: provider,
    })),
  ]
  const isProviderLocked = purpose.supportedProviders.length < 2

  // Proveedor que se usará con lo que hay escrito AHORA en el formulario, para
  // que el administrador vea el efecto de su cambio antes de guardar.
  const detectedProvider = inferAiProvider(form.model)
  const effectiveProvider = form.provider === 'auto' ? detectedProvider : form.provider
  const isProviderUnknown = form.provider === 'auto' && detectedProvider === null

  const isInherited = !purpose.settings?.hasDatabaseOverride
  const sourceLabel = isInherited
    ? t(`aiSettings.source.${purpose.settings?.modelSource ?? 'default'}`)
    : t('aiSettings.source.database')

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-gray-800">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            {t(purpose.labelKey)}
          </h3>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
            {t(purpose.descriptionKey)}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <span
            className={cn(
              'rounded-full px-2.5 py-1 text-[10px] font-medium',
              effectiveProvider === 'openai'
                ? 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400'
                : 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400',
            )}
          >
            {t(`aiSettings.providers.${effectiveProvider ?? 'google'}`)}
          </span>

          <span
            className={cn(
              'rounded-full px-2.5 py-1 text-[10px] font-medium',
              isInherited
                ? 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400'
                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
            )}
          >
            {sourceLabel}
          </span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={LABEL_CLASSES} htmlFor={`model-${purpose.id}`}>
            {t('aiSettings.fields.model')}
          </label>
          <input
            className={FIELD_CLASSES}
            id={`model-${purpose.id}`}
            onChange={(event) => setForm((prev) => ({ ...prev, model: event.target.value }))}
            placeholder={purpose.defaults.model}
            type="text"
            value={form.model}
          />

          <p
            className={cn(
              'mt-1.5 text-[11px]',
              isProviderUnknown
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-gray-500 dark:text-gray-400',
            )}
          >
            {isProviderUnknown
              ? t('aiSettings.provider.unknownHint')
              : t('aiSettings.provider.detectedHint', {
                  provider: t(`aiSettings.providers.${effectiveProvider ?? 'google'}`),
                })}
          </p>
        </div>

        <div className="sm:col-span-2">
          <span className={LABEL_CLASSES}>{t('aiSettings.fields.provider')}</span>
          <PremiumSelect
            onChange={(value) =>
              setForm((prev) => ({ ...prev, provider: value as AiProviderSelection }))
            }
            options={providerOptions}
            placeholder={t('aiSettings.providers.auto')}
            value={form.provider}
          />
          {isProviderLocked ? (
            <p className="mt-1.5 text-[11px] text-gray-500 dark:text-gray-400">
              {t('aiSettings.provider.lockedHint')}
            </p>
          ) : null}
        </div>

        {purpose.capabilities.maxOutputTokens ? (
          <div>
            <label className={LABEL_CLASSES} htmlFor={`tokens-${purpose.id}`}>
              {t('aiSettings.fields.maxOutputTokens')}
            </label>
            <input
              className={FIELD_CLASSES}
              id={`tokens-${purpose.id}`}
              max={AI_MODEL_SETTINGS_LIMITS.maxOutputTokens.max}
              min={AI_MODEL_SETTINGS_LIMITS.maxOutputTokens.min}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, maxOutputTokens: event.target.value }))
              }
              placeholder={t('aiSettings.fields.inheritedPlaceholder')}
              type="number"
              value={form.maxOutputTokens}
            />
          </div>
        ) : null}

        {purpose.capabilities.temperature ? (
          <div>
            <label className={LABEL_CLASSES} htmlFor={`temperature-${purpose.id}`}>
              {t('aiSettings.fields.temperature')}
            </label>
            <input
              className={FIELD_CLASSES}
              id={`temperature-${purpose.id}`}
              max={AI_MODEL_SETTINGS_LIMITS.temperature.max}
              min={AI_MODEL_SETTINGS_LIMITS.temperature.min}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, temperature: event.target.value }))
              }
              placeholder={t('aiSettings.fields.inheritedPlaceholder')}
              step="0.05"
              type="number"
              value={form.temperature}
            />
          </div>
        ) : null}

        {purpose.capabilities.thinkingLevel ? (
          <div className="sm:col-span-2">
            <span className={LABEL_CLASSES}>{t('aiSettings.fields.thinkingLevel')}</span>
            <PremiumSelect
              onChange={(value) =>
                setForm((prev) => ({ ...prev, thinkingLevel: value as AiThinkingLevel }))
              }
              options={thinkingOptions}
              placeholder={t('aiSettings.fields.thinkingLevel')}
              value={form.thinkingLevel}
            />
          </div>
        ) : null}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
        <button
          className={cn(
            'flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 transition-colors',
            'hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50',
            'dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5',
          )}
          disabled={isSaving || isInherited}
          onClick={() => onReset(purpose.id)}
          type="button"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {t('aiSettings.actions.reset')}
        </button>

        <button
          className={cn(
            'flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-xs font-medium text-white transition-colors',
            'hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50',
            'dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100',
          )}
          // Se bloquea el guardado cuando el proveedor no puede resolverse: la
          // API lo rechazaría igualmente, y avisar aquí evita el viaje de ida y
          // vuelta y un toast de error por una errata en el nombre del modelo.
          disabled={isSaving || !form.model.trim() || isProviderUnknown}
          onClick={() => onSave(purpose.id, form)}
          type="button"
        >
          <Save className="h-3.5 w-3.5" />
          {isSaving ? t('aiSettings.actions.saving') : t('aiSettings.actions.save')}
        </button>
      </div>
    </div>
  )
}
