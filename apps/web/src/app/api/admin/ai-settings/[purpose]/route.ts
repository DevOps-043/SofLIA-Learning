import { NextResponse } from 'next/server'

import {
  getAiModelSettings,
  resetAiModelSettings,
  upsertAiModelSettings,
} from '@/lib/ai/model-settings/ai-model-settings.server.service'
import { isAiModelPurposeId } from '@/lib/ai/model-settings/purposes'
import {
  UnresolvableAiProviderError,
  UnsupportedAiCapabilityError,
  aiModelSettingsUpdateSchema,
  assertProviderIsResolvable,
  assertUpdateMatchesCapabilities,
} from '@/lib/ai/model-settings/validation'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { logger } from '@/lib/utils/logger'

interface RouteContext {
  params: Promise<{ purpose: string }>
}

/**
 * Actualiza la configuración de un propósito de IA.
 *
 * Idempotente: enviar el mismo cuerpo dos veces deja el mismo estado. Los campos
 * omitidos conservan su valor efectivo actual, de modo que el panel puede enviar
 * cambios parciales sin arrastrar el resto de la configuración.
 *
 * Solo super-admin. La escritura queda auditada por trigger en la base de datos
 * junto con el identificador del actor.
 */
export async function PUT(request: Request, { params }: RouteContext) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { purpose } = await params
    if (!isAiModelPurposeId(purpose)) {
      return NextResponse.json(
        { error: 'Propósito de IA desconocido', success: false },
        { status: 404 },
      )
    }

    let rawBody: unknown
    try {
      rawBody = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Cuerpo de la petición inválido', success: false },
        { status: 400 },
      )
    }

    const parsed = aiModelSettingsUpdateSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json(
        {
          details: parsed.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
          error: 'Configuración inválida',
          success: false,
        },
        { status: 400 },
      )
    }

    assertUpdateMatchesCapabilities(purpose, parsed.data)

    // El proveedor se valida contra la configuración vigente porque el panel
    // puede enviar solo el modelo o solo el proveedor: lo que debe ser
    // ejecutable es la combinación resultante, no el campo aislado.
    const current = await getAiModelSettings(purpose)
    const resolvedProvider = assertProviderIsResolvable({
      currentModel: current.model,
      currentProviderSelection: current.providerSelection,
      purposeId: purpose,
      update: parsed.data,
    })

    const settings = await upsertAiModelSettings({
      actorId: auth.userId,
      purposeId: purpose,
      update: parsed.data,
    })

    logger.info('Configuración de modelo de IA actualizada', {
      actorId: auth.userId,
      model: settings.model,
      provider: resolvedProvider,
      purpose,
    })

    return NextResponse.json({ settings, success: true })
  } catch (error) {
    if (
      error instanceof UnsupportedAiCapabilityError ||
      error instanceof UnresolvableAiProviderError
    ) {
      return NextResponse.json(
        { error: error.message, success: false },
        { status: 400 },
      )
    }

    logger.error('Admin AI settings PUT failed', error)
    return NextResponse.json(
      { error: 'Error al guardar la configuración', success: false },
      { status: 500 },
    )
  }
}

/**
 * Restablece el propósito a su valor heredado (entorno → default de código)
 * eliminando el override. Idempotente: borrar dos veces no es un error.
 */
export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { purpose } = await params
    if (!isAiModelPurposeId(purpose)) {
      return NextResponse.json(
        { error: 'Propósito de IA desconocido', success: false },
        { status: 404 },
      )
    }

    const settings = await resetAiModelSettings({
      actorId: auth.userId,
      purposeId: purpose,
    })

    logger.info('Configuración de modelo de IA restablecida', {
      actorId: auth.userId,
      purpose,
    })

    return NextResponse.json({ settings, success: true })
  } catch (error) {
    logger.error('Admin AI settings DELETE failed', error)
    return NextResponse.json(
      { error: 'Error al restablecer la configuración', success: false },
      { status: 500 },
    )
  }
}
