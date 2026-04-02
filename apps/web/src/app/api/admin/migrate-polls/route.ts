import { NextResponse } from 'next/server'
import { requireAdmin } from '../../../../lib/auth/requireAdmin'
import { createClient } from '../../../../lib/supabase/server'
import { fromLoose } from '../../../../lib/supabase/looseQuery'
import { logger } from '../../../../lib/utils/logger'

export const dynamic = 'force-dynamic'

/**
 * Endpoint para migrar encuestas antiguas sin estructura votes/userVotes.
 * Debe ejecutarse una sola vez para corregir datos existentes.
 */

interface PollAttachmentData {
  options?: string[]
  votes?: Record<string, string[]>
  userVotes?: Record<string, string | string[]>
  [key: string]: unknown
}

interface CommunityPollRow {
  attachment_data: PollAttachmentData | null
  content?: string | null
  id: string
}

interface CommunityPollUpdateRow {
  attachment_data: PollAttachmentData
  updated_at: string
}

function communityPollsTable(client: unknown) {
  return fromLoose<CommunityPollRow, CommunityPollUpdateRow>(
    client,
    'community_posts',
  )
}

function hasVoteMap(pollData: PollAttachmentData) {
  return typeof pollData.votes === 'object' && pollData.votes !== null
}

export async function GET() {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const supabase = await createClient()

    logger.log('[POLL MIGRATION] Iniciando migracion de encuestas...')

    const { data: polls, error: pollsError } = await communityPollsTable(
      supabase,
    )
      .select('id, attachment_data, content')
      .eq('attachment_type', 'poll')

    if (pollsError) {
      logger.error('Error obteniendo encuestas:', pollsError)
      return NextResponse.json(
        { error: 'Error obteniendo encuestas' },
        { status: 500 },
      )
    }

    if (!polls || polls.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay encuestas para migrar',
        migrated: 0,
      })
    }

    logger.log(`[POLL MIGRATION] Encontradas ${polls.length} encuestas`)

    let migratedCount = 0
    const errors: string[] = []

    for (const poll of polls) {
      try {
        const pollData = poll.attachment_data

        if (!pollData || typeof pollData !== 'object') {
          logger.warn(
            `[POLL MIGRATION] Encuesta ${poll.id} sin attachment_data valido`,
          )
          errors.push(`Poll ${poll.id}: attachment_data invalido`)
          continue
        }

        if (hasVoteMap(pollData)) {
          logger.log(
            `[POLL MIGRATION] Encuesta ${poll.id} ya tiene estructura correcta`,
          )
          continue
        }

        logger.log(`[POLL MIGRATION] Migrando encuesta ${poll.id}...`)

        if (!pollData.options || !Array.isArray(pollData.options)) {
          logger.warn(
            `[POLL MIGRATION] Encuesta ${poll.id} no tiene options validas`,
          )
          errors.push(`Poll ${poll.id}: No options array`)
          continue
        }

        const votes: Record<string, string[]> = {}
        pollData.options.forEach((option) => {
          votes[option] = []
        })

        const updatedPollData = {
          ...pollData,
          votes,
          userVotes: pollData.userVotes || {},
        }

        const { error: updateError } = await communityPollsTable(supabase)
          .update({
            attachment_data: updatedPollData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', poll.id)

        if (updateError) {
          logger.error(
            `[POLL MIGRATION] Error actualizando ${poll.id}:`,
            updateError,
          )
          errors.push(`Poll ${poll.id}: ${updateError.message}`)
          continue
        }

        migratedCount++
        logger.log(`[POLL MIGRATION] Encuesta ${poll.id} migrada exitosamente`)
      } catch (error) {
        logger.error(`[POLL MIGRATION] Error procesando poll ${poll.id}:`, error)
        errors.push(
          `Poll ${poll.id}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        )
      }
    }

    logger.log(
      `[POLL MIGRATION] Migracion completa: ${migratedCount}/${polls.length} encuestas migradas`,
    )

    return NextResponse.json({
      success: true,
      message: 'Migracion completada',
      total: polls.length,
      migrated: migratedCount,
      alreadyCorrect: polls.length - migratedCount - errors.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    logger.error('[POLL MIGRATION] Error en migracion:', error)
    return NextResponse.json(
      {
        error: 'Error en migracion',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
