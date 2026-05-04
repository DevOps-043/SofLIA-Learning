import { GoogleGenerativeAI } from '@google/generative-ai'
import { logger } from '@/lib/utils/logger'
import type {
  ReportsAnalyticsAiInsights,
  ReportsAnalyticsDataset,
  ReportsAnalyticsLocale,
} from '../../types/reports-analytics.types'
import {
  buildReportsAnalyticsAiPayload,
  extractJsonObject,
  resolveReportsAnalyticsGeminiModel,
} from './reports-analytics.ai-payload.service'

interface GenerateReportsAnalyticsInsightsParams {
  dataset: ReportsAnalyticsDataset
  locale: ReportsAnalyticsLocale
  requestedByUserId?: string
}

export async function generateReportsAnalyticsInsights({
  dataset,
  locale,
}: GenerateReportsAnalyticsInsightsParams): Promise<ReportsAnalyticsAiInsights> {
  const apiKey = process.env.GOOGLE_API_KEY
  const model = resolveReportsAnalyticsGeminiModel()

  if (!apiKey) {
    return buildFallbackInsights(dataset, locale, model)
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const generativeModel = genAI.getGenerativeModel({
      model,
      systemInstruction: buildSystemPrompt(locale),
    })
    const result = await generativeModel.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: JSON.stringify(buildReportsAnalyticsAiPayload(dataset)),
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2200,
        responseMimeType: 'application/json',
      },
    })

    const rawContent = result.response.text()
    const parsed = parseInsights(rawContent, model)
    if (parsed) return parsed
  } catch (error) {
    logger.error('Reports analytics Gemini insights failed', error)
  }

  return buildFallbackInsights(dataset, locale, model)
}

