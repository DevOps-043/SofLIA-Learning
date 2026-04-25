import { createAdminClient } from '../calendar.service'

const DEFAULT_TZ_OFFSET = '-06:00'
const DEFAULT_REBALANCE_HOURS = [8, 9, 10, 17, 18, 19, 20] as const
const MAX_LOOKAHEAD_DAYS = 21

type SupabaseAdminClient = ReturnType<typeof createAdminClient>

export type RebalanceSessionMove = {
  sessionId: string
  newStartTime: string
  newEndTime: string
}

type RebalanceCandidateResult =
  | { sessionsToMove: RebalanceSessionMove[] }
  | { error: string }

type RebalanceSourceSession = {
  duration_minutes: number | null
  end_time: string
  id: string
  start_time: string
}

export async function calculateRebalanceCandidates(params: {
  planId: string
  supabase: SupabaseAdminClient
  userId: string
}): Promise<RebalanceCandidateResult> {
  const now = new Date()
  const { data: sessions, error } = await params.supabase
    .from('study_sessions')
    .select('id, start_time, end_time, duration_minutes')
    .eq('plan_id', params.planId)
    .eq('user_id', params.userId)
    .in('status', ['planned', 'missed'])
    .lt('end_time', now.toISOString())
    .order('start_time', { ascending: true })

  if (error || !sessions?.length) {
    return { error: 'No encontré sesiones atrasadas para redistribuir.' }
  }

  const sessionsToMove = buildSequentialRebalanceMoves(
    sessions as RebalanceSourceSession[],
    now,
  )

  if (!sessionsToMove.length) {
    return { error: 'No pude calcular nuevos horarios seguros para las sesiones atrasadas.' }
  }

  return { sessionsToMove }
}

function buildSequentialRebalanceMoves(
  sessions: RebalanceSourceSession[],
  now: Date,
): RebalanceSessionMove[] {
  const moves: RebalanceSessionMove[] = []
  let dayOffset = 0
  let hourIndex = 0

  for (const session of sessions) {
    const start = resolveNextCandidateStart(now, dayOffset, hourIndex)
    if (!start) {
      break
    }

    dayOffset = start.dayOffset
    hourIndex = start.hourIndex + 1
    if (hourIndex >= DEFAULT_REBALANCE_HOURS.length) {
      hourIndex = 0
      dayOffset += 1
    }

    const durationMinutes = session.duration_minutes || 30
    const end = new Date(start.date.getTime() + durationMinutes * 60 * 1000)
    moves.push({
      sessionId: session.id,
      newStartTime: formatWithDefaultOffset(start.date),
      newEndTime: formatWithDefaultOffset(end),
    })
  }

  return moves
}

function resolveNextCandidateStart(
  now: Date,
  initialDayOffset: number,
  initialHourIndex: number,
): { date: Date; dayOffset: number; hourIndex: number } | null {
  for (let dayOffset = initialDayOffset; dayOffset < MAX_LOOKAHEAD_DAYS; dayOffset += 1) {
    const startHourIndex = dayOffset === initialDayOffset ? initialHourIndex : 0

    for (let hourIndex = startHourIndex; hourIndex < DEFAULT_REBALANCE_HOURS.length; hourIndex += 1) {
      const candidate = new Date(now)
      candidate.setDate(candidate.getDate() + dayOffset)
      candidate.setHours(DEFAULT_REBALANCE_HOURS[hourIndex], 0, 0, 0)

      if (candidate > now) {
        return { date: candidate, dayOffset, hourIndex }
      }
    }
  }

  return null
}

function formatWithDefaultOffset(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day}T${hours}:${minutes}:00${DEFAULT_TZ_OFFSET}`
}
