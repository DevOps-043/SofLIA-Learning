import { logger as techDebtLogger } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { fromLoose } from '@/lib/supabase/looseQuery'

interface StudentUserSummary {
  id: string
  username: string | null
  email: string | null
  display_name: string | null
  profile_picture?: string | null
  profile_picture_url?: string | null
}

interface StudentEnrollment {
  enrollment_id?: string | null
  overall_progress_percentage?: number | null
  progress_percentage?: number | null
  enrollment_status?: string | null
  enrolled_at?: string | null
  last_accessed_at?: string | null
  users?: StudentUserSummary | null
}

interface LiaConversationRow {
  conversation_id: string
  created_at: string
  context_type: string | null
  course_id?: string | null
  lesson_id?: string | null
  activity_id?: string | null
}

interface LiaMessageRow {
  message_id: string
  conversation_id: string
  created_at: string
  sender: string | null
  role: string | null
}

interface LiaFeedbackRow {
  feedback_id: string
  conversation_id: string
  rating: number | null
  feedback_type: string | null
}

interface ModuleProgressRow {
  course_modules?: {
    module_id: string
    module_title: string | null
    module_order: number | null
  } | null
}

interface CompletedActivityRow {
  activity_id: string
  completed_at: string | null
  time_spent_seconds: number | null
}

interface LessonProgressRow {
  lesson_id: string
  completed_at: string | null
  time_spent_seconds: number | null
  time_spent_minutes: number | null
}

