import { REPORTS_ANALYTICS_UNSPECIFIED, calculateAverage, clampPercentage } from '../reports-analytics.helpers'
import { ensureCourse } from './ensure-course'
import { pushAiSample } from './push-ai-sample'
import { pushLastActivity } from './push-last-activity'
import { shouldIncludeEngagementRecord } from './should-include-engagement-record'
import { stringifySampleContent } from './stringify-sample-content'
import { unwrapRelation } from './unwrap-relation'
import type { BuildContext } from './build-context'
import type { LiaConversationRecord } from './lia-conversation-record'
import type { LiaMessageRecord } from './lia-message-record'

export function applyLiaConversations(
  context: BuildContext,
  conversations: LiaConversationRecord[],
  messages: LiaMessageRecord[],
): void {
  const messagesByConversation = messages.reduce((map, message) => {
    const list = map.get(message.conversation_id) || []
    list.push(message)
    map.set(message.conversation_id, list)
    return map
  }, new Map<string, LiaMessageRecord[]>())

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

    const user = context.users.get(conversation.user_id)
    if (!user) return

    const conversationMessages = messagesByConversation.get(conversation.conversation_id) || []
    const userMessages = conversationMessages.filter((message) => message.role === 'user')
    const offTopicMessages = userMessages.filter((message) => message.is_off_topic).length
    const redirectedMessages = conversationMessages.filter((message) => message.lia_redirected).length
    const questionMessages = userMessages.filter((message) => message.contains_question).length
    const sentimentScores = conversationMessages
      .map((message) => Number(message.sentiment_score))
      .filter((value) => Number.isFinite(value))
    const sentimentScore = sentimentScores.length > 0
      ? clampPercentage(((calculateAverage(sentimentScores) + 1) / 2) * 100)
      : 70
    const sofliaQualityScore = clampPercentage(
      sentimentScore -
        Math.min(25, offTopicMessages * 8) -
        Math.min(15, redirectedMessages * 5) +
        Math.min(10, questionMessages * 2),
    )
    const messageCount =
      Number(conversation.total_messages) ||
      conversationMessages.length ||
      Number(conversation.total_lia_messages) + Number(conversation.total_user_messages) ||
      0
    const course = ensureCourse(context, courseId, unwrapRelation(conversation.courses)?.title)

    user.detail.sofliaConversations += 1
    user.detail.sofliaMessages += messageCount
    user.sofliaQualityScores.push(sofliaQualityScore)
    course.sofliaConversations += 1
    course.activeLearners.add(conversation.user_id)
    pushLastActivity(user, conversation.started_at, conversation.ended_at, conversation.created_at, conversation.updated_at)
    userMessages.slice(0, 3).forEach((message) => {
      pushAiSample(context, {
        source: 'soflia_message',
        userId: conversation.user_id,
        courseId,
        courseTitle: unwrapRelation(conversation.courses)?.title || context.courses.get(courseId)?.courseTitle,
        text: stringifySampleContent(message.content),
        signals: {
          containsQuestion: message.contains_question,
          isOffTopic: message.is_off_topic,
          sentimentScore: message.sentiment_score ?? null,
          userSentiment: message.user_sentiment ?? null,
        },
      })
    })
  })
}
