import { GoogleGenerativeAI } from '@google/generative-ai'
import type { SupabaseClient } from '@supabase/supabase-js'
import { fromLoose } from '@/lib/supabase/looseQuery'
import type { Database, Json } from '@/lib/supabase/types'
import { logger } from '@/lib/utils/logger'
import type {
  BusinessUserAnalyticsDataset,
  BusinessUserAnalyticsInsights,
  BusinessUserAnalyticsLocale,
  BusinessUserAnalyticsRange,
} from '../../types/business-user-analytics.types'

type BusinessUserAnalyticsSupabaseClient = SupabaseClient<Database>

interface CacheRow {
  id: string
  user_id: string
  organization_id: string
  range: string
  locale: string
  data_hash: string
  model_name: string | null
  payload: Json
  created_at: string
  expires_at: string
}

interface CacheInsert {
  user_id: string
  organization_id: string
  range: string
  locale: string
  data_hash: string
  model_name?: string | null
  payload: Json
  expires_at: string
}

interface GetBusinessUserAnalyticsInsightsParams {
  supabase: BusinessUserAnalyticsSupabaseClient
  userId: string
  organizationId: string
  range: BusinessUserAnalyticsRange
  locale: BusinessUserAnalyticsLocale
  dataset: BusinessUserAnalyticsDataset
}

export async function getBusinessUserAnalyticsInsights({
  supabase,
  userId,
  organizationId,
  range,
  locale,
  dataset,
}: GetBusinessUserAnalyticsInsightsParams): Promise<BusinessUserAnalyticsInsights> {
  const cached = await getCachedInsights({
    supabase,
    userId,
    organizationId,
    range,
    locale,
    dataHash: dataset.dataHash,
  })

  if (cached) return cached

  const insights = await generateBusinessUserAnalyticsInsights({ dataset, locale })
  if (insights.unavailable) return insights

  await storeCachedInsights({
    supabase,
    userId,
    organizationId,
    range,
    locale,
    dataHash: dataset.dataHash,
    insights,
  })

  return insights
}

async function getCachedInsights(input: {
  supabase: BusinessUserAnalyticsSupabaseClient
  userId: string
  organizationId: string
  range: BusinessUserAnalyticsRange
  locale: BusinessUserAnalyticsLocale
  dataHash: string
}): Promise<BusinessUserAnalyticsInsights | null> {
  const cacheTable = fromLoose<CacheRow, CacheInsert>(
    input.supabase,
    'business_user_analytics_insight_cache',
  )
  const now = new Date().toISOString()
  const { data, error } = await cacheTable
    .select('id, user_id, organization_id, range, locale, data_hash, model_name, payload, created_at, expires_at')
    .eq('user_id', input.userId)
    .eq('organization_id', input.organizationId)
    .eq('range', input.range)
    .eq('locale', input.locale)
    .eq('data_hash', input.dataHash)
    .gt('expires_at', now)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    logger.error('Business user analytics insight cache read failed', error)
    return null
  }

  if (!data || !isInsightsPayload(data.payload)) return null

  return {
    ...data.payload,
    cached: true,
    expiresAt: data.expires_at,
  }
}

async function storeCachedInsights(input: {
  supabase: BusinessUserAnalyticsSupabaseClient
  userId: string
  organizationId: string
  range: BusinessUserAnalyticsRange
  locale: BusinessUserAnalyticsLocale
  dataHash: string
  insights: BusinessUserAnalyticsInsights
}) {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  const cacheTable = fromLoose<CacheRow, CacheInsert>(
    input.supabase,
    'business_user_analytics_insight_cache',
  )

  const { error } = await cacheTable.insert({
    user_id: input.userId,
    organization_id: input.organizationId,
    range: input.range,
    locale: input.locale,
    data_hash: input.dataHash,
    model_name: input.insights.model,
    payload: toJson({
      ...input.insights,
      cached: false,
      expiresAt,
    }),
    expires_at: expiresAt,
  })

  if (error) {
    logger.error('Business user analytics insight cache write failed', error)
  }
}

