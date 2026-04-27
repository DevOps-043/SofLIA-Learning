import { GoogleGenerativeAI } from '@google/generative-ai'
import { logger } from '@/lib/utils/logger'
import type {
  ReportsAnalyticsAiInsights,
  ReportsAnalyticsDataset,
  ReportsAnalyticsLocale,
} from '../../types/reports-analytics.types'

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
  const model = process.env.REPORTS_ANALYTICS_GEMINI_MODEL || process.env.GEMINI_MODEL || 'gemini-2.0-flash'

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
              text: JSON.stringify(buildInsightPayload(dataset)),
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
    margin: 44,
  }
  let y = page.margin

  const ensureSpace = (height: number) => {
    if (y + height <= page.height - page.margin) return
    pdf.addPage()
    y = page.margin
  }

  const addHeading = (text: string, size = 16) => {
    ensureSpace(size + 22)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(size)
    pdf.text(text, page.margin, y)
    y += size + 12
  }

  const addParagraph = (text: string, size = 10) => {
    ensureSpace(28)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(size)
    pdf.splitTextToSize(text, page.width - page.margin * 2).forEach((line: string) => {
      ensureSpace(size + 8)
      pdf.text(line, page.margin, y)
      y += size + 5
    })
    y += 4
  }

  const addMetric = (label: string, value: string | number, detail?: string) => {
    ensureSpace(42)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(10)
    pdf.text(`${label}: ${value}`, page.margin, y)
    y += 14
    if (detail) addParagraph(detail, 9)
  }

  const addBulletList = (rows: string[]) => {
    rows.forEach((row) => addParagraph(`- ${row}`, 9))
  }

  addHeading(labels.title, 20)
  addParagraph(`${labels.generatedAt}: ${new Date(insights.generatedAt).toLocaleString(locale)}`)
  addParagraph(`${labels.period}: ${formatDate(dataset.period.from, locale)} - ${formatDate(dataset.period.to, locale)}`)
  addParagraph(insights.summary, 11)

  addHeading(labels.executiveMetrics, 14)
  if (insights.executiveMetrics?.length) {
    insights.executiveMetrics.forEach((metric) => addMetric(metric.label, metric.value, metric.detail))
  } else {
    addMetric(labels.progress, `${dataset.overview.averageProgress}%`, `${labels.completion}: ${dataset.overview.completionRate}%`)
    addMetric(labels.soflia, `${dataset.overview.sofliaAdoptionRate}%`, `${dataset.soflia.totalConversations} ${labels.conversations}`)
    addMetric(labels.quality, `${dataset.quality.overallScore}%`)
  }

  addHeading(labels.operationalSnapshot, 14)
  addMetric(labels.users, dataset.overview.totalUsers, `${labels.activeUsers}: ${dataset.overview.activeLearners} (${dataset.overview.activeLearnerRate}%)`)
  addMetric(labels.learning, `${dataset.learning.completedCourses}/${dataset.learning.assignedCourses}`, `${labels.averageCompletionDays}: ${dataset.learning.averageCompletionDays}`)
  addMetric(labels.notes, `${dataset.overview.notesAdoptionRate}%`, `${dataset.notes.totalNotes} ${labels.notesCreated}`)
  addMetric(labels.planner, `${dataset.overview.plannerAdherenceRate}%`)

  addHeading(labels.findings, 14)
  insights.findings.forEach((section) => {
    addHeading(section.title, 12)
    addBulletList(section.points)
  })

  addHeading(labels.segments, 14)
  buildInsightSegmentRows(dataset, labels).slice(0, 8).forEach((segment) => {
    addParagraph(`${segment.label}: ${segment.users} ${labels.users}, ${labels.progress} ${segment.averageProgress}%, ${labels.quality} ${segment.qualityScore}%.`)
  })

  addHeading(labels.hierarchy, 14)
  buildInsightHierarchyRows(dataset).slice(0, 8).forEach((row, index) => {
    addParagraph(`${index + 1}. ${row.type} - ${row.name}: score ${row.rankScore}%, ${labels.progress} ${row.averageProgress}%, ${labels.quality} ${row.qualityScore}%.`)
  })

  addHeading(labels.courseRisks, 14)
  dataset.courses.slice(0, 8).forEach((course) => {
    addParagraph(`${course.courseTitle}: ${labels.progress} ${course.averageProgress}%, ${labels.completed} ${course.completedUsers}/${course.assignedUsers}, ${labels.overdue} ${course.overdueAssignments}.`)
  })

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
    'Cover adoption, learning performance, course friction, SofLIA behavior, notes usage, response quality, hierarchy rankings, and concrete HR actions.',
    'Keep every point operational: what is happening, where, likely cause from evidence, and what action to take next.',
  ].join('\n')
}

function buildInsightPayload(dataset: ReportsAnalyticsDataset) {
  return {
    period: dataset.period,
    filters: dataset.filters,
    overview: dataset.overview,
    learning: {
      assignedCourses: dataset.learning.assignedCourses,
      completedCourses: dataset.learning.completedCourses,
      averageCompletionDays: dataset.learning.averageCompletionDays,
      medianCompletionDays: dataset.learning.medianCompletionDays,
      progressDistribution: dataset.learning.progressDistribution,
    },
    quality: dataset.quality,
    soflia: dataset.soflia,
    notes: dataset.notes,
    planner: dataset.planner,
    connectionCalendar: dataset.connectionCalendar
      .filter((cell) => cell.value > 0)
      .sort((a, b) => b.value - a.value || a.date.localeCompare(b.date))
      .slice(0, 20),
    topSegments: {
      ageBands: dataset.segments.ageBands.slice(0, 8),
      gender: dataset.segments.gender.slice(0, 8),
      jobTitles: dataset.segments.jobTitles.slice(0, 8),
      roles: dataset.segments.roles.slice(0, 8),
    },
    rankings: {
      regions: dataset.rankings.regions.slice(0, 10),
      zones: dataset.rankings.zones.slice(0, 10),
      teams: dataset.rankings.teams.slice(0, 10),
      users: dataset.rankings.users.slice(0, 10).map((user, index) => ({
        anonymousUserId: `ranked_user_${index + 1}`,
        jobTitle: user.jobTitle,
        regionName: user.regionName,
        zoneName: user.zoneName,
        teamName: user.teamName,
        rankScore: user.rankScore,
        averageProgress: user.averageProgress,
        qualityScore: user.qualityScore,
      })),
    },
    anonymizedSamples: dataset.aiSamples.slice(0, 35),
  }
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

function extractJsonObject(value: string): string {
  const trimmed = value.trim()
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) return trimmed
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fencedMatch?.[1]) return fencedMatch[1].trim()
  const firstBrace = trimmed.indexOf('{')
  const lastBrace = trimmed.lastIndexOf('}')
  if (firstBrace >= 0 && lastBrace > firstBrace) return trimmed.slice(firstBrace, lastBrace + 1)
  return trimmed
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
