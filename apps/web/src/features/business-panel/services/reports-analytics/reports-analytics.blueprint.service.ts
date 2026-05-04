import { GoogleGenerativeAI } from '@google/generative-ai'
import { z } from 'zod'
import { logger } from '@/lib/utils/logger'
import type {
  ReportsAnalyticsDataset,
  ReportsAnalyticsExportFormat,
  ReportsAnalyticsLocale,
  ReportsAnalyticsReportBlueprint,
  ReportsAnalyticsReportSectionId,
} from '../../types/reports-analytics.types'
import {
  buildReportsAnalyticsAiPayload,
  extractJsonObject,
  resolveReportsAnalyticsGeminiModel,
  withReportsAnalyticsAiTimeout,
} from './reports-analytics.ai-payload.service'

interface GenerateReportsAnalyticsReportBlueprintParams {
  dataset: ReportsAnalyticsDataset
  locale: ReportsAnalyticsLocale
  format: ReportsAnalyticsExportFormat
  requestedByUserId?: string
}

const SECTION_IDS: ReportsAnalyticsReportSectionId[] = [
  'executive',
  'dashboard',
  'trends',
  'courses',
  'users',
  'segments',
  'quality',
  'rawData',
]

const sectionIdSchema = z.enum(SECTION_IDS as [ReportsAnalyticsReportSectionId, ...ReportsAnalyticsReportSectionId[]])

const blueprintSchema = z.object({
  summary: z.string().min(1).max(900),
  sections: z.array(z.object({
    id: sectionIdSchema,
    title: z.string().min(1).max(80),
    purpose: z.string().min(1).max(180),
    priority: z.coerce.number().min(1).max(10),
  })).min(1).max(12),
  featuredMetrics: z.array(z.object({
    label: z.string().min(1).max(80),
    value: z.string().min(1).max(60),
    detail: z.string().max(160).default(''),
  })).max(8).default([]),
  findings: z.array(z.object({
    title: z.string().min(1).max(100),
    points: z.array(z.string().min(1).max(220)).min(1).max(5),
  })).max(8).default([]),
  risks: z.array(z.string().min(1).max(220)).max(8).default([]),
  recommendations: z.array(z.string().min(1).max(220)).max(8).default([]),
  artifactPlan: z.array(z.object({
    id: sectionIdSchema,
    title: z.string().min(1).max(80),
    description: z.string().min(1).max(180),
    includeInCsv: z.boolean().default(true),
    includeInWorkbook: z.boolean().default(true),
  })).max(12).default([]),
})

export async function generateReportsAnalyticsReportBlueprint({
  dataset,
  locale,
  format,
}: GenerateReportsAnalyticsReportBlueprintParams): Promise<ReportsAnalyticsReportBlueprint> {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY
  const model = resolveReportsAnalyticsGeminiModel()

  if (!apiKey) {
    return buildFallbackReportsAnalyticsBlueprint(dataset, locale, model, format)
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const generativeModel = genAI.getGenerativeModel({
      model,
      systemInstruction: buildBlueprintSystemPrompt(locale, format),
    })
    const timeoutMs = parsePositiveInt(process.env.REPORTS_ANALYTICS_AI_TIMEOUT_MS, 12_000)
    const maxOutputTokens = parsePositiveInt(process.env.REPORTS_ANALYTICS_AI_MAX_OUTPUT_TOKENS, 3200)
    const result = await withReportsAnalyticsAiTimeout(
      generativeModel.generateContent({
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
          temperature: 0.15,
          maxOutputTokens,
          responseMimeType: 'application/json',
        },
      }),
      timeoutMs,
    )

    const parsed = parseReportsAnalyticsBlueprint(
      result.response.text(),
      {
        dataset,
        locale,
        model,
        format,
        source: 'gemini',
      },
    )
    if (parsed) return parsed
  } catch (error) {
    logger.error('Reports analytics Gemini blueprint failed', error)
  }

  return buildFallbackReportsAnalyticsBlueprint(dataset, locale, model, format)
}

