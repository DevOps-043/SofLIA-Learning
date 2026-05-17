import type { ReportsAnalyticsSoflia } from '../../../types/reports-analytics.types'
import { REPORTS_ANALYTICS_UNSPECIFIED, buildBreakdown, buildPeriodKey, buildPeriodTrend, calculateAverage, calculatePercentage, incrementMap, normalizeDimension } from '../reports-analytics.helpers'
import { shouldIncludeEngagementRecord } from './should-include-engagement-record'
import type { BuildContext } from './build-context'
import type { LiaConversationRecord } from './lia-conversation-record'
import type { LiaMessageRecord } from './lia-message-record'

export function buildSoflia(
  context: BuildContext,
  conversations: LiaConversationRecord[],
  messages: LiaMessageRecord[],
): ReportsAnalyticsSoflia {
  const messageCountByConversation = messages.reduce((map, message) => {
    map.set(message.conversation_id, (map.get(message.conversation_id) || 0) + 1)
    return map
  }, new Map<string, number>())
  const contextCounts = new Map<string, number>()
  const conversationsTrendCounts = new Map<string, number>()
  let totalConversations = 0
  let completedConversations = 0
  let totalMessages = 0
  const activeUsers = new Set<string>()

  conversations.forEach((conversation) => {
    const courseId = conversation.course_id || REPORTS_ANALYTICS_UNSPECIFIED
    if (
      !shouldIncludeEngagementRecord(context, conversation.user_id, courseId, [
        conversation.started_at,
        conversation.ended_at,
        conversation.created_at,
        conversation.updated_at,
      ])
    ) {
      return
    }

    totalConversations += 1
    totalMessages +=
      Number(conversation.total_messages) ||
      messageCountByConversation.get(conversation.conversation_id) ||
      Number(conversation.total_lia_messages) + Number(conversation.total_user_messages) ||
      0
    activeUsers.add(conversation.user_id)
    incrementMap(contextCounts, normalizeDimension(conversation.context_type))

    const trendDate = conversation.started_at || conversation.created_at
    if (trendDate) incrementMap(conversationsTrendCounts, buildPeriodKey(trendDate, context.filters.granularity))

    if (conversation.conversation_completed) {
      completedConversations += 1
    }
  })

  const conversationsTrend = buildPeriodTrend(conversationsTrendCounts, context.filters)

  return {
    totalConversations,
    totalMessages,
    activeUsers: activeUsers.size,
    averageMessagesPerConversation: calculateAverage(
      totalConversations > 0 ? [totalMessages / totalConversations] : [],
    ),
    completionRate: calculatePercentage(completedConversations, totalConversations),
    contextBreakdown: buildBreakdown(contextCounts, totalConversations),
    conversationsTrend,
    conversationsByMonth: conversationsTrend,
  }
}
