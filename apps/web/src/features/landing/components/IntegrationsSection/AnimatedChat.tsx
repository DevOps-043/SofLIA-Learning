'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { ChatMessage } from './ChatMessage'
import { chatConversation } from './data'
import { TypingIndicator } from './TypingIndicator'

const MESSAGE_DELAYS = [500, 3500, 7000, 10500]
const TYPING_DELAYS = [0, 2500, 5500, 9000]

export function AnimatedChat() {
  const [visibleMessages, setVisibleMessages] = useState<number[]>([])
  const [typingMessageIndex, setTypingMessageIndex] = useState<number | null>(null)
  const [showTypingIndicator, setShowTypingIndicator] = useState(false)
  const [cycleKey, setCycleKey] = useState(0)

  useEffect(() => {
    setVisibleMessages([])
    setTypingMessageIndex(null)
    setShowTypingIndicator(false)
    const timeouts: NodeJS.Timeout[] = []
    chatConversation.forEach((message, index) => {
      if (message.type === 'lia') {
        timeouts.push(setTimeout(() => setShowTypingIndicator(true), TYPING_DELAYS[index]))
      }
      timeouts.push(setTimeout(() => {
        setShowTypingIndicator(false)
        setTypingMessageIndex(index)
        setVisibleMessages((previous) => [...previous, index])
      }, MESSAGE_DELAYS[index]))
    })
    timeouts.push(setTimeout(() => setCycleKey((previous) => previous + 1), 25000))
    return () => timeouts.forEach((timeout) => clearTimeout(timeout))
  }, [cycleKey])

  return (
    <div className="space-y-4 min-h-[280px]">
      <AnimatePresence mode="sync">
        {chatConversation.map((message, index) =>
          visibleMessages.includes(index) ? (
            <ChatMessage
              key={`${cycleKey}-${index}`}
              cycleKey={cycleKey}
              index={index}
              isTyping={typingMessageIndex === index}
              message={message.message}
              type={message.type}
              onTypingComplete={() => setTypingMessageIndex(null)}
            />
          ) : null
        )}
      </AnimatePresence>
      <AnimatePresence>{showTypingIndicator && <TypingIndicator />}</AnimatePresence>
    </div>
  )
}
