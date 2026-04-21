import { GoogleGenerativeAI } from '@google/generative-ai'
import type { ReportFilters } from '../../types/report-data.types'
import { logger } from '../../../../lib/utils/logger'
import type { ReportRuntime, ReportSupabaseClient } from './shared'
import { generateActivityReport } from './engagement-reports.service'
import { generateCertificatesReport } from './outcome-reports.service'
import { generateCoursesReport, generateUsersReport } from './user-reports.service'

interface WorkTeamSummary {
  team_id: string
  name: string | null
  status: string | null
}

interface StudyPlanSummary {
  id: string
}

interface StudySessionSummary {
  id: string
  status: string | null
  is_ai_generated: boolean | null
}

interface LiaConversationSummary {
  conversation_id: string
  context_type: string | null
  created_at: string | null
}

interface TeamAssignmentSummary {
  id: string
  course_id: string
}

export async function generateLiaAnalysisReport(
  supabase: ReportSupabaseClient,
  organizationId: string,
  filters: ReportFilters,
  runtime: ReportRuntime,
) {
  const [usersReport, activityReport, certificatesReport, coursesReport] = await Promise.all([
    generateUsersReport(supabase, organizationId, filters),
    generateActivityReport(supabase, organizationId, filters, runtime),
    generateCertificatesReport(supabase, organizationId, filters, runtime),
    generateCoursesReport(supabase, organizationId, filters),
  ])

  const userIds = usersReport.users.map((user) => user.user_id)

  const [workTeamsData, studyPlansData, studySessionsData, liaConversationsData] =
    await Promise.all([
      supabase
        .from('work_teams')
        .select('team_id, name, status')
        .eq('organization_id', organizationId),
      userIds.length > 0
        ? supabase.from('study_plans').select('id').in('user_id', userIds)
        : Promise.resolve({ data: [] }),
      userIds.length > 0
        ? supabase
            .from('study_sessions')
            .select('id, status, is_ai_generated')
            .in('user_id', userIds)
        : Promise.resolve({ data: [] }),
      userIds.length > 0
        ? supabase
            .from('lia_conversations')
            .select('conversation_id, context_type, created_at')
            .in('user_id', userIds)
        : Promise.resolve({ data: [] }),
    ])

  const workTeams = (workTeamsData.data || []) as WorkTeamSummary[]
  const studyPlans = (studyPlansData.data || []) as StudyPlanSummary[]
  const studySessions = (studySessionsData.data || []) as StudySessionSummary[]
  const liaConversations = (liaConversationsData.data || []) as LiaConversationSummary[]
  const teamIds = workTeams.map((team) => team.team_id)
  const teamAssignmentsData =
    teamIds.length > 0
      ? await supabase
          .from('work_team_course_assignments')
          .select('id, course_id')
          .in('team_id', teamIds)
      : { data: [] }

  const teamAssignments = (teamAssignmentsData.data || []) as TeamAssignmentSummary[]
  const teamsCount = workTeams.length
  const activeTeams = workTeams.filter((team) => team.status === 'active').length
  const teamAssignmentsCount = teamAssignments.length

  const totalStudyPlans = studyPlans.length
  const totalSessions = studySessions.length
  const completedSessions = studySessions.filter((session) => session.status === 'completed').length
  const adherenceRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0

  const totalLiaConversations = liaConversations.length
  const aiChatConversations =
    liaConversations.filter((conversation) => conversation.context_type === 'ai_chat').length
  const courseContextConversations =
    liaConversations.filter((conversation) => conversation.context_type?.includes('course')).length

  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '')
  const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-pro'
  const model = genAI.getGenerativeModel({ model: modelName })

  const prompt = `
    Actua como SofLIA, la experta en analisis de datos y recursos humanos de la plataforma SofLIA.

    Tu tarea es generar un "Reporte Ejecutivo de Analisis Predictivo y Rendimiento" para el administrador de la organizacion.
    Debes analizar los datos proporcionados y generar un informe profesional, detallado y util para la toma de decisiones.

    DATOS DE LA ORGANIZACION:
    - Total Usuarios: ${usersReport.total_users}
    - Usuarios Activos: ${usersReport.summary?.by_status?.active || 0}
    - Total Cursos Asignados (Directos + Equipos): ${coursesReport.total_assignments}
    - Tasa de Finalizacion de Cursos: ${coursesReport.summary?.average_completion_rate?.toFixed(2)}%

    ESTRUCTURA DE EQUIPOS:
    - Equipos Totales: ${teamsCount}
    - Equipos Activos: ${activeTeams}
    - Cursos Asignados a Equipos: ${teamAssignmentsCount}
    *Nota: Un alto numero de asignaciones a equipos indica una gestion eficiente. Si es 0, sugiere subutilizacion de esta funcion.*

    PLANIFICACION Y HABITOS DE ESTUDIO:
    - Planes de Estudio Activos: ${totalStudyPlans}
    - Tasa de Adherencia al Plan (Cumplimiento): ${adherenceRate.toFixed(1)}%
    - Sesiones de Estudio Completadas: ${completedSessions}

    INTERACCION CON INTELIGENCIA ARTIFICIAL (SofLIA):
    - Conversaciones de Orientacion General: ${aiChatConversations}
    - Consultas sobre Cursos Especificos: ${courseContextConversations}
    - Total Interacciones: ${totalLiaConversations}

    DETALLE DE USUARIOS (Muestra representativa):
    ${JSON.stringify(
      usersReport.users.slice(0, 15).map((user) => ({
        nombre: user.display_name,
        cargo: user.job_title,
        progreso_promedio: user.progress.average_progress,
        cursos_asignados: user.progress.total_courses,
        cursos_completados: user.progress.completed_courses,
        ultimo_acceso: user.last_login_at,
      })),
    )}

    INSTRUCCIONES PARA EL REPORTE:
    1. Resumen Ejecutivo: Breve vision general del estado de la capacitacion y la salud digital de la organizacion.
    2. Analisis de Rendimiento y Adopcion:
       - Evalua el ritmo de aprendizaje.
       - IMPORTANTE: Analiza la adopcion de herramientas de productividad como el "Planificador de Estudios" y el asistente "SofLIA". ¿Estan usando la IA para aprender mejor?
    3. Estructura y Equipos: Comenta sobre la organizacion en equipos (${teamsCount} equipos detectados). ¿Se esta aprovechando la estructura grupal?
    4. Top Talent y Riesgos:
       - Menciona usuarios destacados.
       - Identifica usuarios en riesgo.
    5. Predicciones y Sugerencias Estrategicas:
       - Basado en la adherencia (${adherenceRate.toFixed(1)}%), predice si se cumpliran las metas trimestrales.
       - Sugiere acciones para mejorar el uso del Planificador y SofLIA si las metricas son bajas.
    6. Conclusion Profesional: Cierre motivador.

    FORMATO:
    - Usa Markdown enriquecido.
    - Tono Ejecutivo/Directivo.
    - Idioma: Espanol.
    - FIRMA (OBLIGATORIO): Al final del reporte, usa EXCLUSIVAMENTE este formato centrado (usa HTML):

      <div style="text-align: center; margin-top: 40px;">
        Atentamente,<br><br>
        <strong>SofLIA</strong><br>
        <span style="color: #64748b; font-size: 14px;">Sistema Operativo de Formacion de Inteligencia Aplicada</span>
      </div>

    - PROHIBIDO: No pongas "Sistema de Analitica", "Plataforma SofLIA" ni "Estrategia de Talento" en la firma. Usa solo el texto indicado arriba.
  `

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    return {
      analysis_text: text,
      raw_data: {
        users: usersReport,
        activity: activityReport,
        certificates: certificatesReport,
        courses: coursesReport,
        teams: {
          total: teamsCount,
          active: activeTeams,
        },
        planner: {
          total_plans: totalStudyPlans,
          adherence: adherenceRate,
        },
        lia: {
          total_conversations: totalLiaConversations,
        },
      },
    }
  } catch (error) {
    logger.error('Error generating LIA report:', error)
    return {
      analysis_text:
        'Lo sentimos, no pudimos generar el analisis predictivo en este momento debido a un error de conexion con el motor de IA. Por favor, revisa los datos crudos a continuacion.',
      raw_data: {
        users: usersReport,
        activity: activityReport,
        certificates: certificatesReport,
        courses: coursesReport,
      },
    }
  }
}
