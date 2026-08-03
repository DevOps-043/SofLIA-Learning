'use client'

import { useCallback, useState } from 'react'
import useSWR from 'swr'

import type { ToastType } from '@/core/components/ToastNotification/ToastNotification'
import type { AiModelSettingsUpdateInput } from '@/lib/ai/model-settings'

import type { AdminAiSettingsResponse, PurposeFormState } from '../types'

const SETTINGS_ENDPOINT = '/api/admin/ai-settings'

async function fetchAiSettings(url: string): Promise<AdminAiSettingsResponse> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('ADMIN_AI_SETTINGS_FETCH_FAILED')
  }
  return response.json()
}

export interface SavePurposeResult {
  errorMessage?: string
  ok: boolean
  /** Se guardó, pero el modelo no pudo verificarse contra el proveedor. */
  warning?: string
}

/**
 * Estado y mutaciones del panel de configuración de modelos de IA.
 *
 * Tras cada mutación se revalida en silencio (`mutate` sin estado de carga) para
 * no provocar el parpadeo de esqueleto de página completa; el feedback va por
 * toast, según el estándar de los paneles.
 */
export function useAdminAiSettingsLogic() {
  const { data, error, isLoading, mutate } = useSWR<AdminAiSettingsResponse>(
    SETTINGS_ENDPOINT,
    fetchAiSettings,
    { revalidateOnFocus: false },
  )

  const [savingPurposeId, setSavingPurposeId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: ToastType }>({
    isOpen: false,
    message: '',
    type: 'success',
  })

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    setToast({ isOpen: true, message, type })
  }, [])

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, isOpen: false }))
  }, [])

  /**
   * Cuando la API rechaza un modelo inexistente devuelve además los nombres
   * parecidos del catálogo del proveedor. Adjuntarlos al mensaje convierte
   * "ese modelo no existe" en algo accionable sin salir del panel.
   */
  const readErrorMessage = useCallback(async (response: Response): Promise<string | undefined> => {
    try {
      const body = (await response.json()) as { error?: string; suggestions?: string[] }
      if (!body.error) return undefined

      return body.suggestions?.length
        ? `${body.error} ¿Quisiste decir: ${body.suggestions.join(', ')}?`
        : body.error
    } catch {
      return undefined
    }
  }, [])

  const savePurpose = useCallback(
    async (
      purposeId: string,
      update: AiModelSettingsUpdateInput,
    ): Promise<SavePurposeResult> => {
      setSavingPurposeId(purposeId)
      try {
        const response = await fetch(`${SETTINGS_ENDPOINT}/${purposeId}`, {
          body: JSON.stringify(update),
          headers: { 'Content-Type': 'application/json' },
          method: 'PUT',
        })

        if (!response.ok) {
          return { errorMessage: await readErrorMessage(response), ok: false }
        }

        // El guardado se acepta aunque no se haya podido verificar el modelo,
        // pero el administrador debe saberlo: dar por confirmado lo que nadie
        // comprobó es como no tener validación.
        const body = (await response.json().catch(() => ({}))) as { warning?: string }

        await mutate()
        return { ok: true, ...(body.warning ? { warning: body.warning } : {}) }
      } catch {
        return { ok: false }
      } finally {
        setSavingPurposeId(null)
      }
    },
    [mutate, readErrorMessage],
  )

  const resetPurpose = useCallback(
    async (purposeId: string): Promise<SavePurposeResult> => {
      setSavingPurposeId(purposeId)
      try {
        const response = await fetch(`${SETTINGS_ENDPOINT}/${purposeId}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          return { errorMessage: await readErrorMessage(response), ok: false }
        }

        await mutate()
        return { ok: true }
      } catch {
        return { ok: false }
      } finally {
        setSavingPurposeId(null)
      }
    },
    [mutate, readErrorMessage],
  )

  return {
    error,
    hideToast,
    isLoading,
    purposes: data?.purposes ?? [],
    resetPurpose,
    savePurpose,
    savingPurposeId,
    showToast,
    toast,
  }
}

/**
 * Traduce el estado del formulario al cuerpo del PUT.
 *
 * Un campo numérico vacío se envía como `null` (= "heredar el default del
 * propósito"), no como 0, y los parámetros que el propósito no admite se omiten
 * para que la API los rechace si alguna vez llegaran por error.
 */
export function buildUpdatePayload(
  form: PurposeFormState,
  capabilities: { maxOutputTokens: boolean; temperature: boolean; thinkingLevel: boolean },
): AiModelSettingsUpdateInput {
  const parseOptionalNumber = (rawValue: string): number | null => {
    const trimmed = rawValue.trim()
    if (!trimmed) return null

    const parsed = Number(trimmed)
    return Number.isFinite(parsed) ? parsed : null
  }

  return {
    model: form.model.trim(),
    provider: form.provider,
    ...(capabilities.maxOutputTokens
      ? { maxOutputTokens: parseOptionalNumber(form.maxOutputTokens) }
      : {}),
    ...(capabilities.temperature
      ? { temperature: parseOptionalNumber(form.temperature) }
      : {}),
    ...(capabilities.thinkingLevel ? { thinkingLevel: form.thinkingLevel } : {}),
  }
}
