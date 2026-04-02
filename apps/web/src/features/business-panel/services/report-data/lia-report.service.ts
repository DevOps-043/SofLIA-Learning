import { GoogleGenerativeAI } from '@google/generative-ai'
import type { ReportFilters } from '../../types/report-data.types'
import { logger } from '../../../../lib/utils/logger'
import type { ReportRuntime, ReportSupabaseClient } from './shared'
import { generateActivityReport } from './engagement-reports.service'
import { generateCertificatesReport } from './outcome-reports.service'
import { generateCoursesReport, generateUsersReport } from './user-reports.service'

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

  const userIds = usersReport.users.map((user: any) => user.user_id)

  const [workTeamsData, studyPlansData, studySessionsData, liaConversationsData] =
    await Promise.all([
      supabase
        .from('work_teams')
        .select('team_id, name, status')
        .eq('organization_id', organizationId),
      userIds.length > 0
        ? supabase.from('study_plans').select('id, status').in('user_id', userIds)
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
            .select('id, context_type, created_at')
            .in('user_id', userIds)
        : Promise.resolve({ data: [] }),
    ])

  const teamIds = workTeamsData.data?.map((team: any) => team.team_id) || []
  const teamAssignmentsData =
    teamIds.length > 0
      ? await supabase
          .from('work_team_course_assignments')
          .select('id, course_id')
          .in('team_id', teamIds)
      : { data: [] }

  const teamsCount = workTeamsData.data?.length || 0
  const activeTeams =
    workTeamsData.data?.filter((team: any) => team.status === 'active').length || 0
  const teamAssignmentsCount = teamAssignmentsData.data?.length || 0

  const totalStudyPlans = studyPlansData.data?.length || 0
  const totalSessions = studySessionsData.data?.length || 0
  const completedSessions =
    studySessionsData.data?.filter((session: any) => session.status === 'completed').length || 0
  const adherenceRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0

  const totalLiaConversations = liaConversationsData.data?.length || 0
  const aiChatConversations =
    liaConversationsData.data?.filter((conversation: any) => conversation.context_type === 'ai_chat')
      .length || 0
  const courseContextConversations =
    liaConversationsData.data?.filter((conversation: any) =>
      conversation.context_type?.includes('course'),
    ).length || 0

  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '')
  const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-pro'
  const model = genAI.getGenerativeModel({ model: modelName })

  const prompt = `
    ActÃºa como LIA, la experta en anÃ¡lisis de datos y recursos humanos de la plataforma SofLIA.

    Tu tarea es generar un "Reporte Ejecutivo de AnÃ¡lisis Predictivo y Rendimiento" para el administrador de la organizaciÃ³n.
    Debes analizar los datos proporcionados y generar un informe profesional, detallado y Ãºtil para la toma de decisiones.

    DATOS DE LA ORGANIZACIÃ“N:
    - Total Usuarios: ${usersReport.total_users}
    - Usuarios Activos: ${usersReport.summary?.by_status?.active || 0}
    - Total Cursos Asignados (Directos + Equipos): ${coursesReport.total_assignments}
    - Tasa de FinalizaciÃ³n de Cursos: ${coursesReport.summary?.average_completion_rate?.toFixed(2)}%

    ESTRUCTURA DE EQUIPOS:
    - Equipos Totales: ${teamsCount}
    - Equipos Activos: ${activeTeams}
    - Cursos Asignados a Equipos: ${teamAssignmentsCount}
    *Nota: Un alto nÃºmero de asignaciones a equipos indica una gestiÃ³n eficiente. Si es 0, sugiere subutilizaciÃ³n de esta funciÃ³n.*

    PLANIFICACIÃ“N Y HÃBITOS DE ESTUDIO:
    - Planes de Estudio Activos: ${totalStudyPlans}
    - Tasa de Adherencia al Plan (Cumplimiento): ${adherenceRate.toFixed(1)}%
    - Sesiones de Estudio Completadas: ${completedSessions}

    INTERACCIÃ“N CON INTELIGENCIA ARTIFICIAL (LIA):
    - Conversaciones de OrientaciÃ³n General: ${aiChatConversations}
    - Consultas sobre Cursos EspecÃ­ficos: ${courseContextConversations}
    - Total Interacciones: ${totalLiaConversations}

    DETALLE DE USUARIOS (Muestra representativa):
    ${JSON.stringify(
      usersReport.users.slice(0, 15).map((user: any) => ({
        nombre: user.display_name,
        cargo: user.job_title,
        progreso_promedio: user.progress.average_progress,
        cursos_asignados: user.progress.total_courses,
        cursos_completados: user.progress.completed_courses,
        ultimo_acceso: user.last_login_at,
      })),
    )}

    INSTRUCCIONES PARA EL REPORTE:
    1. **Resumen Ejecutivo**: Breve visiÃ³n general del estado de la capacitaciÃ³n y la salud digital de la organizaciÃ³n.
    2. **AnÃ¡lisis de Rendimiento y AdopciÃ³n**:
       - EvalÃºa el ritmo de aprendizaje.
       - **IMPORTANTE**: Analiza la adopciÃ³n de herramientas de productividad como el "Planificador de Estudios" y el asistente "LIA". Â¿EstÃ¡n usando la IA para aprender mejor?
    3. **Estructura y Equipos**: Comenta sobre la organizaciÃ³n en equipos (${teamsCount} equipos detectados). Â¿Se estÃ¡ aprovechando la estructura grupal?
    4. **Top Talent & Riesgos**:
       - Menciona usuarios destacados.
       - Identifica usuarios en riesgo.
    5. **Predicciones y Sugerencias EstratÃ©gicas**:
       - Basado en la adherencia (${adherenceRate.toFixed(1)}%), predice si se cumplirÃ¡n las metas trimestrales.
       - Sugiere acciones para mejorar el uso del Planificador y LIA si las mÃ©tricas son bajas.
    6. **ConclusiÃ³n Profesional**: Cierre motivador.

    FORMATO:
    - Usa Markdown enriquecido.
    - Tono Ejecutivo/Directivo.
    - Idioma: EspaÃ±ol.
    - **FIRMA (OBLIGATORIO):** Al final del reporte, usa EXCLUSIVAMENTE este formato centrado (usa HTML):

      <div style="text-align: center; margin-top: 40px;">
        Atentamente,<br><br>
        <strong>SofLIA</strong><br>
        <span style="color: #64748b; font-size: 14px;">Sistema Operativo de FormaciÃ³n de Inteligencia Aplicada</span>
      </div>

    - **PROHIBIDO**: No pongas "Sistema de AnalÃ­tica", "Plataforma SofLIA" ni "Estrategia de Talento" en la firma. Usa solo el texto indicado arriba.
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
        'Lo sentimos, no pudimos generar el anÃ¡lisis predictivo en este momento debido a un error de conexiÃ³n con el motor de IA. Por favor, revisa los datos crudos a continuaciÃ³n.',
      raw_data: {
        users: usersReport,
        activity: activityReport,
        certificates: certificatesReport,
        courses: coursesReport,
      },
    }
  }
}
