import { describe, expect, it } from 'vitest'

import type { ReportsAnalyticsAiInsights } from '../../../types/reports-analytics.types'
import { reconcileReportsAnalyticsInsights } from '../reports-analytics-insights/integrity'
import { buildReportsAnalyticsDataset } from '../reports-analytics.server.service'
import { buildReportsAnalyticsQueryData } from './fixtures/query-data.fixture'
import { reportsAnalyticsFilters } from './fixtures/filters.fixture'

describe('reports analytics metric integrity', () => {
  it('includes every organization course before filtering enrollment state', () => {
    const queryData = buildReportsAnalyticsQueryData()
    queryData.assignments.push(
      {
        id: 'assignment-2',
        user_id: 'user-1',
        course_id: 'course-2',
        status: 'assigned',
        completion_percentage: 0,
        assigned_at: '2026-01-01T00:00:00.000Z',
        due_date: null,
        completed_at: null,
        updated_at: '2026-01-01T00:00:00.000Z',
        courses: { id: 'course-2', title: 'Liderazgo' },
      },
      {
        id: 'assignment-3',
        user_id: 'user-2',
        course_id: 'course-3',
        status: 'assigned',
        completion_percentage: 0,
        assigned_at: '2026-01-01T00:00:00.000Z',
        due_date: null,
        completed_at: null,
        updated_at: '2026-01-01T00:00:00.000Z',
        courses: { id: 'course-3', title: 'Comunicacion' },
      },
    )
    queryData.enrollments.push(
      {
        enrollment_id: 'enrollment-2',
        user_id: 'user-1',
        course_id: 'course-2',
        enrollment_status: 'active',
        overall_progress_percentage: 50,
        enrolled_at: '2026-01-01T00:00:00.000Z',
        started_at: '2026-01-02T00:00:00.000Z',
        completed_at: null,
        last_accessed_at: '2026-04-20T00:00:00.000Z',
        updated_at: '2026-04-20T00:00:00.000Z',
        courses: { id: 'course-2', title: 'Liderazgo' },
      },
      {
        enrollment_id: 'external-enrollment',
        user_id: 'user-1',
        course_id: 'external-course',
        enrollment_status: 'completed',
        overall_progress_percentage: 100,
        enrolled_at: '2026-01-01T00:00:00.000Z',
        started_at: '2026-01-01T00:00:00.000Z',
        completed_at: '2026-01-02T00:00:00.000Z',
        last_accessed_at: '2026-01-02T00:00:00.000Z',
        updated_at: '2026-01-02T00:00:00.000Z',
        courses: { id: 'external-course', title: 'Curso externo' },
      },
    )

    const dataset = buildReportsAnalyticsDataset(queryData, reportsAnalyticsFilters)

    expect(dataset.courses.map((course) => course.courseId).sort()).toEqual([
      'course-1',
      'course-2',
      'course-3',
    ])
    expect(dataset.learning).toEqual(expect.objectContaining({
      assignedCourses: 3,
      completedCourses: 1,
      inProgressCourses: 1,
      notStartedCourses: 1,
    }))
    expect(dataset.overview.averageProgress).toBe(50)
    expect(dataset.overview.completionRate).toBe(33.3)
  })

  it('replaces model-written facts with canonical dataset metrics', () => {
    const dataset = buildReportsAnalyticsDataset(
      buildReportsAnalyticsQueryData(),
      reportsAnalyticsFilters,
    )
    const generated: ReportsAnalyticsAiInsights = {
      generatedAt: '2026-07-31T18:00:00.000Z',
      model: 'test-model',
      summary: 'Progreso inventado 99.9% y 999 usuarios en riesgo.',
      executiveMetrics: [
        { label: 'Dato maquillado', value: '999%', detail: 'No pertenece al panel' },
      ],
      findings: [{ title: 'Inventado', points: ['999 personas completaron'] }],
      risks: ['Riesgo inventado de 999%'],
      recommendations: [
        'Crear una cadencia de seguimiento con responsables claros.',
        'Revisar las barreras de acceso con cada lider de equipo.',
        'Priorizar acompanamiento para quienes muestran bajo avance.',
        'Contactar a 999 personas.',
      ],
      actionPlan: [
        {
          title: 'Seguimiento operativo',
          points: [
            'Asignar responsables y documentar cada intervencion.',
            'Cerrar el plan en 7 dias.',
          ],
        },
      ],
    }

    const reconciled = reconcileReportsAnalyticsInsights(dataset, generated, 'es')

    expect(reconciled.summary).not.toContain('999')
    expect(reconciled.executiveMetrics?.some((metric) => metric.value === '999%')).toBe(false)
    expect(reconciled.executiveMetrics?.[0]?.value).toBe(`${dataset.overview.averageProgress}%`)
    expect(reconciled.findings.flatMap((section) => section.points).join(' ')).not.toContain('999')
    expect(reconciled.findings.flatMap((section) => section.points).join(' ')).not.toContain('0 vencimientos')
    expect(reconciled.recommendations).not.toContain('Contactar a 999 personas.')
    expect(reconciled.actionPlan?.[0]?.points).toEqual([
      'Asignar responsables y documentar cada intervencion.',
    ])
  })

  it('uses one risk definition for the executive count and priority table', () => {
    const dataset = buildReportsAnalyticsDataset(
      buildReportsAnalyticsQueryData(),
      reportsAnalyticsFilters,
    )

    expect(dataset.overview.atRiskUsersCount).toBe(dataset.priorityUsers.length)
    expect(dataset.overview.complianceRate).toBe(
      dataset.overview.assignedUsersCount > 0
        ? Math.round(
          ((dataset.overview.assignedUsersCount - dataset.priorityUsers.length)
            / dataset.overview.assignedUsersCount) * 1000,
        ) / 10
        : 0,
    )
  })

  it('builds evaluated evidence only from recorded assessments and activity outcomes', () => {
    const queryData = buildReportsAnalyticsQueryData()
    queryData.lessonNotes.push({
      note_id: 'note-1',
      user_id: 'user-1',
      course_id: 'course-1',
      lesson_id: 'lesson-1',
      note_content: 'Una nota extensa no debe convertirse en una calificacion inventada.',
      is_auto_generated: false,
      created_at: '2026-02-18T00:00:00.000Z',
      updated_at: '2026-02-18T00:00:00.000Z',
      courses: { id: 'course-1', title: 'IA para ventas' },
    })

    const dataset = buildReportsAnalyticsDataset(queryData, reportsAnalyticsFilters)

    expect(dataset.quality.evidenceCount).toBe(2)
    expect(dataset.quality.overallScore).toBe(100)
    expect(dataset.quality.notesScore).toBe(100)
    expect(dataset.quality.sofliaScore).toBe(100)
  })
})
