'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, Mic, MicOff, Send } from 'lucide-react'
import type { ReactNode } from 'react'
import type { StudyApproach } from '../types/planner-ui.types'

interface StudyPlannerConversationComposerProps {
  isListening: boolean
  isMobile: boolean
  isProcessing: boolean
  onSubmitMessage: (message: string) => void
  onToggleListening: () => void
  onUserMessageChange: (value: string) => void
  showApproachButtons: boolean
  studyApproach: StudyApproach | null
  userMessage: string
}

export function StudyPlannerConversationComposer({
  isListening,
  isMobile,
  isProcessing,
  onSubmitMessage,
  onToggleListening,
  onUserMessageChange,
  showApproachButtons,
  studyApproach,
  userMessage,
}: StudyPlannerConversationComposerProps) {
  const hasComposerText = userMessage.trim().length > 0
  const isComposerDisabled = isProcessing || (showApproachButtons && !studyApproach)
  const isVoiceButtonDisabled =
    isProcessing || (isListening && hasComposerText) || (showApproachButtons && !studyApproach)

  return (
    <div className="flex-shrink-0 border-t border-[#E9ECEF] bg-white px-3 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] backdrop-blur-xl dark:border-[#6C757D]/30 dark:bg-[#0F1419] sm:px-4 sm:py-4">
      <div className="mx-auto w-full max-w-4xl">
        <div className="flex w-full items-center gap-2 sm:gap-3">
          <input
            id="lia-chat-input"
            type="text"
            value={userMessage}
            onChange={(event) => onUserMessageChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey && hasComposerText) {
                event.preventDefault()
                onSubmitMessage(userMessage)
                onUserMessageChange('')
              }
            }}
            placeholder={isMobile ? 'Escribe un mensaje...' : 'Escribe tu mensaje o usa el microfono...'}
            disabled={isComposerDisabled || isListening}
            style={{ fontSize: '16px' }}
            className="min-w-0 flex-1 rounded-xl border border-[#E9ECEF] bg-white px-4 py-3 text-[#0A2540] shadow-sm transition-all placeholder-[#6C757D] focus:border-[#00D4B3]/50 focus:outline-none focus:ring-2 focus:ring-[#00D4B3]/50 disabled:opacity-50 dark:border-[#6C757D]/30 dark:bg-[#1E2329] dark:text-white"
          />

          <motion.button
            id="lia-voice-button"
            onClick={() => {
              if (hasComposerText) {
                onSubmitMessage(userMessage)
                onUserMessageChange('')
                return
              }

              onToggleListening()
            }}
            disabled={isVoiceButtonDisabled}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl shadow-sm transition-all duration-300 sm:h-12 sm:w-12 ${
              hasComposerText
                ? 'bg-[#0A2540] text-white hover:bg-[#0d2f4d] dark:bg-[#0A2540] dark:hover:bg-[#0d2f4d]'
                : isListening
                  ? 'bg-[#10B981] text-white hover:bg-[#10B981]/90'
                  : 'bg-[#0A2540] text-white hover:bg-[#0d2f4d] dark:bg-[#0A2540] dark:hover:bg-[#0d2f4d]'
            } ${isVoiceButtonDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
          >
            <AnimatePresence mode="wait">
              {isProcessing && hasComposerText ? (
                <AnimatedComposerIcon keyName="loading">
                  <Loader2 size={20} className="animate-spin" />
                </AnimatedComposerIcon>
              ) : hasComposerText ? (
                <AnimatedComposerIcon keyName="send" rotate>
                  <Send size={20} />
                </AnimatedComposerIcon>
              ) : isListening ? (
                <AnimatedComposerIcon keyName="mic-off">
                  <MicOff size={20} />
                </AnimatedComposerIcon>
              ) : (
                <AnimatedComposerIcon keyName="mic">
                  <Mic size={20} />
                </AnimatedComposerIcon>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </div>
  )
}

function AnimatedComposerIcon({
  children,
  keyName,
  rotate,
}: {
  children: ReactNode
  keyName: string
  rotate?: boolean
}) {
  return (
    <motion.div
      key={keyName}
      initial={{ opacity: 0, scale: 0.8, rotate: rotate ? -90 : 0 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      exit={{ opacity: 0, scale: 0.8, rotate: rotate ? 90 : 0 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  )
}