export async function generateReportsAnalyticsInsightsPdf({
  dataset,
  insights,
  locale,
}: {
  dataset: ReportsAnalyticsDataset
  insights: ReportsAnalyticsAiInsights
  locale: ReportsAnalyticsLocale
}): Promise<Uint8Array> {
  const JsPDF = (await import('jspdf')).default
  const pdf = new JsPDF('p', 'pt', 'a4')
  const labels = INSIGHTS_PDF_LABELS[locale] || INSIGHTS_PDF_LABELS.es
  const page = {
    width: pdf.internal.pageSize.getWidth(),
    height: pdf.internal.pageSize.getHeight(),
    margin: 40,
  }
  const colors = {
    primary: [10, 37, 64] as const,
    accent: [0, 180, 150] as const,
    text: [17, 24, 39] as const,
    muted: [82, 94, 112] as const,
    line: [220, 226, 235] as const,
    surface: [247, 249, 252] as const,
    danger: [239, 68, 68] as const,
  }
  let y = 0

  const ensureSpace = (height: number) => {
    if (y + height <= page.height - page.margin) return
    pdf.addPage()
    addHeader(false)
  }

  const addHeader = (firstPage: boolean) => {
    y = page.margin
    pdf.setFillColor(...colors.primary)
    pdf.roundedRect(page.margin, y, page.width - page.margin * 2, 92, 10, 10, 'F')
    pdf.setTextColor(255, 255, 255)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(firstPage ? 22 : 16)
    pdf.text(labels.title, page.margin + 24, y + 34)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(10)
    pdf.text(`${labels.generatedAt}: ${new Date(insights.generatedAt).toLocaleString(locale)}`, page.margin + 24, y + 58)
    pdf.text(`${labels.period}: ${formatDate(dataset.period.from, locale)} - ${formatDate(dataset.period.to, locale)}`, page.margin + 24, y + 74)
    y += 118
  }

  const addHeading = (text: string, size = 15) => {
    ensureSpace(size + 24)
    pdf.setTextColor(...colors.text)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(size)
    pdf.text(text, page.margin, y)
    y += size + 10
  }

  const addParagraph = (text: string, size = 10) => {
    ensureSpace(26)
    pdf.setTextColor(...colors.muted)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(size)
    pdf.splitTextToSize(text, page.width - page.margin * 2).forEach((line: string) => {
      ensureSpace(size + 8)
      pdf.text(line, page.margin, y)
      y += size + 5
    })
    y += 4
  }

  const addMetricCards = (items: Array<{ label: string; value: string | number; detail?: string }>) => {
    const gap = 12
    const cardWidth = (page.width - page.margin * 2 - gap) / 2
    const cardHeight = 70
    items.forEach((item, index) => {
      const column = index % 2
      if (column === 0) ensureSpace(cardHeight + 10)
      const x = page.margin + column * (cardWidth + gap)
      const cardY = y
      pdf.setFillColor(...colors.surface)
      pdf.roundedRect(x, cardY, cardWidth, cardHeight, 8, 8, 'F')
      pdf.setDrawColor(...colors.line)
      pdf.roundedRect(x, cardY, cardWidth, cardHeight, 8, 8, 'S')
      pdf.setTextColor(...colors.muted)
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(8)
      pdf.text(item.label, x + 12, cardY + 18)
      pdf.setTextColor(...colors.text)
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(17)
      pdf.text(String(item.value), x + 12, cardY + 42)
      if (item.detail) {
        pdf.setTextColor(...colors.muted)
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(8)
        pdf.text(pdf.splitTextToSize(item.detail, cardWidth - 24)[0] || '', x + 12, cardY + 57)
      }
      if (column === 1 || index === items.length - 1) y += cardHeight + 10
    })
  }

  const addCallout = (text: string) => {
    ensureSpace(74)
    pdf.setFillColor(...colors.surface)
    pdf.roundedRect(page.margin, y, page.width - page.margin * 2, 64, 8, 8, 'F')
    pdf.setDrawColor(...colors.accent)
    pdf.setLineWidth(2)
    pdf.line(page.margin + 1, y + 10, page.margin + 1, y + 54)
    pdf.setLineWidth(1)
    pdf.setTextColor(...colors.text)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(11)
    pdf.splitTextToSize(text, page.width - page.margin * 2 - 28).slice(0, 3).forEach((line: string, index: number) => {
      pdf.text(line, page.margin + 16, y + 22 + index * 14)
    })
    y += 78
  }

  const addBulletList = (rows: string[]) => {
    rows.forEach((row) => {
      ensureSpace(24)
      pdf.setFillColor(...colors.accent)
      pdf.circle(page.margin + 4, y - 3, 2, 'F')
      pdf.setTextColor(...colors.muted)
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(9)
      pdf.splitTextToSize(row, page.width - page.margin * 2 - 16).forEach((line: string) => {
        pdf.text(line, page.margin + 14, y)
        y += 12
      })
      y += 4
    })
  }

  const addCompactTable = (headers: string[], rows: string[][], widths: number[]) => {
    const rowHeight = 22
    ensureSpace((rows.length + 2) * rowHeight)
    pdf.setFillColor(...colors.primary)
    pdf.rect(page.margin, y, page.width - page.margin * 2, rowHeight, 'F')
    pdf.setTextColor(255, 255, 255)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(8)
    let x = page.margin + 8
    headers.forEach((header, index) => {
      pdf.text(header, x, y + 14)
      x += widths[index]
    })
    y += rowHeight
    rows.forEach((row, rowIndex) => {
      ensureSpace(rowHeight)
      if (rowIndex % 2 === 0) {
        pdf.setFillColor(...colors.surface)
        pdf.rect(page.margin, y, page.width - page.margin * 2, rowHeight, 'F')
      }
      pdf.setTextColor(...colors.text)
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(8)
      x = page.margin + 8
      row.forEach((cell, index) => {
        pdf.text(pdf.splitTextToSize(cell, widths[index] - 10)[0] || '', x, y + 14)
        x += widths[index]
      })
      y += rowHeight
    })
    y += 10
  }

  addHeader(true)
  addCallout(insights.summary)

  addHeading(labels.executiveMetrics, 14)
  if (insights.executiveMetrics?.length) {
    addMetricCards(insights.executiveMetrics.slice(0, 6).map((metric) => ({
      label: metric.label,
      value: metric.value,
      detail: metric.detail,
    })))
  } else {
    addMetricCards([
      { label: labels.progress, value: `${dataset.overview.averageProgress}%`, detail: `${labels.completion}: ${dataset.overview.completionRate}%` },
      { label: labels.soflia, value: `${dataset.overview.sofliaAdoptionRate}%`, detail: `${dataset.soflia.totalConversations} ${labels.conversations}` },
      { label: labels.quality, value: `${dataset.quality.overallScore}%` },
      { label: labels.activities, value: dataset.activities.totalActivities, detail: `${dataset.activities.quizAttempts} evaluaciones` },
    ])
  }

  addHeading(labels.operationalSnapshot, 14)
  addMetricCards([
    { label: labels.users, value: dataset.overview.totalUsers, detail: `${labels.activeUsers}: ${dataset.overview.activeLearners} (${dataset.overview.activeLearnerRate}%)` },
    { label: labels.learning, value: `${dataset.learning.completedCourses}/${dataset.learning.assignedCourses}`, detail: `${labels.averageCompletionDays}: ${dataset.learning.averageCompletionDays}` },
    { label: labels.notes, value: `${dataset.overview.notesAdoptionRate}%`, detail: `${dataset.notes.totalNotes} ${labels.notesCreated}` },
    { label: labels.planner, value: `${dataset.overview.plannerAdherenceRate}%`, detail: `${dataset.planner.completedSessions}/${dataset.planner.plannedSessions}` },
  ])

  addHeading(labels.findings, 14)
  insights.findings.forEach((section) => {
    addHeading(section.title, 12)
    addBulletList(section.points)
  })

  addHeading(labels.segments, 14)
  addCompactTable(
    [labels.segment, labels.users, labels.progress, labels.quality],
    buildInsightSegmentRows(dataset, labels).slice(0, 8).map((segment) => [
      segment.label,
      String(segment.users),
      `${segment.averageProgress}%`,
      `${segment.qualityScore}%`,
    ]),
    [220, 70, 90, 90],
  )

  addHeading(labels.hierarchy, 14)
  addCompactTable(
    [labels.rank, labels.name, labels.progress, labels.quality, 'Score'],
    buildInsightHierarchyRows(dataset).slice(0, 8).map((row, index) => [
      String(index + 1),
      row.name,
      `${row.averageProgress}%`,
      `${row.qualityScore}%`,
      `${row.rankScore}%`,
    ]),
    [42, 210, 82, 82, 62],
  )

  addHeading(labels.courseRisks, 14)
  addCompactTable(
    [labels.course, labels.progress, labels.completed, labels.overdue],
    dataset.courses.slice(0, 8).map((course) => [
      course.courseTitle,
      `${course.averageProgress}%`,
      `${course.completedUsers}/${course.assignedUsers}`,
      String(course.overdueAssignments),
    ]),
    [260, 82, 82, 62],
  )

  addHeading(labels.risks, 14)
  addBulletList(insights.risks)

  addHeading(labels.recommendations, 14)
  addBulletList(insights.recommendations)

  if (insights.actionPlan?.length) {
    addHeading(labels.actionPlan, 14)
    insights.actionPlan.forEach((section) => {
      addHeading(section.title, 12)
      addBulletList(section.points)
    })
  }

  return new Uint8Array(pdf.output('arraybuffer'))
}

