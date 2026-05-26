import { useTranslation } from 'react-i18next'
import { ChatMessage } from './ChatMessage'

interface StaticChatProps {
  messages: Array<{ type: 'user' | 'lia'; message: string }>
}

export function StaticChat({ messages }: StaticChatProps) {
  const { t } = useTranslation('common')
  const userLabel = t('landing.liaSection.preview.userLabel', 'TÚ').toUpperCase()

  return (
    <div className="space-y-4 min-h-[280px]">
      {messages.map((message, index) => (
        <ChatMessage
          key={index}
          index={index}
          type={message.type}
          message={message.message}
          userLabel={userLabel}
        />
      ))}
    </div>
  )
}
