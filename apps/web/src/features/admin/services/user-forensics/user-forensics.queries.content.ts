import { fromLoose } from '@/lib/supabase/looseQuery'

import { DOMAIN_ROW_LIMIT } from './user-forensics.queries'
import type { ForensicEvent, ForensicNote } from './user-forensics.types'

/**
 * Consultas forenses "de contenido": lo que el usuario efectivamente hizo/escribió y
 * señales de conducta (velocidad de video, video sin ver, notas, certificados, chat con
 * LIA). Devuelven eventos para la línea de tiempo Y filas crudas para los agregados.
 */

type LooseClient = unknown

function toIso(value: unknown): string | null {
  if (typeof value !== 'string' || value.length === 0) return null
  const ms = Date.parse(value)
  return Number.isNaN(ms) ? null : new Date(ms).toISOString()
}

function num(value: unknown): number | null {
  if (value === null || value === undefined) return null
  const n = Number(value)
  return Number.isNaN(n) ? null : n
}

// Umbral desde el cual consideramos el video "acelerado" (2x es claramente trampa;
// 1.75 deja margen a lecturas de reproductor imprecisas).
export const VIDEO_SPED_UP_RATE = 1.75
// Bajo este % de video visto lo consideramos "prácticamente no visto".
export const VIDEO_BARELY_WATCHED_PCT = 0.1
// Sobre este % lo consideramos "visto completo".
export const VIDEO_WATCHED_FULL_PCT = 0.9

// ---------------------------------------------------------------------------
// Actividades de diálogo SofLIA DISPONIBLES en los cursos del usuario
// ---------------------------------------------------------------------------

/**
 * Cuenta cuántas actividades de diálogo SofLIA EXISTEN en los cursos en los que el
 * usuario está inscrito (el denominador). Sirve para contrastar "diálogos hechos vs.
 * disponibles": si completó los cursos pero hizo muy pocos diálogos, evidencia que los
 * saltó. Recorre inscripciones → módulos → lecciones → actividades.
 */
export async function fetchAvailableDialogueCount(
  supabase: LooseClient,
  userId: string,
): Promise<number> {
  const { data: enrollments } = await fromLoose<{ course_id: string | null }>(
    supabase,
    'user_course_enrollments',
  )
    .select('course_id')
    .eq('user_id', userId)
    .limit(DOMAIN_ROW_LIMIT)
  const courseIds = [...new Set((enrollments ?? []).map((row) => row.course_id).filter(Boolean))] as string[]
  if (courseIds.length === 0) return 0

  const { data: modules } = await fromLoose<{ module_id: string }>(supabase, 'course_modules')
    .select('module_id')
    .in('course_id', courseIds)
    .limit(2000)
  const moduleIds = (modules ?? []).map((row) => row.module_id).filter(Boolean)
  if (moduleIds.length === 0) return 0

  const { data: lessons } = await fromLoose<{ lesson_id: string }>(supabase, 'course_lessons')
    .select('lesson_id')
    .in('module_id', moduleIds)
    .limit(5000)
  const lessonIds = (lessons ?? []).map((row) => row.lesson_id).filter(Boolean)
  if (lessonIds.length === 0) return 0

  const { data: activities } = await fromLoose<{
    activity_config: { interactionType?: string } | null
    requires_soflia_validation: boolean | null
  }>(supabase, 'lesson_activities')
    .select('activity_config, requires_soflia_validation')
    .in('lesson_id', lessonIds)
    .limit(10000)

  return (activities ?? []).filter(
    (row) =>
      row.requires_soflia_validation === true ||
      row.activity_config?.interactionType === 'soflia_dialogue',
  ).length
}

// ---------------------------------------------------------------------------
// IPs de acceso desde TODAS las fuentes (para no mostrar "0 IPs")
// ---------------------------------------------------------------------------

/**
 * Reúne las IPs distintas del usuario desde fuentes adicionales a las sesiones de login
 * (`user_activity_log` y `lia_conversations`). Muchos usuarios no tienen filas en
 * `refresh_tokens`/`user_session` (p.ej. sesión nativa persistente), pero sí dejan su IP
 * al navegar o al chatear con LIA — así el panel deja de mostrar "0 IPs".
 */
export async function fetchAccessIps(supabase: LooseClient, userId: string): Promise<string[]> {
  const [activityRes, liaRes] = await Promise.all([
    fromLoose<{ ip_address: string | null }>(supabase, 'user_activity_log')
      .select('ip_address')
      .eq('user_id', userId)
      .limit(DOMAIN_ROW_LIMIT),
    fromLoose<{ ip_address: string | null }>(supabase, 'lia_conversations')
      .select('ip_address')
      .eq('user_id', userId)
      .limit(DOMAIN_ROW_LIMIT),
  ])

  const ips = new Set<string>()
  for (const row of [...(activityRes.data ?? []), ...(liaRes.data ?? [])]) {
    if (row.ip_address) ips.add(String(row.ip_address))
  }
  return [...ips]
}