export function buildReportsAnalyticsInsightsFilename(
  dataset: Pick<ReportsAnalyticsDataset, 'period'>,
): string {
  const from = dataset.period.from.slice(0, 10)
  const to = dataset.period.to.slice(0, 10)
  return `soflia-insights-${from}-${to}.pdf`
}

function buildSystemPrompt(locale: ReportsAnalyticsLocale): string {
  const language = locale === 'en' ? 'English' : locale === 'pt' ? 'Portuguese' : 'Spanish'
  return [
    `You are an HR analytics assistant for a B2B learning platform. Respond in ${language}.`,
    'Use only the provided aggregated metrics and anonymized samples.',
    'Do not infer identities, names, emails, medical status, protected-class conclusions, or private facts.',
    'You may compare age bands and gender only as statistical segments from the data, with careful wording.',
    'Return only valid JSON with this shape: {"summary":"...","executiveMetrics":[{"label":"...","value":"...","detail":"..."}],"findings":[{"title":"...","points":["..."]}],"risks":["..."],"recommendations":["..."],"actionPlan":[{"title":"...","points":["..."]}]}.',
    'Act as a complete analytics agent: choose the most relevant patterns, connect them across learning, activities, assessments, SofLIA, planning, segments, hierarchy, and course risk.',
    'Use the exact metric values from the payload. Do not invent tables, database names, people, or hidden causes.',
    'Keep every point operational: what is happening, where, likely cause from evidence, and what action to take next.',
  ].join('\n')
}