interface UserNoteRow {
  note_id: string
  created_at: string | null
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> | { id: string; userId: string } }
) {
  try {
    // Verificar autenticación y permisos de admin
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const supabase = await createClient()
    
    // En Next.js 15, params puede ser una Promise
    const resolvedParams = await Promise.resolve(params)
    const courseId = resolvedParams.id
    const userId = resolvedParams.userId

    // Verificar que los parámetros estén presentes
    if (!courseId || !userId) {
      techDebtLogger.error('[Student Details API] Missing parameters:', { courseId, userId })
      return NextResponse.json({ error: 'Parámetros faltantes', details: { courseId, userId } }, { status: 400 })
    }


    // 1. Obtener información básica del estudiante y su inscripción
    // Intentar primero con user_course_enrollments (vista/tabla principal)
    let enrollment: StudentEnrollment | null = null
    
    const { data: enrollmentData, error: enrollmentErr } = await fromLoose<StudentEnrollment>(
      supabase,
      'user_course_enrollments'
    )
      .select(`
        enrollment_id,
        overall_progress_percentage,
        progress_percentage,
        enrollment_status,
        enrolled_at,
        last_accessed_at,
        users:user_id (
          id,
          username,
          email,
          display_name,
          profile_picture_url
        )
      `)
      .eq('course_id', courseId)
      .eq('user_id', userId)
      .single()

    if (enrollmentErr || !enrollmentData) {
      // Si falla, intentar con course_enrollments como fallback
      const { data: enrollmentData2, error: enrollmentErr2 } = await fromLoose<StudentEnrollment>(
        supabase,
        'course_enrollments'
      )
        .select(`
          *,
          users:user_id (
            id,
            username,
            email,
            display_name,
            profile_picture
          )
        `)
        .eq('course_id', courseId)
        .eq('user_id', userId)
        .single()
      
      if (enrollmentErr2 || !enrollmentData2) {
        techDebtLogger.error('[Student Details API] Enrollment not found:', {
          courseId, 
          userId, 
          error1: enrollmentErr?.message, 
          error2: enrollmentErr2?.message 
        })
        return NextResponse.json({ 
          error: 'Inscripción no encontrada',
          details: { courseId, userId }
        }, { status: 404 })
      }
      
      enrollment = enrollmentData2
    } else {
      enrollment = enrollmentData
      // Normalizar profile_picture si viene de user_course_enrollments
      if (enrollment.users && enrollment.users.profile_picture_url && !enrollment.users.profile_picture) {
        enrollment.users.profile_picture = enrollment.users.profile_picture_url
      }
    }

    // Obtener IDs de módulos y lecciones del curso primero
    const { data: courseModules } = await fromLoose<{ module_id: string }>(
      supabase,
      'course_modules'
    )
      .select('module_id')
      .eq('course_id', courseId)
    
    const moduleIds = courseModules?.map(m => m.module_id) || []
    
    const { data: courseLessons } = await fromLoose<{ lesson_id: string }>(
      supabase,
      'course_lessons'
    )
      .select('lesson_id')
      .in('module_id', moduleIds)
    
    const lessonIds = courseLessons?.map(l => l.lesson_id) || []
    
    const { data: courseActivities } = await fromLoose<{ activity_id: string }>(
      supabase,
      'lesson_activities'
    )
      .select('activity_id')
      .in('lesson_id', lessonIds)
    
    const activityIds = courseActivities?.map(a => a.activity_id) || []

    // 2. Estadísticas de LIA - TODAS las conversaciones del usuario (no solo del curso)
    // Incluye: chat general, chat de lecciones, chat de actividades, planificador de estudio
    const { data: liaConversations, error: liaError } = await fromLoose<LiaConversationRow>(
      supabase,
      'lia_conversations'
    )
      .select('conversation_id, created_at, context_type, course_id, lesson_id, activity_id')
      .eq('user_id', userId)
      // No filtramos por course_id para incluir TODAS las interacciones con LIA

    // 3. Estadísticas de LIA - Mensajes de TODAS las conversaciones
    const conversationIds = liaConversations?.map(c => c.conversation_id) || []
    const { data: liaMessages, error: messagesError } = conversationIds.length > 0
      ? await fromLoose<LiaMessageRow>(supabase, 'lia_messages')
          .select('message_id, conversation_id, created_at, sender, role')
          .in('conversation_id', conversationIds)
      : { data: [], error: null }

    // 4. Estadísticas de LIA - Feedback de TODAS las conversaciones
    const { data: liaFeedback, error: feedbackError } = conversationIds.length > 0
      ? await fromLoose<LiaFeedbackRow>(supabase, 'lia_user_feedback')
          .select('feedback_id, conversation_id, rating, feedback_type')
          .in('conversation_id', conversationIds)
      : { data: [], error: null }

    // 6. Actividades Completadas del curso
    const { data: completedActivities, error: activitiesError } = activityIds.length > 0
      ? await fromLoose<CompletedActivityRow>(supabase, 'user_activity_progress')
          .select('activity_id, completed_at, time_spent_seconds')
          .eq('user_id', userId)
          .eq('is_completed', true)
          .in('activity_id', activityIds)
      : { data: [], error: null }

    // 7. Progreso por Módulos del curso
    const { data: moduleProgress, error: moduleProgressError } = moduleIds.length > 0
      ? await fromLoose<ModuleProgressRow>(supabase, 'user_module_progress')
          .select(`
            *,
            course_modules:module_id (
              module_id,
              module_title,
              module_order
            )
          `)
          .eq('user_id', userId)
          .in('module_id', moduleIds)
      : { data: [], error: null }

    // 8. Lecciones vistas del curso
    const { data: lessonProgress, error: lessonProgressError } = lessonIds.length > 0 && enrollment?.enrollment_id
      ? await fromLoose<LessonProgressRow>(supabase, 'user_lesson_progress')
          .select('lesson_id, completed_at, time_spent_seconds, time_spent_minutes')
          .eq('user_id', userId)
          .eq('enrollment_id', enrollment.enrollment_id)
          .in('lesson_id', lessonIds)
      : { data: [], error: null }

    // 9. Notas creadas del curso
    const { data: userNotes, error: notesError } = lessonIds.length > 0
      ? await fromLoose<UserNoteRow>(supabase, 'user_lesson_notes')
          .select('note_id, created_at')
          .eq('user_id', userId)
          .in('lesson_id', lessonIds)
      : { data: [], error: null }

    // Calcular estadísticas de LIA (TODAS las interacciones)
    const totalConversations = liaConversations?.length || 0
    const totalMessages = liaMessages?.length || 0
    const userMessages = liaMessages?.filter(m => m.role === 'user' || m.sender === 'user').length || 0
    const liaMessagesCount = liaMessages?.filter(m => m.role === 'assistant' || m.sender === 'assistant').length || 0
    const positiveFeedback = liaFeedback?.filter(f => (f.rating ?? 0) >= 4).length || 0
    const feedbackRate = totalConversations > 0 ? (positiveFeedback / totalConversations) * 100 : 0


    // Conversaciones por semana (últimas 5 semanas) - TODAS las conversaciones
    const conversationsByWeek = calculateWeeklyData(liaConversations || [], 5)

    // Temas de conversación (basado en context_type) - Incluye todos los tipos
    const conversationTopics = groupByContextType(liaConversations || [])
    
    // Conversaciones de esta semana
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - 7)
    const conversationsThisWeek = liaConversations?.filter(c => {
      const date = new Date(c.created_at)
      return date >= weekStart
    }).length || 0

    // Total de actividades completadas del curso
    const totalActivitiesCompleted = completedActivities?.length || 0

    // Lecciones vistas del curso
    const totalLessonsViewed = lessonProgress?.length || 0
    const completedLessons = lessonProgress?.filter(l => l.completed_at).length || 0

    // Notas creadas del curso
    const totalNotes = userNotes?.length || 0
    
    // Progreso total del curso (del enrollment)
    const progressPercentage = enrollment?.overall_progress_percentage || enrollment?.progress_percentage || 0

    return NextResponse.json({
      success: true,
      data: {
        // Información básica
        student: enrollment?.users || null,
        enrollment: {
          status: enrollment?.enrollment_status || 'active',
          enrolledAt: enrollment?.enrolled_at || null,
          lastAccessedAt: enrollment?.last_accessed_at || null,
          progressPercentage: progressPercentage
        },

        // Estadísticas de LIA (TODAS las interacciones: chat, general, planificador)
        lia: {
          totalConversations,
          conversationsThisWeek,
          totalMessages,
          userMessages,
          liaMessages: liaMessagesCount,
          avgMessagesPerConversation: totalConversations > 0 ? (totalMessages / totalConversations).toFixed(1) : 0,
          positiveFeedbackRate: feedbackRate.toFixed(0),
          positiveFeedbackCount: positiveFeedback,
          conversationsByWeek,
          conversationTopics
        },

        // Métricas de engagement del curso
        engagement: {
          lessonsViewed: totalLessonsViewed,
          lessonsCompleted: completedLessons,
          notesCreated: totalNotes,
          activitiesCompleted: totalActivitiesCompleted,
          progressPercentage: Math.round(progressPercentage)
        },

        // Progreso por módulos
        moduleProgress: moduleProgress || []
      }
    })

  } catch (error) {
    techDebtLogger.error('Error fetching student details:', error)
    return NextResponse.json(
      { error: 'Error al obtener detalles del estudiante' },
      { status: 500 }
    )
  }
}

