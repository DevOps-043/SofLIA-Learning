'use client'

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { ToastNotification } from '@/core/components/ToastNotification/ToastNotification'

import { PurposeSettingsCard } from './PurposeSettingsCard'
import {
  buildUpdatePayload,
  useAdminAiSettingsLogic,
} from './hooks/useAdminAiSettingsLogic'
import { PURPOSE_GROUP_ORDER, type AdminAiPurpose, type PurposeFormState } from './types'

export function AdminAiSettingsPage() {
  const { t } = useTranslation('admin')
  const logic = useAdminAiSettingsLogic()

  const purposesByGroup = useMemo(() => {
    const grouped = new Map<string, AdminAiPurpose[]>()
    for (const purpose of logic.purposes) {
      const existing = grouped.get(purpose.group)
      if (existing) {
        existing.push(purpose)
      } else {
        grouped.set(purpose.group, [purpose])
      }
    }
    return grouped
  }, [logic.purposes])

  const handleSave = async (purposeId: string, form: PurposeFormState) => {
    const purpose = logic.purposes.find((item) => item.id === purposeId)
    if (!purpose) return

    const result = await logic.savePurpose(
      purposeId,
      buildUpdatePayload(form, purpose.capabilities),
    )

    if (!result.ok) {
      logic.showToast(result.errorMessage || t('aiSettings.feedback.saveError'), 'error')
      return
    }

    // Guardado sin poder confirmar el modelo: se avisa como información, no como
    // éxito a secas, para que nadie lea "guardado" como "verificado".
    logic.showToast(
      result.warning ?? t('aiSettings.feedback.saved'),
      result.warning ? 'info' : 'success',
    )
  }

  const handleReset = async (purposeId: string) => {
    const result = await logic.resetPurpose(purposeId)

    logic.showToast(
      result.ok
        ? t('aiSettings.feedback.reset')
        : result.errorMessage || t('aiSettings.feedback.resetError'),
      result.ok ? 'success' : 'error',
    )
  }

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <header>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('aiSettings.title')}
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-gray-600 dark:text-gray-400">
            {t('aiSettings.subtitle')}
          </p>
          <p className="mt-2 max-w-3xl text-xs text-gray-500 dark:text-gray-500">
            {t('aiSettings.propagationNotice')}
          </p>
        </header>

        {logic.error ? (
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600 dark:border-white/10 dark:bg-gray-800 dark:text-gray-400">
            {t('aiSettings.loadError')}
          </div>
        ) : null}

        {logic.isLoading ? (
          <div className="space-y-4" aria-hidden>
            <div className="h-40 animate-pulse rounded-xl bg-gray-200 dark:bg-white/10" />
            <div className="h-40 animate-pulse rounded-xl bg-gray-200 dark:bg-white/10" />
          </div>
        ) : null}

        {PURPOSE_GROUP_ORDER.map((group) => {
          const purposes = purposesByGroup.get(group)
          if (!purposes || purposes.length === 0) return null

          return (
            <section key={group} className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {t(`aiSettings.groups.${group}`)}
              </h2>

              <div className="space-y-4">
                {purposes.map((purpose) => (
                  <PurposeSettingsCard
                    isSaving={logic.savingPurposeId === purpose.id}
                    key={purpose.id}
                    onReset={handleReset}
                    onSave={handleSave}
                    purpose={purpose}
                  />
                ))}
              </div>
            </section>
          )
        })}
      </div>

      <ToastNotification
        isOpen={logic.toast.isOpen}
        message={logic.toast.message}
        onClose={logic.hideToast}
        position="top-right"
        type={logic.toast.type}
      />
    </div>
  )
}