function parseInsights(value: string | undefined, model: string): ReportsAnalyticsAiInsights | null {
  if (!value) return null

  try {
    const parsed = JSON.parse(extractJsonObject(value)) as Partial<ReportsAnalyticsAiInsights>
    if (!parsed.summary || !Array.isArray(parsed.findings)) return null

    return {
      generatedAt: new Date().toISOString(),
      model,
      summary: String(parsed.summary),
      executiveMetrics: Array.isArray(parsed.executiveMetrics)
        ? parsed.executiveMetrics
          .filter((metric) => metric && typeof metric === 'object')
          .slice(0, 6)
          .map((metric) => ({
            label: String((metric as { label?: unknown }).label || ''),
            value: String((metric as { value?: unknown }).value || ''),
            detail: String((metric as { detail?: unknown }).detail || ''),
          }))
        : [],
      findings: parsed.findings
        .filter((section) => section && typeof section === 'object')
        .slice(0, 8)
        .map((section) => ({
          title: String((section as { title?: unknown }).title || ''),
          points: Array.isArray((section as { points?: unknown }).points)
            ? ((section as { points: unknown[] }).points).map(String).slice(0, 5)
            : [],
        })),
      risks: Array.isArray(parsed.risks) ? parsed.risks.map(String).slice(0, 8) : [],
      recommendations: Array.isArray(parsed.recommendations)
        ? parsed.recommendations.map(String).slice(0, 8)
        : [],
      actionPlan: Array.isArray(parsed.actionPlan)
        ? parsed.actionPlan
          .filter((section) => section && typeof section === 'object')
          .slice(0, 4)
          .map((section) => ({
            title: String((section as { title?: unknown }).title || ''),
            points: Array.isArray((section as { points?: unknown }).points)
              ? ((section as { points: unknown[] }).points).map(String).slice(0, 5)
              : [],
          }))
        : [],
    }
  } catch {
    return null
  }
}

function buildInsightSegmentRows(dataset: ReportsAnalyticsDataset, labels: Record<string, string>) {
  return [
    ...dataset.segments.ageBands.map((row) => ({ ...row, label: `${labels.age}: ${row.label}` })),
    ...dataset.segments.gender.map((row) => ({ ...row, label: `${labels.gender}: ${row.label}` })),
    ...dataset.segments.jobTitles.map((row) => ({ ...row, label: `${labels.jobTitle}: ${row.label}` })),
    ...dataset.segments.roles.map((row) => ({ ...row, label: `${labels.role}: ${row.label}` })),
  ].sort((a, b) => a.qualityScore - b.qualityScore || a.averageProgress - b.averageProgress)
}

