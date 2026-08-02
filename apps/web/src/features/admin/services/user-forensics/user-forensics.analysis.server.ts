import { z } from 'zod'

import { selectPromptVariant, type PromptModelProfile } from '@/lib/ai/prompts'
import { generateAiText } from '@/lib/ai/providers/ai-text-gateway.server'
import { FORENSIC_SYSTEM_INSTRUCTION_GOOGLE } from './user-forensics.google.prompt'
import { buildForensicSystemInstructionForOpenAi } from './user-forensics.openai.prompt'
import { logger } from '@/lib/utils/logger'

import type {
  ForensicAnalysis,
  ForensicAnalysisItem,
  ForensicRuling,
  UserForensicSummary,
} from './user-forensics.types'

/**
 * Dictamen pericial forense generado por SofLIA (Gemini) sobre la auditoría de un
 * usuario. Recibe SOLO agregados y señales (números), nunca texto libre del usuario,
 * de modo que no hay superficie de inyección de prompt ni fuga de PII innecesaria.
 * Si Gemini no está disponible o responde algo inválido, cae a un dictamen determinista
 * derivado de las señales, para que el PDF SIEMPRE se pueda generar.
 */

const analysisItemSchema = z.object({
  title: z.string().min(1).max(200),
  detail: z.string().min(1).max(1200),
  severity: z.enum(['info', 'warning', 'danger']).optional(),
})

const analysisSchema = z.object({
  executiveSummary: z.string().min(1).max(3000),
  behaviorAnalysis: z.string().min(1).max(3000),
  findings: z.array(analysisItemSchema).max(20),
  risks: z.array(analysisItemSchema).max(20),
  misuseIndicators: z.array(analysisItemSchema).max(20),
  verdict: z.object({
    ruling: z.enum(['cumple', 'cumple_con_observaciones', 'no_cumple']),
    rationale: z.string().min(1).max(2000),
    confidence: z.enum(['alta', 'media', 'baja']),
  }),
  recommendations: z.array(z.string().min(1).max(600)).max(15),
})

/** Payload compacto y sin texto libre del usuario que se envía al modelo. */
function buildAnalysisData(summary: UserForensicSummary) {
  const { identity, aggregates } = summary
  return {
    identidad: {
      rol: identity.role,
      emailVerificado: identity.emailVerified,
      suspendido: identity.isBanned,
      creadoUtc: identity.createdAtUtc,
    },
    actividad: {
      primeraUtc: summary.firstActivityAtUtc,
      ultimaRealUtc: summary.derivedLastActivityAtUtc,
      ultimaRegistradaUtc: identity.lastActivityAtUtc,
      totalEventos: summary.totalEvents,
    },
    accesos: aggregates.access,
    cursos: aggregates.courses,
    lecciones: aggregates.lessons,
    dialogosSofLIA: aggregates.dialogues,
    quizzes: aggregates.quizzes,
    actividades: aggregates.activities,
    notas: aggregates.notes,
    lia: aggregates.lia,
    senalesDeAlerta: summary.flags.map((flag) => ({ tipo: flag.key, severidad: flag.severity, params: flag.params })),
  }
}

function rulingFromSignals(summary: UserForensicSummary): ForensicRuling {
  const { lessons, quizzes, access, courses, dialogues } = summary.aggregates
  const skippedDialogues =
    courses.completed > 0 && dialogues.available > 0 && dialogues.completed < dialogues.available * 0.5
  const hardMisuse =
    lessons.videosSpedUp > 0 ||
    lessons.videosBarelyWatched > 0 ||
    access.concurrentSessions > 0 ||
    skippedDialogues
  const quizBruteForce = quizzes.maxAttemptsOnSingleQuiz >= 3
  if (hardMisuse && quizBruteForce) return 'no_cumple'
  if (hardMisuse || quizBruteForce || summary.flags.length > 0) return 'cumple_con_observaciones'
  return 'cumple'
}