// ---------------------------------------------------------------------------
// Video / seguimiento de lección (lesson_tracking)
// ---------------------------------------------------------------------------

export interface VideoTrackingStat {
  lessonId: string | null
  hasProgress: boolean
  watchedPct: number | null
  playbackRate: number | null
  spedUp: boolean
  barelyWatched: boolean
  watchedFull: boolean
  videoMinutes: number | null
}

interface LessonTrackingRow {
  id: string
  lesson_id: string | null
  video_started_at: string | null
  video_ended_at: string | null
  video_max_seconds: number | null
  video_total_duration_seconds: number | null
  video_playback_rate: number | null
  t_video_minutes: number | null
  created_at: string | null
}

export interface VideoTrackingResult {
  events: ForensicEvent[]
  stats: VideoTrackingStat[]
  truncated: boolean
}

export async function fetchVideoTracking(
  supabase: LooseClient,
  userId: string,
): Promise<VideoTrackingResult> {
  const { data, error } = await fromLoose<LessonTrackingRow>(supabase, 'lesson_tracking')
    .select(
      'id, lesson_id, video_started_at, video_ended_at, video_max_seconds, video_total_duration_seconds, video_playback_rate, t_video_minutes, created_at',
    )
    .eq('user_id', userId)
    .order('video_started_at', { ascending: false })
    .limit(DOMAIN_ROW_LIMIT)

  if (error || !data) return { events: [], stats: [], truncated: false }

  const events: ForensicEvent[] = []
  const stats: VideoTrackingStat[] = []

  for (const row of data) {
    const maxSeconds = num(row.video_max_seconds) ?? 0
    const totalSeconds = num(row.video_total_duration_seconds) ?? 0
    const playbackRate = num(row.video_playback_rate)
    const startedAt = toIso(row.video_started_at)
    const hasProgress = maxSeconds > 0 || startedAt !== null
    const watchedPct = totalSeconds > 0 ? Math.min(1, maxSeconds / totalSeconds) : null
    const spedUp = (playbackRate ?? 1) >= VIDEO_SPED_UP_RATE
    // "Casi sin ver" SOLO si el alumno realmente reprodujo algo (maxSeconds > 0). Un
    // video nunca iniciado (max = 0) es "no iniciado", no "casi sin ver" — antes esto
    // marcaba falsamente ~1 video por usuario (la lección abierta pero sin reproducir).
    const barelyWatched =
      maxSeconds > 0 && watchedPct !== null && watchedPct < VIDEO_BARELY_WATCHED_PCT
    const watchedFull = watchedPct !== null && watchedPct >= VIDEO_WATCHED_FULL_PCT
    // `t_video_minutes` casi nunca está poblado; se deriva de la posición máxima
    // alcanzada (video_max_seconds) para no mostrar siempre "0 min".
    const trackedMinutes = num(row.t_video_minutes)
    const videoMinutes =
      trackedMinutes && trackedMinutes > 0 ? trackedMinutes : maxSeconds > 0 ? maxSeconds / 60 : null

    stats.push({
      lessonId: row.lesson_id,
      hasProgress,
      watchedPct,
      playbackRate,
      spedUp,
      barelyWatched,
      watchedFull,
      videoMinutes,
    })

    if (!hasProgress) continue

    const pctLabel = watchedPct === null ? '—' : `${Math.round(watchedPct * 100)}%`
    const rateLabel = playbackRate ? `${playbackRate}x` : '1x'
    const badges: string[] = []
    if (spedUp) badges.push('⚠ acelerado')
    if (barelyWatched) badges.push('⚠ casi sin ver')
    events.push({
      id: `video:${row.id}`,
      type: 'video_watched',
      atUtc: startedAt ?? (toIso(row.created_at) as string),
      title: 'Video de lección',
      detail: `Visto ${pctLabel} · velocidad ${rateLabel} · ${Math.round(videoMinutes ?? 0)} min${
        badges.length ? ` · ${badges.join(' · ')}` : ''
      }`,
      refIds: { lessonId: row.lesson_id },
      meta: { watchedPct, playbackRate, spedUp, barelyWatched },
    })
  }

  return { events, stats, truncated: data.length >= DOMAIN_ROW_LIMIT }
}

// ---------------------------------------------------------------------------
// Notas (user_lesson_notes)
// ---------------------------------------------------------------------------

interface NoteRow {
  note_id: string
  note_title: string | null
  note_content: string | null
  is_auto_generated: boolean | null
  is_user_edited: boolean | null
  lesson_id: string | null
  created_at: string | null
  updated_at: string | null
}

export interface NotesResult {
  events: ForensicEvent[]
  notes: ForensicNote[]
  truncated: boolean
}