function buildInsightHierarchyRows(dataset: ReportsAnalyticsDataset) {
  return [
    ...dataset.rankings.regions,
    ...dataset.rankings.zones,
    ...dataset.rankings.teams,
  ].sort((a, b) => b.rankScore - a.rankScore)
}

function formatDate(value: string, locale: ReportsAnalyticsLocale): string {
  return new Date(value).toLocaleDateString(locale)
}

function buildFallbackInsights(
  dataset: ReportsAnalyticsDataset,
  locale: ReportsAnalyticsLocale,
  model: string,
): ReportsAnalyticsAiInsights {
  const bestRegion = dataset.rankings.regions[0]
  const riskCourse = dataset.courses[0]
  const weakestAgeBand = [...dataset.segments.ageBands].sort((a, b) => a.qualityScore - b.qualityScore)[0]
  const language = FALLBACK_TEXT[locale] || FALLBACK_TEXT.es

  return {
    generatedAt: new Date().toISOString(),
    model: `${model}:fallback`,
    summary: language.summary(dataset.overview.qualityScore, dataset.overview.averageProgress),
    executiveMetrics: [
      {
        label: language.metricProgress,
        value: `${dataset.overview.averageProgress}%`,
        detail: language.metricProgressDetail(dataset.overview.completionRate, dataset.learning.medianCompletionDays),
      },
      {
        label: language.metricSoflia,
        value: `${dataset.overview.sofliaAdoptionRate}%`,
        detail: language.metricSofliaDetail(dataset.soflia.totalConversations, dataset.soflia.totalMessages),
      },
      {
        label: language.metricQuality,
        value: `${dataset.quality.overallScore}%`,
        detail: language.metricQualityDetail(dataset.quality.quizScore, dataset.quality.activityScore, dataset.quality.sofliaScore),
      },
    ],
    findings: [
      {
        title: language.learningTitle,
        points: [
          language.learningPoint(dataset.overview.completionRate, dataset.learning.averageCompletionDays),
          riskCourse ? language.riskCourse(riskCourse.courseTitle, riskCourse.overdueAssignments) : language.noRiskCourse,
        ],
      },
      {
        title: language.adoptionTitle,
        points: [
          language.adoptionPoint(dataset.overview.sofliaAdoptionRate, dataset.overview.notesAdoptionRate),
          bestRegion ? language.bestRegion(bestRegion.name, bestRegion.rankScore) : language.noHierarchy,
        ],
      },
      {
        title: language.qualityTitle,
        points: [
          language.qualityPoint(dataset.quality.overallScore, dataset.quality.offTopicRate),
          weakestAgeBand ? language.segmentPoint(weakestAgeBand.label, weakestAgeBand.qualityScore) : language.noSegment,
        ],
      },
    ],
    risks: [
      language.riskQuality(dataset.quality.helpRate),
      language.riskData(dataset.dataQuality.demographicsCompletionRate),
    ],
    recommendations: [
      language.recommendSoflia,
      language.recommendHierarchy,
      language.recommendQuality,
    ],
    actionPlan: [
      {
        title: language.actionPlanTitle,
        points: [
          language.actionPlanSegment,
          language.actionPlanCourse,
          language.actionPlanData,
        ],
      },
    ],
  }
}

