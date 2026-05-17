import { compareLiaMessages } from './compare-lia-messages'
import { LiaMessageRecord } from './lia-message-record'

export function buildDerivedResponseTimes(messages: LiaMessageRecord[]): number[] {
  const messagesByConversation = new Map<string, LiaMessageRecord[]>()
  messages.forEach((message) => {
    messagesByConversation.set(message.conversation_id, [
      ...(messagesByConversation.get(message.conversation_id) || []),
      message,
    ])
  })

  const responseTimes: number[] = []
  messagesByConversation.forEach((conversationMessages) => {
    const sortedMessages = [...conversationMessages].sort(compareLiaMessages)
    let latestUserMessageAt: string | null = null

    sortedMessages.forEach((message) => {
      if (message.role === 'user') {
        latestUserMessageAt = message.created_at
        return
      }

      if (!latestUserMessageAt || message.response_time_ms) return
      const userTime = new Date(latestUserMessageAt).getTime()
      const responseTime = message.created_at ? new Date(message.created_at).getTime() : NaN
      if (Number.isNaN(userTime) || Number.isNaN(responseTime) || responseTime <= userTime) return
      responseTimes.push(responseTime - userTime)
      latestUserMessageAt = null
    })
  })

  return responseTimes
}
