import { NextResponse } from 'next/server'

import { getAllAiModelSettings } from '@/lib/ai/model-settings/ai-model-settings.server.service'
import {
  AI_MODEL_PURPOSES,
  getPurposeSupportedProviders,
} from '@/lib/ai/model-settings/purposes'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { logger } from '@/lib/utils/logger'

/**
 * Catálogo de propósitos de IA con su configuración efectiva.
 *
 * Devuelve tanto la definición estática (etiquetas, capacidades, valores por
 * defecto) como el valor resuelto, para que el panel pueda mostrar de qué origen
 * viene cada parámetro sin duplicar la lógica de precedencia en el cliente.
 *
 * Solo super-admin de plataforma (`requireAdmin`). Sin caché HTTP: es
 * configuración operativa y debe verse siempre al día.
 */
export async function GET() {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const settings = await getAllAiModelSettings()
    const settingsByPurpose = new Map(
      settings.map((item) => [item.purpose, item]),
    )

    const purposes = AI_MODEL_PURPOSES.map((purpose) => ({
      capabilities: purpose.capabilities,
      defaults: purpose.defaults,
      descriptionKey: purpose.descriptionKey,
      group: purpose.group,
      id: purpose.id,
      labelKey: purpose.labelKey,
      settings: settingsByPurpose.get(purpose.id) ?? null,
      supportedProviders: getPurposeSupportedProviders(purpose),
    }))

    return NextResponse.json(
      { purposes, success: true },
      { headers: { 'Cache-Control': 'private, no-store' } },
    )
  } catch (error) {
    logger.error('Admin AI settings GET failed', error)
    return NextResponse.json(
      { error: 'Error al cargar la configuración de modelos de IA', success: false },
      { status: 500 },
    )
  }
}