const INSIGHTS_PDF_LABELS: Record<ReportsAnalyticsLocale, Record<string, string>> = {
  es: {
    title: 'Reporte SofLIA de analytics',
    generatedAt: 'Generado',
    period: 'Periodo',
    executiveMetrics: 'Metricas ejecutivas',
    operationalSnapshot: 'Lectura operativa',
    users: 'Usuarios',
    activeUsers: 'Usuarios activos',
    learning: 'Aprendizaje',
    activities: 'Actividades',
    progress: 'Progreso',
    completion: 'Finalizacion',
    completed: 'Completados',
    averageCompletionDays: 'Dias promedio de cierre',
    soflia: 'SofLIA',
    conversations: 'conversaciones',
    notes: 'Notas',
    notesCreated: 'notas creadas',
    planner: 'Planificacion',
    quality: 'Calidad',
    findings: 'Hallazgos',
    segments: 'Segmentos a observar',
    age: 'Edad',
    gender: 'Genero',
    jobTitle: 'Puesto',
    role: 'Rol',
    hierarchy: 'Ranking por jerarquia',
    courseRisks: 'Cursos con riesgo',
    segment: 'Segmento',
    rank: '#',
    name: 'Nombre',
    course: 'Curso',
    overdue: 'Vencidos',
    risks: 'Riesgos',
    recommendations: 'Recomendaciones',
    actionPlan: 'Plan de accion',
  },
  en: {
    title: 'SofLIA analytics report',
    generatedAt: 'Generated',
    period: 'Period',
    executiveMetrics: 'Executive metrics',
    operationalSnapshot: 'Operational read',
    users: 'Users',
    activeUsers: 'Active users',
    learning: 'Learning',
    activities: 'Activities',
    progress: 'Progress',
    completion: 'Completion',
    completed: 'Completed',
    averageCompletionDays: 'Average closing days',
    soflia: 'SofLIA',
    conversations: 'conversations',
    notes: 'Notes',
    notesCreated: 'notes created',
    planner: 'Planning',
    quality: 'Quality',
    findings: 'Findings',
    segments: 'Segments to watch',
    age: 'Age',
    gender: 'Gender',
    jobTitle: 'Job title',
    role: 'Role',
    hierarchy: 'Hierarchy ranking',
    courseRisks: 'Course risks',
    segment: 'Segment',
    rank: '#',
    name: 'Name',
    course: 'Course',
    overdue: 'Overdue',
    risks: 'Risks',
    recommendations: 'Recommendations',
    actionPlan: 'Action plan',
  },
  pt: {
    title: 'Relatorio SofLIA de analytics',
    generatedAt: 'Gerado',
    period: 'Periodo',
    executiveMetrics: 'Metricas executivas',
    operationalSnapshot: 'Leitura operacional',
    users: 'Usuarios',
    activeUsers: 'Usuarios ativos',
    learning: 'Aprendizagem',
    activities: 'Atividades',
    progress: 'Progresso',
    completion: 'Conclusao',
    completed: 'Concluidos',
    averageCompletionDays: 'Dias medios de fechamento',
    soflia: 'SofLIA',
    conversations: 'conversas',
    notes: 'Notas',
    notesCreated: 'notas criadas',
    planner: 'Planejamento',
    quality: 'Qualidade',
    findings: 'Achados',
    segments: 'Segmentos a observar',
    age: 'Idade',
    gender: 'Genero',
    jobTitle: 'Cargo',
    role: 'Funcao',
    hierarchy: 'Ranking por hierarquia',
    courseRisks: 'Cursos com risco',
    segment: 'Segmento',
    rank: '#',
    name: 'Nome',
    course: 'Curso',
    overdue: 'Vencidos',
    risks: 'Riscos',
    recommendations: 'Recomendacoes',
    actionPlan: 'Plano de acao',
  },
}

