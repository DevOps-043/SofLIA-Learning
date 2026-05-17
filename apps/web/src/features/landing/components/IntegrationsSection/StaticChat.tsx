import { chatConversation } from './data'
import { ChatMessage } from './ChatMessage'

export function StaticChat() {
  return (
    <div className="space-y-4 min-h-[280px]">
      {chatConversation.map((message, index) => (
        <ChatMessage
          key={index}
          index={index}
          type={message.type}
          message={message.message}
        />
      ))}
    </div>
  )
}
