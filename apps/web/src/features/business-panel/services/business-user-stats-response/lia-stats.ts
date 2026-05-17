import type { BusinessUserStatsCourseData } from '../../types/business-user-stats.types'
import type { BusinessUserStatsLiaConversationRecord, BusinessUserStatsLiaMessageRecord } from '../business-user-stats-query.service'

export function applyLiaStats(
  courseStatsMap: Map<string, BusinessUserStatsCourseData>,
  conversations: BusinessUserStatsLiaConversationRecord[],
  messages: BusinessUserStatsLiaMessageRecord[],
) {
  const durationsByCourse = new Map<string, number[]>()
  const messagesByConversation = messages.reduce((map, message) => {
    map.set(message.conversation_id, (map.get(message.conversation_id) || 0) + 1)
    return map
  }, new Map<string, number>())

  conversations.forEach((conversation) => {
    if (!conversation.course_id || !courseStatsMap.has(conversation.course_id)) return
    const stats = courseStatsMap.get(conversation.course_id)
    if (!stats) return
    stats.lia_conversations_count = (stats.lia_conversations_count || 0) + 1
    stats.lia_messages_count = (stats.lia_messages_count || 0) + (conversation.total_messages ?? messagesByConversation.get(conversation.conversation_id) ?? 0)
    collectConversationDuration(durationsByCourse, conversation)
    updateLastConversation(stats, conversation.started_at)
  })

  durationsByCourse.forEach((durations, courseId) => {
    const stats = courseStatsMap.get(courseId)
    if (!stats || durations.length === 0) return
    stats.lia_avg_duration_minutes = Math.round((durations.reduce((sum, value) => sum + value, 0) / durations.length) * 10) / 10
  })
}

function collectConversationDuration(map: Map<string, number[]>, conversation: BusinessUserStatsLiaConversationRecord) {
  if (!conversation.course_id || !conversation.started_at || !conversation.ended_at) return
  const duration = (new Date(conversation.ended_at).getTime() - new Date(conversation.started_at).getTime()) / (1000 * 60)
  const durations = map.get(conversation.course_id)
  if (durations) durations.push(duration)
  else map.set(conversation.course_id, [duration])
}

function updateLastConversation(stats: BusinessUserStatsCourseData, startedAt: string | null) {
  if (!startedAt) return
  const lastConversation = stats.lia_last_conversation
  if (!lastConversation || new Date(startedAt).getTime() > new Date(lastConversation).getTime()) stats.lia_last_conversation = startedAt
}