async function generateBusinessUserAnalyticsInsights({
  dataset,
  locale,
}: {
  dataset: BusinessUserAnalyticsDataset
  locale: BusinessUserAnalyticsLocale
}): Promise<BusinessUserAnalyticsInsights> {
  const apiKey = process.env.GOOGLE_API_KEY
  const model = process.env.REPORTS_ANALYTICS_GEMINI_MODEL || process.env.GEMINI_MODEL || 'gemini-2.0-flash'

  if (!apiKey) {
    return buildUnavailableInsights(locale, model)
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
        maxOutputTokens: 1800,
        responseMimeType: 'application/json',
      },
    })

    const parsed = parseInsights(result.response.text(), model)
    if (parsed) return parsed
  } catch (error) {
    logger.error('Business user analytics Gemini insights failed', error)
  }

  return buildFallbackInsights(dataset, locale, `${model}:fallback`)
}

function buildSystemPrompt(locale: BusinessUserAnalyticsLocale): string {
  const language = locale === 'en' ? 'English' : locale === 'pt' ? 'Portuguese' : 'Spanish'
  return [
    `You are SofLIA, a personal learning analytics coach. Respond in ${language}.`,
    'Use only the provided personal aggregated metrics and anonymized samples.',
    'Do not infer protected traits, identity details, medical status, or private facts.',
    'Return only valid JSON with this exact shape:',
    '{"summary":"...","metrics":[{"label":"...","value":"...","detail":"..."}],"strengths":["..."],"opportunities":["..."],"recommendations":["..."],"nextSteps":[{"title":"...","points":["..."]}]}',
    'Cover course progress, AI adoption, planning adherence, notes usage, activity response quality, question quality with SofLIA, quizzes, and connection patterns.',
    'Make the feedback practical and concise for the learner.',
  ].join('\n')
}

function buildInsightPayload(dataset: BusinessUserAnalyticsDataset) {
  return {
    period: dataset.period,
    overview: dataset.overview,
    learning: {
      courses: dataset.learning.courses.slice(0, 20),
      progressDistribution: dataset.learning.progressDistribution,
      completionsTrend: dataset.learning.completionsTrend,
    },
    aiAdoption: dataset.aiAdoption,
    planning: dataset.planning,
    notes: dataset.notes,
    activities: dataset.activities,
    quizzes: dataset.quizzes,
    quality: dataset.quality,
    strongestDays: dataset.contributionCalendar
      .filter((cell) => cell.value > 0)
      .sort((a, b) => b.value - a.value || b.date.localeCompare(a.date))
      .slice(0, 15),
    anonymizedSamples: dataset.aiSamples.slice(0, 35),
  }
}

