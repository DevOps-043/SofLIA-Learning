import type { BusinessUserAnalyticsPeriod } from '../../../types/business-user-analytics.types'
import { buildBreakdown, calculateAverage, calculatePercentage, clampPercentage, incrementMap } from '../../reports-analytics/reports-analytics.helpers'
import { buildDerivedResponseTimes } from './build-derived-response-times'
import { buildTrend } from './build-trend'
import { hasQuestionSignal } from './has-question-signal'
import { QueryData } from './query-data'
import { roundNumber } from './round-number'

export function buildAiAdoption(data: QueryData, period: BusinessUserAnalyticsPeriod) {
  const userMessages = data.liaMessages.filter((message) => message.role === 'user')
  const liaMessages = data.liaMessages.filter((message) => message.role !== 'user')

  // El motor nuevo de "Conversación guiada con SofLIA" escribe en `soflia_dialogue_*`,
  // no en `lia_messages`/`lia_conversations`. Si no se cuenta, un usuario que SOLO usa
  // las actividades de diálogo aparece con 0% de adopción aunque sí interactúa con
  // SofLIA. Se suman al uso: cada sesión con turnos de usuario = una conversación, y
  // cada turno = un mensaje. Las métricas de señal (preguntas, off-topic, sentimiento)
  // se mantienen sobre `lia_messages`, que son las únicas con esos campos.
  const dialogueUserTurns = data.dialogueTurns.filter((turn) => turn.role === 'user')
  const dialogueConversationIds = new Set(dialogueUserTurns.map((turn) => turn.session_id))
  const dialogueConversations = dialogueConversationIds.size
  const dialogueMessages = data.dialogueTurns.length

  const totalConversations = data.liaConversations.length + dialogueConversations
  const totalMessages = data.liaMessages.length + dialogueMessages
  const totalUserMessages = userMessages.length + dialogueUserTurns.length
  const questions = userMessages.filter(hasQuestionSignal).length
  const offTopic = userMessages.filter((message) => message.is_off_topic).length
  const redirects = data.liaMessages.filter((message) => message.lia_redirected).length
  const storedResponseTimes = data.liaMessages
    .map((message) => Number(message.response_time_ms))
    .filter((value) => Number.isFinite(value) && value > 0)
  const responseTimes = [
    ...storedResponseTimes,
    ...buildDerivedResponseTimes(data.liaMessages),
  ]
  const sentimentScores = data.liaMessages
    .map((message) => Number(message.sentiment_score))
    .filter((value) => Number.isFinite(value))
  const questionRate = calculatePercentage(questions, userMessages.length)
  const offTopicRate = calculatePercentage(offTopic, userMessages.length)
  const redirectRate = calculatePercentage(redirects, data.liaMessages.length)
  const averageSentiment = sentimentScores.length > 0 ? roundNumber(calculateAverage(sentimentScores), 2) : 0
  const sentimentScore = clampPercentage(50 + averageSentiment * 50)
  const questionQualityScore = userMessages.length > 0
    ? clampPercentage(60 + questionRate * 0.25 - offTopicRate * 0.45 - redirectRate * 0.2 + sentimentScore * 0.25)
    : 0
  const contextCounts = new Map<string, number>()
  data.liaConversations.forEach((conversation) => incrementMap(contextCounts, conversation.context_type || 'general'))

  return {
    totalConversations,
    totalMessages,
    userMessages: totalUserMessages,
    liaMessages: liaMessages.length,
    adoptionScore: calculatePercentage(totalConversations, Math.max(1, data.assignments.length)),
    questionRate,
    offTopicRate,
    redirectRate,
    averageResponseTimeSeconds: calculateAverage(responseTimes.map((value) => value / 1000)),
    averageSentiment,
    questionQualityScore,
    contextBreakdown: buildBreakdown(contextCounts, data.liaConversations.length),
    messagesTrend: buildTrend([
      ...data.liaMessages.map((message) => message.created_at),
      ...data.dialogueTurns.map((turn) => turn.created_at),
    ].filter((value): value is string => Boolean(value)), period),
  }
}