// Funciones auxiliares
function calculateWeeklyData(conversations: LiaConversationRow[], weeks: number) {
  const now = new Date()
  const weeklyData: Array<{ week: string; count: number }> = []

  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - (i * 7 + 7))
    const weekEnd = new Date(now)
    weekEnd.setDate(now.getDate() - (i * 7))

    const count = conversations.filter(c => {
      const date = new Date(c.created_at)
      return date >= weekStart && date < weekEnd
    }).length

    weeklyData.push({
      week: `S${weeks - i}`,
      count
    })
  }

  return weeklyData
}

function groupByContextType(conversations: LiaConversationRow[]) {
  const topics: { [key: string]: number } = {
    'lesson': 0,
    'activity': 0,
    'general': 0,
    'motivation': 0
  }

  conversations.forEach(c => {
    const type = c.context_type || 'general'
    if (topics[type] !== undefined) {
      topics[type]++
    } else {
      topics['general']++
    }
  })

  return [
    { tema: 'Dudas de Lecciones', count: topics.lesson, color: 'var(--color-primary)' },
    { tema: 'Ayuda con Actividades', count: topics.activity, color: 'var(--color-accent)' },
    { tema: 'Explicaciones Extra', count: topics.general, color: 'var(--color-success)' },
    { tema: 'Motivación', count: topics.motivation, color: 'var(--color-warning)' }
  ]
}
