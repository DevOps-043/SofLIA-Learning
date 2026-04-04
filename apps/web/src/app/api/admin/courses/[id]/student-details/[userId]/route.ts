import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'

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

interface StudySessionRow {
  course_id: string | null
  lesson_id: string | null
  start_time: string
  end_time: string | null
  duration_minutes: number | null
  progress_made?: number | null
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
      console.error('[Student Details API] Missing parameters:', { courseId, userId })
      return NextResponse.json({ error: 'Parámetros faltantes', details: { courseId, userId } }, { status: 400 })
    }


    // 1. Obtener información básica del estudiante y su inscripción
    // Intentar primero con user_course_enrollments (vista/tabla principal)
    let enrollment: StudentEnrollment | null = null
    
    const { data: enrollmentData, error: enrollmentErr } = await supabase
      .from('user_course_enrollments')
      .select(`
        *,
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
      const { data: enrollmentData2, error: enrollmentErr2 } = await supabase
        .from('course_enrollments')
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
        console.error('[Student Details API] Enrollment not found:', { 
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
    const { data: courseModules } = await supabase
      .from('course_modules')
      .select('module_id')
      .eq('course_id', courseId)
    
    const moduleIds = courseModules?.map(m => m.module_id) || []
    
    const { data: courseLessons } = await supabase
      .from('course_lessons')
      .select('lesson_id')
      .in('module_id', moduleIds)
    
    const lessonIds = courseLessons?.map(l => l.lesson_id) || []
    
    const { data: courseActivities } = await supabase
      .from('lesson_activities')
      .select('activity_id')
      .in('lesson_id', lessonIds)
    
    const activityIds = courseActivities?.map(a => a.activity_id) || []

    // 2. Estadísticas de LIA - TODAS las conversaciones del usuario (no solo del curso)
    // Incluye: chat general, chat de lecciones, chat de actividades, planificador de estudio
    const { data: liaConversations, error: liaError } = await supabase
      .from('lia_conversations')
      .select('conversation_id, created_at, context_type, course_id, lesson_id, activity_id')
      .eq('user_id', userId)
      // No filtramos por course_id para incluir TODAS las interacciones con LIA

    // 3. Estadísticas de LIA - Mensajes de TODAS las conversaciones
    const conversationIds = liaConversations?.map(c => c.conversation_id) || []
    const { data: liaMessages, error: messagesError } = conversationIds.length > 0
      ? await supabase
          .from('lia_messages')
          .select('message_id, conversation_id, created_at, sender, role')
          .in('conversation_id', conversationIds)
      : { data: [], error: null }

    // 4. Estadísticas de LIA - Feedback de TODAS las conversaciones
    const { data: liaFeedback, error: feedbackError } = conversationIds.length > 0
      ? await supabase
          .from('lia_user_feedback')
          .select('feedback_id, conversation_id, rating, feedback_type')
          .in('conversation_id', conversationIds)
      : { data: [], error: null }

    // 5. Sesiones de Estudio - Incluye sesiones del curso y del planificador
    let studySessionsQuery = supabase
      .from('study_sessions')
      .select('*')
      .eq('user_id', userId)
    
    // Construir la condición OR de manera segura
    if (lessonIds.length > 0) {
      studySessionsQuery = studySessionsQuery.or(`course_id.eq.${courseId},course_id.is.null,lesson_id.in.(${lessonIds.join(',')})`)
    } else {
      studySessionsQuery = studySessionsQuery.or(`course_id.eq.${courseId},course_id.is.null`)
    }
    
    const { data: studySessions, error: sessionsError } = await studySessionsQuery
      .order('start_time', { ascending: false })

    // 6. Actividades Completadas del curso
    const { data: completedActivities, error: activitiesError } = activityIds.length > 0
      ? await supabase
          .from('user_activity_progress')
          .select('activity_id, completed_at, time_spent_seconds')
          .eq('user_id', userId)
          .eq('is_completed', true)
          .in('activity_id', activityIds)
      : { data: [], error: null }

    // 7. Progreso por Módulos del curso
    const { data: moduleProgress, error: moduleProgressError } = moduleIds.length > 0
      ? await supabase
          .from('user_module_progress')
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
      ? await supabase
          .from('user_lesson_progress')
          .select('lesson_id, completed_at, time_spent_seconds, time_spent_minutes')
          .eq('user_id', userId)
          .eq('enrollment_id', enrollment.enrollment_id)
          .in('lesson_id', lessonIds)
      : { data: [], error: null }

    // 9. Notas creadas del curso
    const { data: userNotes, error: notesError } = lessonIds.length > 0
      ? await supabase
          .from('user_lesson_notes')
          .select('note_id, created_at')
          .eq('user_id', userId)
          .in('lesson_id', lessonIds)
      : { data: [], error: null }

    // Calcular estadísticas de LIA (TODAS las interacciones)
    const totalConversations = liaConversations?.length || 0
    const totalMessages = liaMessages?.length || 0
    const userMessages = liaMessages?.filter(m => m.role === 'user' || m.sender === 'user').length || 0
    const liaMessagesCount = liaMessages?.filter(m => m.role === 'assistant' || m.sender === 'assistant').length || 0
    const positiveFeedback = liaFeedback?.filter(f => f.rating >= 4).length || 0
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

    // Calcular estadísticas de sesiones de estudio
    // Filtrar sesiones del curso específico para métricas del curso
    const courseSessions = studySessions?.filter(s => 
      s.course_id === courseId || 
      (s.lesson_id && lessonIds.includes(s.lesson_id))
    ) || studySessions || []
    
    const totalSessions = courseSessions.length

    const totalStudyTime = courseSessions.reduce((acc, s) => {
      if (s.duration_minutes) {
        return acc + s.duration_minutes
      } else if (s.end_time && s.start_time) {
        const duration = new Date(s.end_time).getTime() - new Date(s.start_time).getTime()
        return acc + duration / 1000 / 60 // convertir a minutos
      }
      return acc
    }, 0)

    const avgSessionDuration = totalSessions > 0 ? totalStudyTime / totalSessions : 0
    const lastSession = courseSessions[0]
    
    // Tiempo desde la última sesión
    const lastSessionTime = lastSession?.start_time 
      ? Math.round((new Date().getTime() - new Date(lastSession.start_time).getTime()) / (1000 * 60 * 60))
      : null

    // Horarios preferidos
    const preferredTimeSlots = calculatePreferredTimeSlots(studySessions || [])

    // Días más activos
    const activeDays = calculateActiveDays(studySessions || [])

    // Frecuencia semanal
    const weeklyFrequency = calculateWeeklyFrequency(studySessions || [])

    // Progreso semanal
    const weeklyProgress = calculateWeeklyProgress(studySessions || [], 7)

    // Tiempo de estudio por día
    const dailyStudyTime = calculateDailyStudyTime(studySessions || [], 7)

    // Racha de días
    const studyStreak = calculateStudyStreak(studySessions || [])

    // Total de actividades completadas del curso
    const totalActivitiesCompleted = completedActivities?.length || 0

    // Lecciones vistas del curso
    const totalLessonsViewed = lessonProgress?.length || 0
    const completedLessons = lessonProgress?.filter(l => l.completed_at).length || 0

    // Notas creadas del curso
    const totalNotes = userNotes?.length || 0
    
    // Progreso total del curso (del enrollment)
    const progressPercentage = enrollment?.overall_progress_percentage || enrollment?.progress_percentage || 0
    
    // Tiempo total de estudio en el curso (suma de time_spent_minutes de lecciones)
    const totalCourseStudyTime = lessonProgress?.reduce((acc, l) => {
      return acc + (l.time_spent_minutes || 0)
    }, 0) || 0

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

        // Estadísticas de sesiones de estudio del curso
        studySessions: {
          totalSessions,
          lastSession: lastSession ? {
            startTime: lastSession.start_time,
            endTime: lastSession.end_time,
            duration: lastSession.duration_minutes,
            hoursAgo: lastSessionTime
          } : null,
          avgSessionDuration: Math.round(avgSessionDuration),
          totalStudyTime: Math.round(totalStudyTime / 60), // convertir a horas
          totalCourseStudyTime: Math.round(totalCourseStudyTime / 60), // tiempo total en el curso
          weeklyFrequency: weeklyFrequency.toFixed(1),
          preferredTimeSlots,
          activeDays,
          weeklyProgress,
          dailyStudyTime,
          studyStreak
        },

        // Métricas de engagement del curso
        engagement: {
          totalSessions,
          avgDailyTime: weeklyFrequency > 0 ? (totalStudyTime / 60 / 7).toFixed(1) : 0,
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
    console.error('Error fetching student details:', error)
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
    { tema: 'Dudas de Lecciones', count: topics.lesson, color: '#0A2540' },
    { tema: 'Ayuda con Actividades', count: topics.activity, color: '#00D4B3' },
    { tema: 'Explicaciones Extra', count: topics.general, color: '#10B981' },
    { tema: 'Motivación', count: topics.motivation, color: '#F59E0B' }
  ]
}

function calculatePreferredTimeSlots(sessions: StudySessionRow[]) {
  const slots = {
    morning: 0,    // 6-12
    afternoon: 0,  // 12-18
    evening: 0,    // 18-24
    night: 0       // 0-6
  }

  sessions.forEach(s => {
    const hour = new Date(s.start_time).getHours()
    if (hour >= 6 && hour < 12) slots.morning++
    else if (hour >= 12 && hour < 18) slots.afternoon++
    else if (hour >= 18 && hour < 24) slots.evening++
    else slots.night++
  })

  const total = sessions.length || 1
  return [
    { periodo: 'Mañana (6am-12pm)', porcentaje: Math.round((slots.morning / total) * 100), color: '#F59E0B' },
    { periodo: 'Tarde (12pm-6pm)', porcentaje: Math.round((slots.afternoon / total) * 100), color: '#00D4B3' },
    { periodo: 'Noche (6pm-12am)', porcentaje: Math.round((slots.evening / total) * 100), color: '#10B981' },
    { periodo: 'Madrugada (12am-6am)', porcentaje: Math.round((slots.night / total) * 100), color: '#6C757D' }
  ]
}

function calculateActiveDays(sessions: StudySessionRow[]) {
  const days = ['D', 'L', 'M', 'X', 'J', 'V', 'S']
  const dayCounts = [0, 0, 0, 0, 0, 0, 0]

  sessions.forEach(s => {
    const dayIndex = new Date(s.start_time).getDay()
    dayCounts[dayIndex]++
  })

  return days.map((dia, index) => ({
    dia,
    sesiones: dayCounts[index]
  }))
}

function calculateWeeklyFrequency(sessions: StudySessionRow[]) {
  if (sessions.length === 0) return 0

  const uniqueDays = new Set<string>()
  sessions.forEach(s => {
    const date = new Date(s.start_time).toDateString()
    uniqueDays.add(date)
  })

  const oldestSession = new Date(sessions[sessions.length - 1].start_time)
  const newestSession = new Date(sessions[0].start_time)
  const weeks = Math.max(1, (newestSession.getTime() - oldestSession.getTime()) / (1000 * 60 * 60 * 24 * 7))

  return uniqueDays.size / weeks
}

function calculateWeeklyProgress(sessions: StudySessionRow[], days: number) {
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  const progress: Array<{ dia: string; progreso: number }> = []
  const now = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(now.getDate() - i)
    const dayName = dayNames[date.getDay()]

    const sessionsOnDay = sessions.filter(s => {
      const sessionDate = new Date(s.start_time)
      return sessionDate.toDateString() === date.toDateString()
    })

    const totalProgress = sessionsOnDay.reduce((acc, s) => {
      return acc + (s.progress_made || 0)
    }, 0)

    progress.push({
      dia: dayName,
      progreso: Math.round(totalProgress)
    })
  }

  return progress
}

function calculateDailyStudyTime(sessions: StudySessionRow[], days: number) {
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  const studyTime: Array<{ dia: string; horas: number }> = []
  const now = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(now.getDate() - i)
    const dayName = dayNames[date.getDay()]

    const sessionsOnDay = sessions.filter(s => {
      const sessionDate = new Date(s.start_time)
      return sessionDate.toDateString() === date.toDateString()
    })

    const totalMinutes = sessionsOnDay.reduce((acc, s) => {
      if (s.end_time && s.start_time) {
        const duration = new Date(s.end_time).getTime() - new Date(s.start_time).getTime()
        return acc + duration / 1000 / 60
      }
      return acc
    }, 0)

    studyTime.push({
      dia: dayName,
      horas: parseFloat((totalMinutes / 60).toFixed(1))
    })
  }

  return studyTime
}

function calculateStudyStreak(sessions: StudySessionRow[]) {
  if (sessions.length === 0) return 0

  const uniqueDates = new Set<string>()
  sessions.forEach(s => {
    const date = new Date(s.start_time).toDateString()
    uniqueDates.add(date)
  })

  const sortedDates = Array.from(uniqueDates).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  )

  let streak = 0
  let currentDate = new Date()
  currentDate.setHours(0, 0, 0, 0)

  for (const dateStr of sortedDates) {
    const date = new Date(dateStr)
    date.setHours(0, 0, 0, 0)

    const diffDays = Math.floor((currentDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === streak || (streak === 0 && diffDays <= 1)) {
      streak++
      currentDate = date
    } else {
      break
    }
  }

  return streak
}
