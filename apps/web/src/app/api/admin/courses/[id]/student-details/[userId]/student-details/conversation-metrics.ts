import { LiaConversationRow, LiaFeedbackRow, LiaMessageRow } from './types'

// SOFIA palette values — must match CSS variables in globals.css.
// Used as chart data colors (server-side), so CSS vars are not available here.
const SOFIA_PRIMARY   = '#0A2540' // --color-primary
const SOFIA_ACCENT    = '#00D4B3' // --color-accent
const SOFIA_SUCCESS   = '#10B981' // --color-success
const SOFIA_WARNING   = '#F59E0B' // --color-warning

const TOPIC_COLORS = [SOFIA_PRIMARY, SOFIA_ACCENT, SOFIA_SUCCESS, SOFIA_WARNING]

export function buildLiaMetrics(
  conversations: LiaConversationRow[],
  messages: LiaMessageRow[],
  feedback: LiaFeedbackRow[],
) {
  const totalConversations = conversations.length
  const totalMessages = messages.length
  const userMessages = messages.filter((message) => message.role === 'user' || message.sender === 'user').length
  const liaMessages = messages.filter((message) => message.role === 'assistant' || message.sender === 'assistant').length
  const positiveFeedback = feedback.filter((item) => (item.rating ?? 0) >= 4).length
  const conversationsThisWeek = conversations.filter((conversation) => new Date(conversation.created_at) >= getWeekStart()).length
  const feedbackRate = totalConversations > 0 ? (positiveFeedback / totalConversations) * 100 : 0

  return {
    totalConversations,
    conversationsThisWeek,
    totalMessages,
    userMessages,
    liaMessages,
    avgMessagesPerConversation: totalConversations > 0 ? (totalMessages / totalConversations).toFixed(1) : 0,
    positiveFeedbackRate: feedbackRate.toFixed(0),
    positiveFeedbackCount: positiveFeedback,
    conversationsByWeek: calculateWeeklyData(conversations, 5),
    conversationTopics: groupByContextType(conversations),
  }
}

function getWeekStart() {
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - 7)
  return weekStart
}

function calculateWeeklyData(conversations: LiaConversationRow[], weeks: number) {
  const now = new Date()
  return Array.from({ length: weeks }, (_, index) => {
    const offset = weeks - index - 1
    const weekStart = new Date(now)
    const weekEnd = new Date(now)
    weekStart.setDate(now.getDate() - (offset * 7 + 7))
    weekEnd.setDate(now.getDate() - offset * 7)
    return {
      week: `S${index + 1}`,
      count: conversations.filter((conversation) => {
        const date = new Date(conversation.created_at)
        return date >= weekStart && date < weekEnd
      }).length,
    }
  })
}

function groupByContextType(conversations: LiaConversationRow[]) {
  const topics = { lesson: 0, activity: 0, general: 0, motivation: 0 }
  conversations.forEach((conversation) => {
    const type =
      conversation.context_type && conversation.context_type in topics
        ? (conversation.context_type as keyof typeof topics)
        : 'general'
    topics[type] += 1
  })

  return [
    { tema: 'Dudas de Lecciones', count: topics.lesson, color: TOPIC_COLORS[0] },
    { tema: 'Ayuda con Actividades', count: topics.activity, color: TOPIC_COLORS[1] },
    { tema: 'Explicaciones Extra', count: topics.general, color: TOPIC_COLORS[2] },
    { tema: 'Motivacion', count: topics.motivation, color: TOPIC_COLORS[3] },
  ]
}