export function parseReportsAnalyticsBlueprint(
  rawValue: string | undefined,
  context: {
    dataset: ReportsAnalyticsDataset
    locale: ReportsAnalyticsLocale
    model: string
    format: ReportsAnalyticsExportFormat
    source?: 'gemini' | 'fallback'
  },
): ReportsAnalyticsReportBlueprint | null {
  if (!rawValue) return null

  try {
    const parsed = blueprintSchema.parse(JSON.parse(extractJsonObject(rawValue)))
    return normalizeBlueprint(
      {
        generatedAt: new Date().toISOString(),
        model: context.model,
        source: context.source || 'gemini',
        summary: sanitizeText(parsed.summary, 900),
        sections: parsed.sections.map((section) => ({
          id: section.id,
          title: sanitizeText(section.title, 80),
          purpose: sanitizeText(section.purpose, 180),
          priority: section.priority,
        })),
        featuredMetrics: parsed.featuredMetrics.map((metric) => ({
          label: sanitizeText(metric.label, 80),
          value: sanitizeText(metric.value, 60),
          detail: sanitizeText(metric.detail, 160),
        })),
        findings: parsed.findings.map((section) => ({
          title: sanitizeText(section.title, 100),
          points: section.points.map((point) => sanitizeText(point, 220)),
        })),
        risks: parsed.risks.map((risk) => sanitizeText(risk, 220)),
        recommendations: parsed.recommendations.map((recommendation) => sanitizeText(recommendation, 220)),
        artifactPlan: parsed.artifactPlan.map((artifact) => ({
          id: artifact.id,
          title: sanitizeText(artifact.title, 80),
          description: sanitizeText(artifact.description, 180),
          includeInCsv: artifact.includeInCsv,
          includeInWorkbook: artifact.includeInWorkbook,
        })),
      },
      context.dataset,
      context.locale,
      context.model,
      context.format,
    )
  } catch {
    return null
  }
}

export function buildFallbackReportsAnalyticsBlueprint(
  dataset: ReportsAnalyticsDataset,
  locale: ReportsAnalyticsLocale,
  model = resolveReportsAnalyticsGeminiModel(),
  format: ReportsAnalyticsExportFormat = 'xlsx',
): ReportsAnalyticsReportBlueprint {
  const copy = BLUEPRINT_COPY[locale] || BLUEPRINT_COPY.es
  const topCourse = [...dataset.courses]
    .sort((a, b) => b.overdueAssignments - a.overdueAssignments || a.averageProgress - b.averageProgress)[0]
  const weakestSegment = [
    ...dataset.segments.ageBands,
    ...dataset.segments.gender,
    ...dataset.segments.jobTitles,
    ...dataset.segments.roles,
  ].sort((a, b) => a.qualityScore - b.qualityScore || a.averageProgress - b.averageProgress)[0]

  return normalizeBlueprint(
    {
      generatedAt: new Date().toISOString(),
      model: `${model}:fallback`,
      source: 'fallback',
      summary: copy.summary(dataset.overview.averageProgress, dataset.overview.qualityScore),
      sections: buildDefaultSections(copy),
      featuredMetrics: [
        {
          label: copy.progress,
          value: `${dataset.overview.averageProgress}%`,
          detail: copy.completionDetail(dataset.overview.completionRate),
        },
        {
          label: copy.soflia,
          value: `${dataset.overview.sofliaAdoptionRate}%`,
          detail: copy.sofliaDetail(dataset.soflia.totalConversations, dataset.soflia.totalMessages),
        },
        {
          label: copy.quality,
          value: `${dataset.overview.qualityScore}%`,
          detail: copy.qualityDetail(dataset.quality.evidenceCount),
        },
      ],
      findings: [
        {
          title: copy.learningFinding,
          points: [
            copy.learningPoint(dataset.learning.completedCourses, dataset.learning.assignedCourses),
            topCourse ? copy.courseRisk(topCourse.courseTitle, topCourse.overdueAssignments) : copy.noCourseRisk,
          ],
        },
        {
          title: copy.segmentFinding,
          points: [
            weakestSegment ? copy.segmentRisk(weakestSegment.label, weakestSegment.qualityScore) : copy.noSegmentRisk,
            copy.dataQualityPoint(dataset.dataQuality.demographicsCompletionRate),
          ],
        },
      ],
      risks: [
        copy.overdueRisk(dataset.learning.overdueAssignments),
        copy.helpRisk(dataset.quality.helpRate),
      ],
      recommendations: [
        copy.recommendSoflia,
        copy.recommendCourse,
        copy.recommendData,
      ],
      artifactPlan: buildDefaultArtifactPlan(copy),
    },
    dataset,
    locale,
    model,
    format,
  )
}