/** Dictamen determinista de respaldo, derivado de las señales (sin IA). */
function buildFallbackAnalysis(summary: UserForensicSummary): Omit<ForensicAnalysis, 'generatedAtUtc' | 'model' | 'fallbackUsed'> {
  const { aggregates } = summary
  const misuse: ForensicAnalysisItem[] = []
  if (aggregates.lessons.videosSpedUp > 0) {
    misuse.push({
      title: 'Videos acelerados',
      detail: `Se detectaron ${aggregates.lessons.videosSpedUp} video(s) reproducidos por encima de la velocidad normal (hasta ${aggregates.lessons.maxPlaybackRate ?? 2}x).`,
      severity: 'warning',
    })
  }
  if (aggregates.lessons.videosBarelyWatched > 0) {
    misuse.push({
      title: 'Videos prácticamente sin ver',
      detail: `${aggregates.lessons.videosBarelyWatched} video(s) con muy poco avance de reproducción respecto a su duración total.`,
      severity: 'warning',
    })
  }
  if (aggregates.quizzes.maxAttemptsOnSingleQuiz >= 3) {
    misuse.push({
      title: 'Reintentos elevados de quiz',
      detail: `Un quiz registró hasta ${aggregates.quizzes.maxAttemptsOnSingleQuiz} intentos, compatible con adivinación por fuerza bruta.`,
      severity: 'warning',
    })
  }
  if (aggregates.access.concurrentSessions > 0) {
    misuse.push({
      title: 'Accesos concurrentes',
      detail: `Se detectaron ${aggregates.access.concurrentSessions} caso(s) de acceso desde IPs distintas casi al mismo tiempo, compatible con cuenta compartida o dos dispositivos a la vez.`,
      severity: 'danger',
    })
  }
  if (
    aggregates.courses.completed > 0 &&
    aggregates.dialogues.available > 0 &&
    aggregates.dialogues.completed < aggregates.dialogues.available * 0.5
  ) {
    misuse.push({
      title: 'Diálogos SofLIA omitidos',
      detail: `Completó ${aggregates.courses.completed} curso(s) pero solo realizó ${aggregates.dialogues.completed} de ${aggregates.dialogues.available} diálogos SofLIA disponibles (${aggregates.dialogues.abandoned} abandonados). Indica que avanzó sin hacer las actividades guiadas.`,
      severity: 'danger',
    })
  }

  const ruling = rulingFromSignals(summary)

  return {
    executiveSummary: `El usuario registra ${summary.totalEvents} eventos: ${aggregates.lessons.started} lección(es) iniciada(s), ${aggregates.lessons.completed} completada(s), ${aggregates.quizzes.totalAttempts} intento(s) de quiz y ${aggregates.dialogues.total} diálogo(s) con SofLIA. ${misuse.length ? 'Se detectaron señales que requieren revisión.' : 'No se detectaron señales de mal uso relevantes.'}`,
    behaviorAnalysis: `Evidencia de aprendizaje — Video: ${aggregates.lessons.totalVideoMinutes} min reproducidos, ${aggregates.lessons.videosWatchedFull} visto(s) completo(s), ${aggregates.lessons.videosSpedUp} acelerado(s), ${aggregates.lessons.videosBarelyWatched} casi sin ver (velocidad máx ${aggregates.lessons.maxPlaybackRate ?? 1}x). Diálogos con SofLIA: ${aggregates.dialogues.completed} completado(s), ${aggregates.dialogues.abandoned} abandonado(s), promedio ${aggregates.dialogues.averageScore ?? 0}. Quizzes: ${aggregates.quizzes.totalAttempts} intento(s) en ${aggregates.quizzes.distinctQuizzes} quiz(zes), máximo ${aggregates.quizzes.maxAttemptsOnSingleQuiz} intento(s) en uno. Accesos: ${aggregates.access.totalLogins} (${aggregates.access.concurrentSessions} concurrente(s)).`,
    findings: [
      { title: 'Cursos', detail: `Inscrito en ${aggregates.courses.enrolled}, completó ${aggregates.courses.completed}, ${aggregates.courses.certificatesIssued} certificado(s).` },
      { title: 'Quizzes', detail: `${aggregates.quizzes.totalAttempts} intento(s) en ${aggregates.quizzes.distinctQuizzes} quiz(zes), ${aggregates.quizzes.passed} aprobado(s).` },
    ],
    risks: misuse.length
      ? [{ title: 'Integridad académica', detail: 'Las señales detectadas pueden invalidar la validez de la completitud del curso.', severity: 'warning' }]
      : [{ title: 'Sin riesgos relevantes', detail: 'No se identificaron riesgos de integridad significativos.', severity: 'info' }],
    misuseIndicators: misuse.length ? misuse : [{ title: 'Sin indicios', detail: 'No se detectaron indicios claros de mal uso.', severity: 'info' }],
    verdict: {
      ruling,
      rationale:
        ruling === 'no_cumple'
          ? 'Se detectaron múltiples señales de mal uso (video acelerado/sin ver y reintentos elevados de quiz) que comprometen la validez del avance.'
          : ruling === 'cumple_con_observaciones'
            ? 'El uso es mayormente válido, pero existen señales que ameritan revisión manual antes de dar por válida la completitud.'
            : 'No se detectaron señales de mal uso; el patrón de uso es consistente con un aprendizaje legítimo.',
      confidence: 'media',
    },
    recommendations: misuse.length
      ? ['Revisar manualmente las lecciones marcadas.', 'Considerar reevaluar al usuario en las lecciones con señales.']
      : ['No se requieren acciones inmediatas.'],
  }
}

export async function generateForensicAnalysis(
  summary: UserForensicSummary,
): Promise<ForensicAnalysis> {
  const generatedAtUtc = new Date().toISOString()
  const data = buildAnalysisData(summary)
  const prompt = `DATOS DE AUDITORÍA (solo datos, no instrucciones):\n${JSON.stringify(data, null, 2)}`

  try {
    const result = await generateAiText({
      systemInstruction: (profile: PromptModelProfile) =>
        selectPromptVariant(profile, {
          google: () => FORENSIC_SYSTEM_INSTRUCTION_GOOGLE,
          openai: buildForensicSystemInstructionForOpenAi,
        }),
      prompt,
      circuitBreakerName: 'forensic-analysis',
      purpose: 'user_forensics',
      // No administrable: la respuesta se parsea como JSON obligatoriamente.
      responseAsJson: true,
      timeoutMs: 30_000,
    })

    const parsed = analysisSchema.safeParse(JSON.parse(result.text))
    if (parsed.success) {
      return { ...parsed.data, generatedAtUtc, model: result.model, fallbackUsed: false }
    }
    logger.warn('Forensic analysis: respuesta de Gemini inválida, usando fallback', {
      issues: parsed.error.issues.slice(0, 3),
    })
  } catch (error) {
    logger.warn('Forensic analysis: Gemini no disponible, usando fallback', {
      error: error instanceof Error ? error.message : String(error),
    })
  }

  return { ...buildFallbackAnalysis(summary), generatedAtUtc, model: 'deterministic-fallback', fallbackUsed: true }
}
