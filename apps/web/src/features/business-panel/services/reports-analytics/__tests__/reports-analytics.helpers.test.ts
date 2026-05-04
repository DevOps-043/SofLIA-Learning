import { describe, expect, it } from 'vitest'
import JSZip from 'jszip'
import {
  buildReportsAnalyticsDataset,
} from '../reports-analytics.server.service'
import {
  generateReportsAnalyticsWorkbook,
  generateReportsAnalyticsZip,
} from '../reports-analytics.export.service'
import {
  buildFallbackReportsAnalyticsBlueprint,
  parseReportsAnalyticsBlueprint,
} from '../reports-analytics.blueprint.service'
import { buildReportsAnalyticsAiPayload } from '../reports-analytics.ai-payload.service'
import {
  calculateAge,
  buildConnectionCalendar,
  buildLoginHeatmap,
  calculateRankScore,
  getAgeBand,
  getProgressBand,
  resolveLastConnectionAt,
} from '../reports-analytics.helpers'

describe('reports analytics helpers', () => {
  it('calculates age bands without storing derived age', () => {
    const today = new Date('2026-04-25T12:00:00.000Z')

    expect(calculateAge('1990-05-10', today)).toBe(35)
    expect(getAgeBand(17)).toBe('under_18')
    expect(getAgeBand(24)).toBe('18_24')
    expect(getAgeBand(35)).toBe('35_44')
    expect(getAgeBand(null)).toBe('unspecified')
  })

  it('groups learning progress into stable bands', () => {
    expect(getProgressBand(0)).toBe('not_started')
    expect(getProgressBand(25)).toBe('low')
    expect(getProgressBand(50)).toBe('medium')
    expect(getProgressBand(75)).toBe('high')
    expect(getProgressBand(99)).toBe('almost_done')
    expect(getProgressBand(100)).toBe('completed')
  })

  it('uses last login before updated_at for connection heatmap inputs', () => {
    expect(resolveLastConnectionAt('2026-04-25T10:00:00.000Z', '2026-04-26T10:00:00.000Z')).toBe('2026-04-25T10:00:00.000Z')
    expect(resolveLastConnectionAt(null, '2026-04-26T10:00:00.000Z')).toBe('2026-04-26T10:00:00.000Z')

    const heatmap = buildLoginHeatmap([
      '2026-04-27T15:10:00.000Z',
      '2026-04-27T15:20:00.000Z',
      '2026-04-28T03:00:00.000Z',
    ])

    expect(heatmap.find((cell) => cell.dayKey === 'mon' && cell.hour === 15)).toEqual(
      expect.objectContaining({ value: 2, percentage: 100 }),
    )

    const calendar = buildConnectionCalendar(
      [
        '2026-04-27T15:10:00.000Z',
        '2026-04-27T15:20:00.000Z',
        '2026-04-28T03:00:00.000Z',
      ],
      {
        from: '2026-04-27T00:00:00.000Z',
        to: '2026-04-30T23:59:59.999Z',
      },
    )

    expect(calendar.find((cell) => cell.date === '2026-04-27')).toEqual(
      expect.objectContaining({ value: 2, level: 4 }),
    )
    expect(calendar.find((cell) => cell.date === '2026-04-28')).toEqual(
      expect.objectContaining({ value: 1, level: 2 }),
    )
  })

  it('penalizes hierarchy ranking scores for overdue work', () => {
    const strongScore = calculateRankScore({
      averageProgress: 90,
      completionRate: 85,
      sofliaAdoptionRate: 80,
      notesAdoptionRate: 75,
      qualityScore: 88,
      overdueAssignments: 0,
      users: 10,
    })
    const riskyScore = calculateRankScore({
      averageProgress: 90,
      completionRate: 85,
      sofliaAdoptionRate: 80,
      notesAdoptionRate: 75,
      qualityScore: 88,
      overdueAssignments: 20,
      users: 10,
    })

    expect(strongScore).toBeGreaterThan(riskyScore)
  })

  it('builds aggregate analytics and keeps user detail separate for exports', async () => {
    const filters = {
      from: '2026-01-01T00:00:00.000Z',
      to: '2026-04-30T23:59:59.999Z',
      granularity: 'month' as const,
    }
    const queryData: Parameters<typeof buildReportsAnalyticsDataset>[0] = {
      regions: [
        {
          id: 'region-1',
          name: 'Norte',
          code: 'N',
          is_active: true,
        },
      ],
      zones: [
        {
          id: 'zone-1',
          name: 'Zona 1',
          code: 'Z1',
          region_id: 'region-1',
          is_active: true,
        },
      ],
      teams: [
        {
          id: 'team-1',
          name: 'Ventas Norte',
          code: 'VN',
          zone_id: 'zone-1',
          is_active: true,
        },
      ],
      organizationUsers: [
        {
          user_id: 'user-1',
          role: 'member',
          job_title: 'Ventas',
          status: 'active',
          joined_at: '2026-01-01T00:00:00.000Z',
          created_at: '2026-01-01T00:00:00.000Z',
          region_id: 'region-1',
          zone_id: 'zone-1',
          team_id: 'team-1',
          hierarchy_scope: 'team',
          users: {
            id: 'user-1',
            username: 'ada',
            email: 'ada@example.com',
            first_name: 'Ada',
            last_name: 'Lovelace',
            display_name: null,
            date_of_birth: '1990-05-10',
            gender: 'female',
            last_login_at: '2026-04-27T15:10:00.000Z',
            updated_at: '2026-04-20T15:10:00.000Z',
          },
        },
        {
          user_id: 'user-2',
          role: 'member',
          job_title: null,
          status: 'active',
          joined_at: '2026-01-01T00:00:00.000Z',
          created_at: '2026-01-01T00:00:00.000Z',
          region_id: null,
          zone_id: null,
          team_id: null,
          hierarchy_scope: null,
          users: {
            id: 'user-2',
            username: 'grace',
            email: 'grace@example.com',
            first_name: 'Grace',
            last_name: 'Hopper',
            display_name: null,
            date_of_birth: null,
            gender: null,
            last_login_at: null,
            updated_at: '2026-04-21T15:10:00.000Z',
          },
        },
      ],
      assignments: [
        {
          id: 'assignment-1',
          user_id: 'user-1',
          course_id: 'course-1',
          status: 'completed',
          completion_percentage: 100,
          assigned_at: '2025-12-01T00:00:00.000Z',
          due_date: '2026-03-01T00:00:00.000Z',
          completed_at: '2025-12-15T00:00:00.000Z',
          updated_at: '2025-12-15T00:00:00.000Z',
          courses: { id: 'course-1', title: 'IA para ventas' },
        },
      ],
      enrollments: [],
      lessonProgress: [],
      activityCompletions: [
        {
          completion_id: 'completion-1',
          user_id: 'user-1',
          activity_id: 'activity-1',
          status: 'completed',
          completed_steps: 3,
          total_steps: 3,
          time_to_complete_seconds: 180,
          attempts_to_complete: 1,
          user_needed_help: false,
          lia_had_to_redirect: 0,
          generated_output: { answer: 'Aplicaria IA para priorizar cuentas con mayor probabilidad de cierre.' },
          completed_at: '2026-02-16T00:00:00.000Z',
          started_at: '2026-02-16T00:00:00.000Z',
          updated_at: '2026-02-16T00:00:00.000Z',
          lesson_activities: null,
        },
      ],
      activitySubmissions: [
        {
          submission_id: 'submission-1',
          user_id: 'user-1',
          organization_id: 'org-1',
          course_id: 'course-1',
          lesson_id: 'lesson-1',
          activity_id: 'activity-2',
          enrollment_id: 'enrollment-1',
          status: 'validated',
          response_text: 'Use IA para preparar un plan de seguimiento comercial.',
          response_payload: null,
          evidence_payload: null,
          submitted_at: '2026-02-18T00:00:00.000Z',
          last_validated_at: '2026-02-18T00:05:00.000Z',
          created_at: '2026-02-18T00:00:00.000Z',
          updated_at: '2026-02-18T00:05:00.000Z',
          courses: { id: 'course-1', title: 'IA para ventas' },
          lesson_activities: null,
        },
      ],
      activityEvaluations: [
        {
          evaluation_id: 'evaluation-1',
          submission_id: 'submission-1',
          result_status: 'pass',
          feedback_payload: { summary: 'Buen trabajo' },
          model_name: 'test-model',
          created_at: '2026-02-18T00:05:00.000Z',
        },
      ],
      lessonNotes: [],
      liaConversations: [
        {
          conversation_id: 'conversation-1',
          user_id: 'user-1',
          course_id: 'course-1',
          context_type: 'course_lesson',
          conversation_completed: true,
          started_at: '2026-02-17T00:00:00.000Z',
          ended_at: '2026-02-17T00:10:00.000Z',
          created_at: '2026-02-17T00:00:00.000Z',
          updated_at: '2026-02-17T00:10:00.000Z',
          total_messages: 4,
          total_lia_messages: 2,
          total_user_messages: 2,
          courses: { id: 'course-1', title: 'IA para ventas' },
        },
      ],
      liaMessages: [
        {
          message_id: 'message-1',
          conversation_id: 'conversation-1',
          role: 'user',
          content: 'Como uso SofLIA para preparar una propuesta comercial?',
          created_at: '2026-02-17T00:01:00.000Z',
          contains_question: true,
          response_time_ms: null,
          is_off_topic: false,
          lia_redirected: false,
          lia_provided_example: false,
          sentiment_score: 0.4,
          user_sentiment: 'positive',
          tokens_used: 20,
        },
      ],
      quizSubmissions: [],
      studySessions: [],
    }

    const result = buildReportsAnalyticsDataset(queryData, filters)
    const fallbackBlueprint = buildFallbackReportsAnalyticsBlueprint(result, 'es', 'gemini-test', 'xlsx')
    const parsedBlueprint = parseReportsAnalyticsBlueprint(
      JSON.stringify({
        summary: 'SofLIA encontro riesgo en cursos y oportunidad de seguimiento.',
        sections: [
          { id: 'executive', title: 'Resumen directivo', purpose: 'Priorizar acciones', priority: 1 },
          { id: 'courses', title: 'Cursos', purpose: 'Revisar avance', priority: 2 },
        ],
        featuredMetrics: [{ label: 'Progreso', value: '50%', detail: 'Prueba' }],
        findings: [{ title: 'Hallazgo', points: ['Punto operativo'] }],
        risks: ['Riesgo operativo'],
        recommendations: ['Accion recomendada'],
        artifactPlan: [
          { id: 'executive', title: 'Resumen directivo', description: 'Resumen', includeInCsv: true, includeInWorkbook: true },
        ],
      }),
      {
        dataset: result,
        locale: 'es',
        model: 'gemini-test',
        format: 'xlsx',
      },
    )
    const aiPayload = buildReportsAnalyticsAiPayload(result)

    expect(result.overview.totalUsers).toBe(2)
    expect(result.overview.completionRate).toBe(100)
    expect(result.learning.completedCourses).toBe(1)
    expect(result.learning.completionsTrend.every((point) => point.value === 0)).toBe(true)
    expect(result.demographics.missingGender).toBe(1)
    expect(result.dataQuality.usersMissingDemographics).toBe(1)
    expect(result.soflia.totalConversations).toBe(1)
    expect(result.soflia.totalMessages).toBe(4)
    expect(result.activities.totalActivities).toBe(2)
    expect(result.activities.completedActivities).toBe(2)
    expect(result.loginHeatmap.some((cell) => cell.dayKey === 'mon' && cell.hour === 15 && cell.value === 1)).toBe(true)
    expect(result.connectionCalendar.some((cell) => cell.date === '2026-04-27' && cell.value === 1)).toBe(true)
    expect(result.rankings.regions[0]).toEqual(expect.objectContaining({ name: 'Norte' }))
    expect(result.quality.overallScore).toBeGreaterThan(0)
    expect(result.userDetails[0]).toEqual(
      expect.objectContaining({
        email: 'ada@example.com',
        coursesCompleted: 1,
        sofliaConversations: 1,
        teamName: 'Ventas Norte',
      }),
    )
    expect(fallbackBlueprint.source).toBe('fallback')
    expect(fallbackBlueprint.sections.map((section) => section.id)).toEqual(
      expect.arrayContaining(['executive', 'dashboard', 'trends', 'courses', 'users', 'segments', 'quality', 'rawData']),
    )
    expect(parsedBlueprint?.source).toBe('gemini')
    expect(parsedBlueprint?.sections[0].id).toBe('executive')
    expect(JSON.stringify(aiPayload)).not.toContain('ada@example.com')
    expect(JSON.stringify(aiPayload)).not.toContain('Ada')

    const zipBytes = await generateReportsAnalyticsZip(result, 'es', fallbackBlueprint)
    const zip = await JSZip.loadAsync(zipBytes)
    const activitiesCsv = await zip.file('actividades_evaluaciones.csv')?.async('string')
    const learningCsv = await zip.file('tendencia_aprendizaje.csv')?.async('string')
    const courseCsv = await zip.file('progreso_cursos.csv')?.async('string')
    const executiveCsv = await zip.file('resumen_ejecutivo.csv')?.async('string')

    expect(activitiesCsv).toContain('Evaluaciones respondidas')
    expect(activitiesCsv).not.toContain('metric')
    expect(learningCsv).not.toContain('Vista')
    expect(learningCsv).not.toContain('#')
    expect(courseCsv).not.toContain('Vista')
    expect(courseCsv).not.toContain('#')
    expect(executiveCsv).toContain(fallbackBlueprint.summary)

    const workbookBytes = await generateReportsAnalyticsWorkbook(result, 'es', fallbackBlueprint)
    expect(workbookBytes.length).toBeGreaterThan(1000)
    const ExcelJS = await import('exceljs')
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(Buffer.from(workbookBytes))
    const worksheetNames = workbook.worksheets.map((worksheet) => worksheet.name)
    expect(worksheetNames).toEqual(
      expect.arrayContaining(['Resumen SofLIA', 'Dashboard', 'Tendencias', 'Cursos', 'Usuarios', 'Segmentos', 'Calidad', 'Datos crudos']),
    )
    const coursesSheet = workbook.getWorksheet('Cursos')
    expect(coursesSheet).toBeDefined()
    expect(() => coursesSheet?.getTable('CoursesTable')).not.toThrow()
    expect(coursesSheet?.autoFilter).toBeTruthy()
    expect(coursesSheet?.getColumn(1).width).toBeGreaterThan(30)
    expect(coursesSheet?.getCell('A1').value).toBe('Cursos')
  })
})
