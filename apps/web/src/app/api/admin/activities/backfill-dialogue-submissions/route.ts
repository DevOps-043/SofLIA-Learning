import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { logger } from '@/lib/utils/logger'
import { createBusinessUsersAdminClient } from '@/features/business-panel/services/business-users-server/client'
import { backfillDialogueSubmissions } from '@/features/admin/services/admin-activities/backfill-dialogue-submissions.service'

/**
 * Backfill admin de `user_activity_submissions` desde `soflia_dialogue_results`
 * históricos (actividades de "Conversación guiada con SofLIA"). Solo superadmin.
 *
 * Body: { userId?: uuid, dryRun?: boolean (default true), limit?: number }.
 * `dryRun` por defecto: primero reporta cuántas se crearían; pasar `dryRun:false`
 * para aplicar. Idempotente (solo crea faltantes; respeta el unique por actividad).
 */
const bodySchema = z.object({
  userId: z.string().uuid().optional(),
  dryRun: z.boolean().optional().default(true),
  limit: z.number().int().positive().max(20000).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const json = await request.json().catch(() => ({}))
    const parsed = bodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Parámetros inválidos' }, { status: 400 })
    }

    const client = createBusinessUsersAdminClient()
    const result = await backfillDialogueSubmissions({
      client,
      userId: parsed.data.userId ?? null,
      dryRun: parsed.data.dryRun,
      limit: parsed.data.limit,
    })

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    logger.error('Backfill dialogue submissions failed', error)
    return NextResponse.json({ success: false, error: 'Error en el backfill' }, { status: 500 })
  }
}