function normalizeBlueprint(
  blueprint: ReportsAnalyticsReportBlueprint,
  dataset: ReportsAnalyticsDataset,
  locale: ReportsAnalyticsLocale,
  model: string,
  format: ReportsAnalyticsExportFormat,
): ReportsAnalyticsReportBlueprint {
  const copy = BLUEPRINT_COPY[locale] || BLUEPRINT_COPY.es
  const fallback = {
    ...blueprint,
    generatedAt: blueprint.generatedAt || new Date().toISOString(),
    model: blueprint.model || model,
    summary: blueprint.summary || copy.summary(dataset.overview.averageProgress, dataset.overview.qualityScore),
  }
  const sectionMap = new Map<ReportsAnalyticsReportSectionId, ReportsAnalyticsReportBlueprint['sections'][number]>()
  for (const section of [...fallback.sections, ...buildDefaultSections(copy)]) {
    if (!sectionMap.has(section.id)) sectionMap.set(section.id, section)
  }
  const artifactMap = new Map<ReportsAnalyticsReportSectionId, ReportsAnalyticsReportBlueprint['artifactPlan'][number]>()
  for (const artifact of [...fallback.artifactPlan, ...buildDefaultArtifactPlan(copy)]) {
    if (!artifactMap.has(artifact.id)) artifactMap.set(artifact.id, artifact)
  }

  return {
    ...fallback,
    source: fallback.source,
    sections: Array.from(sectionMap.values()).sort((a, b) => a.priority - b.priority),
    featuredMetrics: fallback.featuredMetrics.length > 0
      ? fallback.featuredMetrics.slice(0, 8)
      : buildFallbackReportsAnalyticsBlueprint(dataset, locale, model, format).featuredMetrics,
    findings: fallback.findings.slice(0, 8),
    risks: fallback.risks.slice(0, 8),
    recommendations: fallback.recommendations.slice(0, 8),
    artifactPlan: Array.from(artifactMap.values()),
  }
}

function buildBlueprintSystemPrompt(locale: ReportsAnalyticsLocale, format: ReportsAnalyticsExportFormat): string {
  const language = locale === 'en' ? 'English' : locale === 'pt' ? 'Portuguese' : 'Spanish'
  return [
    `You are SofLIA, an analytics report designer for a B2B learning platform. Respond in ${language}.`,
    `Design the ${format} export structure from the provided aggregated metrics only.`,
    'Return only valid JSON. Do not use markdown.',
    'Use only the provided metrics, anonymized rankings, and anonymized samples. Do not infer hidden causes.',
    'Do not include names, emails, personal identifiers, medical status, protected-class conclusions, or private facts.',
    'Valid section ids are: executive, dashboard, trends, courses, users, segments, quality, rawData.',
    'Required shape: {"summary":"...","sections":[{"id":"executive","title":"...","purpose":"...","priority":1}],"featuredMetrics":[{"label":"...","value":"...","detail":"..."}],"findings":[{"title":"...","points":["..."]}],"risks":["..."],"recommendations":["..."],"artifactPlan":[{"id":"dashboard","title":"...","description":"...","includeInCsv":true,"includeInWorkbook":true}]}.',
    'Choose practical report sections, operational findings, and action recommendations. Keep values exact.',
  ].join('\n')
}

function buildDefaultSections(copy: BlueprintCopy): ReportsAnalyticsReportBlueprint['sections'] {
  return [
    { id: 'executive', title: copy.executive, purpose: copy.executivePurpose, priority: 1 },
    { id: 'dashboard', title: copy.dashboard, purpose: copy.dashboardPurpose, priority: 2 },
    { id: 'trends', title: copy.trends, purpose: copy.trendsPurpose, priority: 3 },
    { id: 'courses', title: copy.courses, purpose: copy.coursesPurpose, priority: 4 },
    { id: 'users', title: copy.users, purpose: copy.usersPurpose, priority: 5 },
    { id: 'segments', title: copy.segments, purpose: copy.segmentsPurpose, priority: 6 },
    { id: 'quality', title: copy.quality, purpose: copy.qualityPurpose, priority: 7 },
    { id: 'rawData', title: copy.rawData, purpose: copy.rawDataPurpose, priority: 8 },
  ]
}

