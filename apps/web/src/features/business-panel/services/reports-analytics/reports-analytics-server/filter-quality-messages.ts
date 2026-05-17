import { shouldIncludeEngagementRecord } from './should-include-engagement-record'
import type { BuildContext } from './build-context'
import type { LiaConversationRecord } from './lia-conversation-record'
import type { LiaMessageRecord } from './lia-message-record'

export function filterQualityMessages(
  context: BuildContext,
  conversations: LiaConversationRecord[],
  messages: LiaMessageRecord[],
): LiaMessageRecord[] {
  const conversationById = new Map(conversations.map((conversation) => [conversation.conversation_id, conversation]))

  return messages.filter((message) => {
    const conversation = conversationById.get(message.conversation_id)
    if (!conversation) return false
    return shouldIncludeEngagementRecord(context, conversation.user_id, conversation.course_id, [
      conversation.started_at,
      conversation.ended_at,
      conversation.created_at,
      conversation.updated_at,
      message.created_at,
    ])
  })
}