const FALLBACK_TEXT = {
  es: {
    learningTitle: 'Aprendizaje y finalización',
    adoptionTitle: 'Adopción de IA y notas',
    qualityTitle: 'Calidad de respuestas',
    metricProgress: 'Progreso y cierre',
    metricSoflia: 'Adopción SofLIA',
    metricQuality: 'Calidad operativa',
    actionPlanTitle: 'Plan de acción sugerido',
    noHierarchy: 'No hay jerarquía suficiente para comparar regiones, zonas o áreas.',
    noRiskCourse: 'No hay cursos con señales críticas en el periodo filtrado.',
    noSegment: 'No hay segmentos suficientes para comparar calidad.',
    recommendSoflia: 'Refuerza el uso de SofLIA en los segmentos con menor adopción y cruza el seguimiento con avance de curso.',
    recommendHierarchy: 'Usa el cuadro de honor por región, zona y área para replicar prácticas de los equipos con mejor score.',
    recommendQuality: 'Revisa actividades con baja calidad y alto uso de ayuda para ajustar instrucciones, ejemplos y criterios.',
    actionPlanSegment: 'Prioriza segmentos con baja calidad o bajo avance antes de ampliar nuevas asignaciones.',
    actionPlanCourse: 'Revisa cursos con mayor riesgo operativo y cruza avance, vencimientos y ayuda solicitada.',
    actionPlanData: 'Completa datos demográficos faltantes para mejorar precisión estadística de RRHH.',
    summary: (quality: number, progress: number) => `Lectura automática: la calidad global es ${quality}% y el progreso promedio es ${progress}%.`,
    metricProgressDetail: (completion: number, days: number) => `Finalización ${completion}% y mediana de cierre ${days} días.`,
    metricSofliaDetail: (conversations: number, messages: number) => `${conversations} conversaciones y ${messages} mensajes analizados.`,
    metricQualityDetail: (quiz: number, activity: number, soflia: number) => `Evaluaciones ${quiz}%, actividades ${activity}% y SofLIA ${soflia}%.`,
    learningPoint: (completion: number, days: number) => `La finalización global es ${completion}% y el tiempo promedio de cierre es ${days} días.`,
    riskCourse: (title: string, overdue: number) => `${title} concentra riesgo operativo con ${overdue} vencimientos.`,
    adoptionPoint: (soflia: number, notes: number) => `La adopción de SofLIA es ${soflia}% y la adopción de notas es ${notes}%.`,
    bestRegion: (name: string, score: number) => `${name} lidera el ranking regional con score ${score}%.`,
    qualityPoint: (quality: number, offTopic: number) => `El score de calidad es ${quality}% y la tasa fuera de tema es ${offTopic}%.`,
    segmentPoint: (label: string, score: number) => `${label} requiere revisión: registra score de calidad ${score}%.`,
    riskQuality: (help: number) => `Usuarios que piden ayuda en actividades: ${help}%.`,
    riskData: (completion: number) => `Demografía completa: ${completion}%. Los faltantes reducen precisión estadística.`,
  },
  en: {
    learningTitle: 'Learning and completion',
    adoptionTitle: 'AI and notes adoption',
    qualityTitle: 'Response quality',
    metricProgress: 'Progress and closure',
    metricSoflia: 'SofLIA adoption',
    metricQuality: 'Operational quality',
    actionPlanTitle: 'Suggested action plan',
    noHierarchy: 'There is not enough hierarchy data to compare regions, zones, or areas.',
    noRiskCourse: 'No course shows critical risk signals in the filtered period.',
    noSegment: 'There are not enough segments to compare quality.',
    recommendSoflia: 'Increase SofLIA adoption in lower-adoption segments and cross-check it with course progress.',
    recommendHierarchy: 'Use the leaderboard by region, zone, and area to replicate practices from top scoring teams.',
    recommendQuality: 'Review activities with low quality and high help usage to adjust instructions, examples, and criteria.',
    actionPlanSegment: 'Prioritize follow-up for segments with low quality or low progress before expanding new assignments.',
    actionPlanCourse: 'Review highest-risk courses and compare progress, overdue work, and help requests.',
    actionPlanData: 'Complete missing demographic data to improve HR statistical precision.',
    summary: (quality: number, progress: number) => `Automatic read: overall quality is ${quality}% and average progress is ${progress}%.`,
    metricProgressDetail: (completion: number, days: number) => `Completion ${completion}% and median closure ${days} days.`,
    metricSofliaDetail: (conversations: number, messages: number) => `${conversations} conversations and ${messages} messages analyzed.`,
    metricQualityDetail: (quiz: number, activity: number, soflia: number) => `Assessments ${quiz}%, activities ${activity}%, and SofLIA ${soflia}%.`,
    learningPoint: (completion: number, days: number) => `Overall completion is ${completion}% and average closing time is ${days} days.`,
    riskCourse: (title: string, overdue: number) => `${title} concentrates operational risk with ${overdue} overdue items.`,
    adoptionPoint: (soflia: number, notes: number) => `SofLIA adoption is ${soflia}% and notes adoption is ${notes}%.`,
    bestRegion: (name: string, score: number) => `${name} leads the regional ranking with a ${score}% score.`,
    qualityPoint: (quality: number, offTopic: number) => `Quality score is ${quality}% and off-topic rate is ${offTopic}%.`,
    segmentPoint: (label: string, score: number) => `${label} needs review: quality score is ${score}%.`,
    riskQuality: (help: number) => `Users needing activity help: ${help}%.`,
    riskData: (completion: number) => `Complete demographics: ${completion}%. Missing fields reduce statistical precision.`,
  },
  pt: {
    learningTitle: 'Aprendizagem e conclusão',
    adoptionTitle: 'Adoção de IA e notas',
    qualityTitle: 'Qualidade das respostas',
    metricProgress: 'Progresso e fechamento',
    metricSoflia: 'Adoção SofLIA',
    metricQuality: 'Qualidade operacional',
    actionPlanTitle: 'Plano de ação sugerido',
    noHierarchy: 'Não há hierarquia suficiente para comparar regiões, zonas ou áreas.',
    noRiskCourse: 'Nenhum curso mostra sinais críticos no período filtrado.',
    noSegment: 'Não há segmentos suficientes para comparar qualidade.',
    recommendSoflia: 'Reforce o uso do SofLIA nos segmentos com menor adoção e cruze com progresso de curso.',
    recommendHierarchy: 'Use o quadro de honra por região, zona e área para replicar práticas dos melhores times.',
    recommendQuality: 'Revise atividades com baixa qualidade e alto uso de ajuda para ajustar instruções, exemplos e critérios.',
    actionPlanSegment: 'Priorize segmentos com baixa qualidade ou baixo progresso antes de ampliar novas atribuições.',
    actionPlanCourse: 'Revise cursos de maior risco e compare progresso, vencimentos e pedidos de ajuda.',
    actionPlanData: 'Complete dados demográficos faltantes para melhorar a precisão estatística de RH.',
    summary: (quality: number, progress: number) => `Leitura automática: a qualidade global é ${quality}% e o progresso médio é ${progress}%.`,
    metricProgressDetail: (completion: number, days: number) => `Conclusão ${completion}% e mediana de fechamento ${days} dias.`,
    metricSofliaDetail: (conversations: number, messages: number) => `${conversations} conversas e ${messages} mensagens analisadas.`,
    metricQualityDetail: (quiz: number, activity: number, soflia: number) => `Avaliações ${quiz}%, atividades ${activity}% e SofLIA ${soflia}%.`,
    learningPoint: (completion: number, days: number) => `A conclusão global é ${completion}% e o tempo médio de fechamento é ${days} dias.`,
    riskCourse: (title: string, overdue: number) => `${title} concentra risco operacional com ${overdue} vencimentos.`,
    adoptionPoint: (soflia: number, notes: number) => `A adoção do SofLIA é ${soflia}% e a adoção de notas é ${notes}%.`,
    bestRegion: (name: string, score: number) => `${name} lidera o ranking regional com score ${score}%.`,
    qualityPoint: (quality: number, offTopic: number) => `O score de qualidade é ${quality}% e a taxa fora de tema é ${offTopic}%.`,
    segmentPoint: (label: string, score: number) => `${label} requer revisão: registra score de qualidade ${score}%.`,
    riskQuality: (help: number) => `Usuários que pedem ajuda em atividades: ${help}%.`,
    riskData: (completion: number) => `Demografia completa: ${completion}%. Campos faltantes reduzem a precisão estatística.`,
  },
}