function buildDefaultArtifactPlan(copy: BlueprintCopy): ReportsAnalyticsReportBlueprint['artifactPlan'] {
  return buildDefaultSections(copy).map((section) => ({
    id: section.id,
    title: section.title,
    description: section.purpose,
    includeInCsv: section.id !== 'dashboard',
    includeInWorkbook: true,
  }))
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value || '', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function sanitizeText(value: string, maxLength: number): string {
  return value.replace(/\s+/g, ' ').trim().slice(0, maxLength)
}

interface BlueprintCopy {
  executive: string
  executivePurpose: string
  dashboard: string
  dashboardPurpose: string
  trends: string
  trendsPurpose: string
  courses: string
  coursesPurpose: string
  users: string
  usersPurpose: string
  segments: string
  segmentsPurpose: string
  quality: string
  qualityPurpose: string
  rawData: string
  rawDataPurpose: string
  progress: string
  soflia: string
  learningFinding: string
  segmentFinding: string
  noCourseRisk: string
  noSegmentRisk: string
  recommendSoflia: string
  recommendCourse: string
  recommendData: string
  summary: (progress: number, quality: number) => string
  completionDetail: (completion: number) => string
  sofliaDetail: (conversations: number, messages: number) => string
  qualityDetail: (evidence: number) => string
  learningPoint: (completed: number, assigned: number) => string
  courseRisk: (course: string, overdue: number) => string
  segmentRisk: (segment: string, quality: number) => string
  dataQualityPoint: (completion: number) => string
  overdueRisk: (overdue: number) => string
  helpRisk: (helpRate: number) => string
}

const BLUEPRINT_COPY: Record<ReportsAnalyticsLocale, BlueprintCopy> = {
  es: {
    executive: 'Resumen SofLIA',
    executivePurpose: 'Narrativa ejecutiva, hallazgos, riesgos y acciones recomendadas.',
    dashboard: 'Dashboard',
    dashboardPurpose: 'Indicadores clave listos para direccion.',
    trends: 'Tendencias',
    trendsPurpose: 'Evolucion temporal de aprendizaje y uso de SofLIA.',
    courses: 'Cursos',
    coursesPurpose: 'Riesgo y avance por curso.',
    users: 'Usuarios',
    usersPurpose: 'Detalle exportable de usuarios autorizados.',
    segments: 'Segmentos',
    segmentsPurpose: 'Comparacion por edad, genero, puesto y rol.',
    quality: 'Calidad',
    qualityPurpose: 'Calidad de respuestas, evaluaciones y actividad.',
    rawData: 'Datos crudos',
    rawDataPurpose: 'Tablas limpias para auditoria y BI.',
    progress: 'Progreso promedio',
    soflia: 'Adopcion SofLIA',
    learningFinding: 'Aprendizaje y avance',
    segmentFinding: 'Segmentos y calidad de datos',
    noCourseRisk: 'No hay cursos con riesgo operativo evidente en el periodo.',
    noSegmentRisk: 'No hay segmentos suficientes para priorizar una accion.',
    recommendSoflia: 'Refuerza el uso de SofLIA donde hay bajo avance o baja calidad.',
    recommendCourse: 'Prioriza cursos con vencimientos o bajo progreso antes de asignar contenido nuevo.',
    recommendData: 'Completa datos demograficos para mejorar comparaciones y segmentacion.',
    summary: (progress, quality) => `SofLIA preparo un reporte con progreso promedio de ${progress}% y calidad global de ${quality}%.`,
    completionDetail: (completion) => `Finalizacion de cursos: ${completion}%.`,
    sofliaDetail: (conversations, messages) => `${conversations} conversaciones y ${messages} mensajes.`,
    qualityDetail: (evidence) => `${evidence} evidencias analizadas.`,
    learningPoint: (completed, assigned) => `${completed} de ${assigned} cursos asignados estan completados.`,
    courseRisk: (course, overdue) => `${course} requiere seguimiento por ${overdue} asignaciones vencidas.`,
    segmentRisk: (segment, quality) => `${segment} registra calidad de ${quality}% y requiere revision.`,
    dataQualityPoint: (completion) => `La completitud demografica es ${completion}%.`,
    overdueRisk: (overdue) => `Asignaciones vencidas: ${overdue}.`,
    helpRisk: (helpRate) => `Usuarios que necesitaron ayuda: ${helpRate}%.`,
  },
  en: {
    executive: 'SofLIA Summary',
    executivePurpose: 'Executive narrative, findings, risks, and recommended actions.',
    dashboard: 'Dashboard',
    dashboardPurpose: 'Leadership-ready key indicators.',
    trends: 'Trends',
    trendsPurpose: 'Time evolution of learning and SofLIA usage.',
    courses: 'Courses',
    coursesPurpose: 'Course progress and risk.',
    users: 'Users',
    usersPurpose: 'Authorized exportable user detail.',
    segments: 'Segments',
    segmentsPurpose: 'Comparison by age, gender, job title, and role.',
    quality: 'Quality',
    qualityPurpose: 'Response, assessment, and activity quality.',
    rawData: 'Raw data',
    rawDataPurpose: 'Clean tables for audit and BI.',
    progress: 'Average progress',
    soflia: 'SofLIA adoption',
    learningFinding: 'Learning and progress',
    segmentFinding: 'Segments and data quality',
    noCourseRisk: 'No course shows clear operational risk in the period.',
    noSegmentRisk: 'There are not enough segments to prioritize an action.',
    recommendSoflia: 'Reinforce SofLIA usage where progress or quality is low.',
    recommendCourse: 'Prioritize courses with overdue work or low progress before assigning new content.',
    recommendData: 'Complete demographic data to improve comparisons and segmentation.',
    summary: (progress, quality) => `SofLIA prepared a report with ${progress}% average progress and ${quality}% overall quality.`,
    completionDetail: (completion) => `Course completion: ${completion}%.`,
    sofliaDetail: (conversations, messages) => `${conversations} conversations and ${messages} messages.`,
    qualityDetail: (evidence) => `${evidence} evidence points analyzed.`,
    learningPoint: (completed, assigned) => `${completed} of ${assigned} assigned courses are completed.`,
    courseRisk: (course, overdue) => `${course} needs follow-up due to ${overdue} overdue assignments.`,
    segmentRisk: (segment, quality) => `${segment} records ${quality}% quality and needs review.`,
    dataQualityPoint: (completion) => `Demographic completeness is ${completion}%.`,
    overdueRisk: (overdue) => `Overdue assignments: ${overdue}.`,
    helpRisk: (helpRate) => `Users needing help: ${helpRate}%.`,
  },
  pt: {
    executive: 'Resumo SofLIA',
    executivePurpose: 'Narrativa executiva, achados, riscos e acoes recomendadas.',
    dashboard: 'Dashboard',
    dashboardPurpose: 'Indicadores principais para lideranca.',
    trends: 'Tendencias',
    trendsPurpose: 'Evolucao temporal de aprendizagem e uso do SofLIA.',
    courses: 'Cursos',
    coursesPurpose: 'Risco e progresso por curso.',
    users: 'Usuarios',
    usersPurpose: 'Detalhe autorizado e exportavel de usuarios.',
    segments: 'Segmentos',
    segmentsPurpose: 'Comparacao por idade, genero, cargo e funcao.',
    quality: 'Qualidade',
    qualityPurpose: 'Qualidade de respostas, avaliacoes e atividade.',
    rawData: 'Dados brutos',
    rawDataPurpose: 'Tabelas limpas para auditoria e BI.',
    progress: 'Progresso medio',
    soflia: 'Adocao SofLIA',
    learningFinding: 'Aprendizagem e progresso',
    segmentFinding: 'Segmentos e qualidade dos dados',
    noCourseRisk: 'Nenhum curso mostra risco operacional evidente no periodo.',
    noSegmentRisk: 'Nao ha segmentos suficientes para priorizar uma acao.',
    recommendSoflia: 'Reforce o uso do SofLIA onde ha baixo progresso ou baixa qualidade.',
    recommendCourse: 'Priorize cursos com vencimentos ou baixo progresso antes de atribuir novo conteudo.',
    recommendData: 'Complete dados demograficos para melhorar comparacoes e segmentacao.',
    summary: (progress, quality) => `SofLIA preparou um relatorio com progresso medio de ${progress}% e qualidade geral de ${quality}%.`,
    completionDetail: (completion) => `Conclusao de cursos: ${completion}%.`,
    sofliaDetail: (conversations, messages) => `${conversations} conversas e ${messages} mensagens.`,
    qualityDetail: (evidence) => `${evidence} evidencias analisadas.`,
    learningPoint: (completed, assigned) => `${completed} de ${assigned} cursos atribuidos estao concluidos.`,
    courseRisk: (course, overdue) => `${course} requer acompanhamento por ${overdue} atribuicoes vencidas.`,
    segmentRisk: (segment, quality) => `${segment} registra qualidade de ${quality}% e requer revisao.`,
    dataQualityPoint: (completion) => `A completude demografica e ${completion}%.`,
    overdueRisk: (overdue) => `Atribuicoes vencidas: ${overdue}.`,
    helpRisk: (helpRate) => `Usuarios que precisaram de ajuda: ${helpRate}%.`,
  },
}