function parseInsights(value: string | undefined, model: string): BusinessUserAnalyticsInsights | null {
  if (!value) return null

  try {
    const parsed = JSON.parse(extractJsonObject(value)) as Partial<BusinessUserAnalyticsInsights>
    if (!parsed.summary) return null

    return {
      generatedAt: new Date().toISOString(),
      model,
      cached: false,
      expiresAt: null,
      summary: String(parsed.summary),
      metrics: Array.isArray(parsed.metrics)
        ? parsed.metrics
          .filter((metric) => metric && typeof metric === 'object')
          .slice(0, 6)
          .map((metric) => ({
            label: String((metric as { label?: unknown }).label || ''),
            value: String((metric as { value?: unknown }).value || ''),
            detail: String((metric as { detail?: unknown }).detail || ''),
          }))
        : [],
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map(String).slice(0, 6) : [],
      opportunities: Array.isArray(parsed.opportunities) ? parsed.opportunities.map(String).slice(0, 6) : [],
      recommendations: Array.isArray(parsed.recommendations)
        ? parsed.recommendations.map(String).slice(0, 6)
        : [],
      nextSteps: Array.isArray(parsed.nextSteps)
        ? parsed.nextSteps
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

function buildFallbackInsights(
  dataset: BusinessUserAnalyticsDataset,
  locale: BusinessUserAnalyticsLocale,
  model: string,
): BusinessUserAnalyticsInsights {
  const text = FALLBACK_TEXT[locale] || FALLBACK_TEXT.es
  const strongestCourse = [...dataset.learning.courses].sort((a, b) => b.progress - a.progress)[0]
  const weakestCourse = [...dataset.learning.courses].sort((a, b) => a.progress - b.progress)[0]

  return {
    generatedAt: new Date().toISOString(),
    model,
    cached: false,
    expiresAt: null,
    summary: text.summary(dataset.overview.averageProgress, dataset.quality.overallScore),
    metrics: [
      {
        label: text.progressMetric,
        value: `${dataset.overview.averageProgress}%`,
        detail: text.progressDetail(dataset.overview.completedCourses, dataset.overview.totalAssigned),
      },
      {
        label: text.aiMetric,
        value: `${dataset.aiAdoption.adoptionScore}%`,
        detail: text.aiDetail(dataset.aiAdoption.totalConversations, dataset.aiAdoption.questionQualityScore),
      },
      {
        label: text.planningMetric,
        value: `${dataset.planning.adherenceRate}%`,
        detail: text.planningDetail(dataset.planning.completedSessions, dataset.planning.plannedSessions),
      },
    ],
    strengths: [
      strongestCourse ? text.strongCourse(strongestCourse.courseTitle, strongestCourse.progress) : text.noCourseStrength,
      text.activeDays(dataset.overview.activeDays, dataset.overview.longestStreak),
    ],
    opportunities: [
      weakestCourse ? text.weakCourse(weakestCourse.courseTitle, weakestCourse.progress) : text.noCourseOpportunity,
      text.notesOpportunity(dataset.notes.adoptionRate),
      text.activitiesOpportunity(dataset.activities.averageQualityScore),
    ],
    recommendations: [
      text.recommendPlanning,
      text.recommendSoflia,
      text.recommendNotes,
    ],
    nextSteps: [
      {
        title: text.nextStepsTitle,
        points: [
          text.nextStepCourse,
          text.nextStepQuestions,
          text.nextStepReview,
        ],
      },
    ],
  }
}

function buildUnavailableInsights(
  locale: BusinessUserAnalyticsLocale,
  model: string,
): BusinessUserAnalyticsInsights {
  const text = FALLBACK_TEXT[locale] || FALLBACK_TEXT.es

  return {
    generatedAt: new Date().toISOString(),
    model: `${model}:unavailable`,
    cached: false,
    expiresAt: null,
    unavailable: true,
    summary: text.unavailable,
    metrics: [],
    strengths: [],
    opportunities: [],
    recommendations: [],
    nextSteps: [],
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

function isInsightsPayload(value: Json): value is Json & BusinessUserAnalyticsInsights {
  return Boolean(
    value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      typeof (value as { summary?: unknown }).summary === 'string',
  )
}

function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json
}

const FALLBACK_TEXT = {
  es: {
    unavailable: 'El feedback con IA no esta configurado en este entorno.',
    progressMetric: 'Avance del curso',
    aiMetric: 'Adopcion de SofLIA',
    planningMetric: 'Cumplimiento del plan',
    nextStepsTitle: 'Proximos pasos',
    noCourseStrength: 'Aun no hay cursos con suficiente avance para destacar.',
    noCourseOpportunity: 'Aun no hay cursos con suficiente evidencia para priorizar.',
    recommendPlanning: 'Reserva sesiones cortas y recurrentes para sostener el avance semanal.',
    recommendSoflia: 'Haz preguntas especificas a SofLIA antes y despues de cada actividad.',
    recommendNotes: 'Convierte tus notas en checklist de repaso antes de quizzes o examenes.',
    nextStepCourse: 'Elige un curso con menor avance y agenda la siguiente sesion.',
    nextStepQuestions: 'Formula preguntas con contexto, intento propio y duda concreta.',
    nextStepReview: 'Revisa actividades con retroalimentacion pendiente antes de avanzar.',
    summary: (progress: number, quality: number) => `Lectura automatica: tu avance promedio es ${progress}% y tu calidad global es ${quality}%.`,
    progressDetail: (completed: number, total: number) => `${completed} de ${total} cursos completados.`,
    aiDetail: (conversations: number, score: number) => `${conversations} conversaciones y calidad de preguntas ${score}%.`,
    planningDetail: (completed: number, planned: number) => `${completed} de ${planned} sesiones completadas.`,
    strongCourse: (course: string, progress: number) => `${course} es tu curso mas fuerte con ${progress}% de avance.`,
    weakCourse: (course: string, progress: number) => `${course} necesita seguimiento: registra ${progress}% de avance.`,
    activeDays: (days: number, streak: number) => `Te conectaste ${days} dias en el periodo; tu mejor racha fue de ${streak} dias.`,
    notesOpportunity: (rate: number) => `La adopcion de notas esta en ${rate}%; documentar dudas mejoraria el repaso.`,
    activitiesOpportunity: (score: number) => `La calidad media de actividades es ${score}%; revisa instrucciones y evidencia antes de enviar.`,
  },
  en: {
    unavailable: 'AI feedback is not configured in this environment.',
    progressMetric: 'Course progress',
    aiMetric: 'SofLIA adoption',
    planningMetric: 'Plan adherence',
    nextStepsTitle: 'Next steps',
    noCourseStrength: 'There is not enough course progress to highlight yet.',
    noCourseOpportunity: 'There is not enough evidence to prioritize a course yet.',
    recommendPlanning: 'Book short recurring sessions to keep weekly progress stable.',
    recommendSoflia: 'Ask specific questions to SofLIA before and after each activity.',
    recommendNotes: 'Turn your notes into a review checklist before quizzes or exams.',
    nextStepCourse: 'Pick a lower-progress course and schedule the next session.',
    nextStepQuestions: 'Ask questions with context, your own attempt, and a concrete doubt.',
    nextStepReview: 'Review activities with pending feedback before moving forward.',
    summary: (progress: number, quality: number) => `Automatic read: your average progress is ${progress}% and your overall quality is ${quality}%.`,
    progressDetail: (completed: number, total: number) => `${completed} of ${total} courses completed.`,
    aiDetail: (conversations: number, score: number) => `${conversations} conversations and ${score}% question quality.`,
    planningDetail: (completed: number, planned: number) => `${completed} of ${planned} sessions completed.`,
    strongCourse: (course: string, progress: number) => `${course} is your strongest course with ${progress}% progress.`,
    weakCourse: (course: string, progress: number) => `${course} needs follow-up: it has ${progress}% progress.`,
    activeDays: (days: number, streak: number) => `You connected ${days} days in the period; your best streak was ${streak} days.`,
    notesOpportunity: (rate: number) => `Notes adoption is ${rate}%; documenting doubts would improve review quality.`,
    activitiesOpportunity: (score: number) => `Average activity quality is ${score}%; review instructions and evidence before submitting.`,
  },
  pt: {
    unavailable: 'O feedback com IA nao esta configurado neste ambiente.',
    progressMetric: 'Progresso do curso',
    aiMetric: 'Adocao do SofLIA',
    planningMetric: 'Cumprimento do plano',
    nextStepsTitle: 'Proximos passos',
    noCourseStrength: 'Ainda nao ha progresso suficiente em cursos para destacar.',
    noCourseOpportunity: 'Ainda nao ha evidencia suficiente para priorizar um curso.',
    recommendPlanning: 'Reserve sessoes curtas e recorrentes para manter o avanco semanal.',
    recommendSoflia: 'Faca perguntas especificas ao SofLIA antes e depois de cada atividade.',
    recommendNotes: 'Transforme suas notas em checklist de revisao antes de quizzes ou provas.',
    nextStepCourse: 'Escolha um curso com menor progresso e agende a proxima sessao.',
    nextStepQuestions: 'Faca perguntas com contexto, sua tentativa e uma duvida concreta.',
    nextStepReview: 'Revise atividades com feedback pendente antes de avancar.',
    summary: (progress: number, quality: number) => `Leitura automatica: seu progresso medio e ${progress}% e sua qualidade global e ${quality}%.`,
    progressDetail: (completed: number, total: number) => `${completed} de ${total} cursos concluidos.`,
    aiDetail: (conversations: number, score: number) => `${conversations} conversas e qualidade de perguntas ${score}%.`,
    planningDetail: (completed: number, planned: number) => `${completed} de ${planned} sessoes concluidas.`,
    strongCourse: (course: string, progress: number) => `${course} e seu curso mais forte com ${progress}% de progresso.`,
    weakCourse: (course: string, progress: number) => `${course} precisa de acompanhamento: registra ${progress}% de progresso.`,
    activeDays: (days: number, streak: number) => `Voce se conectou ${days} dias no periodo; sua melhor sequencia foi de ${streak} dias.`,
    notesOpportunity: (rate: number) => `A adocao de notas esta em ${rate}%; documentar duvidas melhoraria a revisao.`,
    activitiesOpportunity: (score: number) => `A qualidade media das atividades e ${score}%; revise instrucoes e evidencias antes de enviar.`,
  },
}
