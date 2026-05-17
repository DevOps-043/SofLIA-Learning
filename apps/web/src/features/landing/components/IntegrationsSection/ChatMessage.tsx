import Image from 'next/image'
import { motion } from 'framer-motion'
import { TypewriterText } from './TypewriterText'

interface ChatMessageProps {
  cycleKey?: number
  index: number
  isTyping?: boolean
  message: string
  type: 'user' | 'lia'
  onTypingComplete?: () => void
}

export function ChatMessage({
  cycleKey = 0,
  index,
  isTyping = false,
  message,
  type,
  onTypingComplete,
}: ChatMessageProps) {
  const isUser = type === 'user'
  return (
    <motion.div
      key={`${cycleKey}-${index}`}
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && (
        <div className="relative w-8 h-8 rounded-full overflow-hidden border border-[#00D4B3]/50 flex-shrink-0">
          <Image src="/lia-avatar.webp" alt="LIA" fill className="object-cover object-top" />
        </div>
      )}
      <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm ${isUser ? 'bg-[#00D4B3] text-white rounded-br-md' : 'bg-white/10 text-white/90 rounded-bl-md'}`}>
        {isTyping ? <TypewriterText text={message} speed={isUser ? 40 : 25} onComplete={onTypingComplete} /> : message}
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-[#00D4B3]/20 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-[#00D4B3]">Tú</span>
        </div>
      )}
    </motion.div>
  )
}