export async function fetchNotes(supabase: LooseClient, userId: string): Promise<NotesResult> {
  const { data, error } = await fromLoose<NoteRow>(supabase, 'user_lesson_notes')
    .select(
      'note_id, note_title, note_content, is_auto_generated, is_user_edited, lesson_id, created_at, updated_at',
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(DOMAIN_ROW_LIMIT)

  if (error || !data) return { events: [], notes: [], truncated: false }

  const notes: ForensicNote[] = data.map((row) => ({
    id: row.note_id,
    title: row.note_title ?? '',
    content: row.note_content ?? '',
    isAutoGenerated: Boolean(row.is_auto_generated),
    isUserEdited: Boolean(row.is_user_edited),
    lessonId: row.lesson_id,
    createdAtUtc: toIso(row.created_at),
    updatedAtUtc: toIso(row.updated_at),
  }))

  const events: ForensicEvent[] = notes
    .filter((note) => note.createdAtUtc)
    .map((note) => ({
      id: `note:${note.id}`,
      type: 'note_created' as const,
      atUtc: note.createdAtUtc as string,
      title: note.isAutoGenerated ? 'Nota automática' : 'Nota del alumno',
      detail: note.title || note.content.slice(0, 80),
      refIds: { lessonId: note.lessonId, noteId: note.id },
    }))

  return { events, notes, truncated: data.length >= DOMAIN_ROW_LIMIT }
}

// ---------------------------------------------------------------------------
// Certificados (user_course_certificates)
// ---------------------------------------------------------------------------

interface CertificateRow {
  certificate_id: string
  course_id: string | null
  issued_at: string | null
}

export interface CertificatesResult {
  events: ForensicEvent[]
  count: number
  lastIssuedAtUtc: string | null
  truncated: boolean
}

export async function fetchCertificateEvents(
  supabase: LooseClient,
  userId: string,
): Promise<CertificatesResult> {
  const { data, error } = await fromLoose<CertificateRow>(supabase, 'user_course_certificates')
    .select('certificate_id, course_id, issued_at')
    .eq('user_id', userId)
    .order('issued_at', { ascending: false })
    .limit(DOMAIN_ROW_LIMIT)

  if (error || !data) return { events: [], count: 0, lastIssuedAtUtc: null, truncated: false }

  const events: ForensicEvent[] = data.flatMap((row): ForensicEvent[] => {
    const at = toIso(row.issued_at)
    if (!at) return []
    return [
      {
        id: `cert:${row.certificate_id}`,
        type: 'certificate_issued',
        atUtc: at,
        title: 'Certificado emitido',
        detail: null,
        refIds: { courseId: row.course_id },
      },
    ]
  })

  return {
    events,
    count: events.length,
    lastIssuedAtUtc: events[0]?.atUtc ?? null,
    truncated: data.length >= DOMAIN_ROW_LIMIT,
  }
}

// ---------------------------------------------------------------------------
// Conversaciones con LIA (lia_conversations)
// ---------------------------------------------------------------------------

interface LiaConversationRow {
  conversation_id: string
  context_type: string | null
  lesson_id: string | null
  total_messages: number | null
  total_user_messages: number | null
  user_abandoned: boolean | null
  started_at: string | null
  duration_seconds: number | null
}

export interface LiaResult {
  events: ForensicEvent[]
  conversations: number
  abandoned: number
  totalMessages: number
  truncated: boolean
}

export async function fetchLiaConversationEvents(
  supabase: LooseClient,
  userId: string,
): Promise<LiaResult> {
  const { data, error } = await fromLoose<LiaConversationRow>(supabase, 'lia_conversations')
    .select(
      'conversation_id, context_type, lesson_id, total_messages, total_user_messages, user_abandoned, started_at, duration_seconds',
    )
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(DOMAIN_ROW_LIMIT)

  if (error || !data) {
    return { events: [], conversations: 0, abandoned: 0, totalMessages: 0, truncated: false }
  }

  let totalMessages = 0
  let abandoned = 0
  const events: ForensicEvent[] = []

  for (const row of data) {
    totalMessages += num(row.total_messages) ?? 0
    if (row.user_abandoned) abandoned += 1
    const at = toIso(row.started_at)
    if (!at) continue
    events.push({
      id: `lia:${row.conversation_id}`,
      type: 'lia_conversation',
      atUtc: at,
      title: 'Conversación con LIA',
      detail: `${num(row.total_user_messages) ?? 0} mensajes del alumno · ${num(row.total_messages) ?? 0} totales${
        row.user_abandoned ? ' · abandonada' : ''
      }`,
      refIds: { lessonId: row.lesson_id, conversationId: row.conversation_id },
    })
  }

  return {
    events,
    conversations: data.length,
    abandoned,
    totalMessages,
    truncated: data.length >= DOMAIN_ROW_LIMIT,
  }
}
