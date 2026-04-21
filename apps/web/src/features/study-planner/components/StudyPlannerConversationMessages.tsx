'use client';

import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import type { StudyPlannerMessage } from '../types/planner-ui.types';

interface StudyPlannerConversationMessagesProps {
  conversationHistory: StudyPlannerMessage[];
  isListening: boolean;
  isProcessing: boolean;
  onOpenCourseSelector: () => void;
  selectedCourseIds: string[];
  showCourseSelector: boolean;
}

export function StudyPlannerConversationMessages({
  conversationHistory,
  isListening,
  isProcessing,
  onOpenCourseSelector,
  selectedCourseIds,
  showCourseSelector,
}: StudyPlannerConversationMessagesProps) {
  return (
    <>
      {conversationHistory.map((message, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 15, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: index * 0.05 }}
          className={`group flex max-w-full ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`flex max-w-[85%] items-end gap-2 sm:max-w-[80%] sm:gap-2.5 ${
              message.role === 'user' ? 'flex-row-reverse' : ''
            }`}
          >
            {message.role === 'assistant' && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: index * 0.05 + 0.1, type: 'spring', stiffness: 200, damping: 15 }}
                className="relative hidden h-8 w-8 flex-shrink-0 overflow-hidden rounded-full border-2 border-[#0A2540]/30 shadow-lg shadow-[#0A2540]/20 dark:border-[#00D4B3]/40 dark:shadow-[#00D4B3]/20 sm:block sm:h-10 sm:w-10"
              >
                <Image src="/lia-avatar.png" alt="LIA" fill sizes="40px" className="object-cover" />
              </motion.div>
            )}

            {message.role === 'assistant' && (
              <div className="relative mt-1 h-6 w-6 flex-shrink-0 self-start overflow-hidden rounded-full border border-[#0A2540]/30 dark:border-[#00D4B3]/40 sm:hidden">
                <Image src="/lia-avatar.png" alt="LIA" fill sizes="24px" className="object-cover" />
              </div>
            )}

            <div className="flex flex-col gap-2">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.05 + 0.15, type: 'spring', stiffness: 300, damping: 20 }}
                className={`relative max-w-full overflow-hidden px-3.5 py-2.5 shadow-sm sm:px-5 sm:py-3 ${
                  message.role === 'user'
                    ? 'rounded-[18px] rounded-br-[6px] bg-[#0A2540] text-white shadow-[#0A2540]/25 sm:rounded-[22px]'
                    : 'rounded-[18px] rounded-bl-[6px] border border-[#E9ECEF] bg-[#FFFFFF] text-[#0A2540] shadow-sm dark:border-[#6C757D]/30 dark:bg-[#1E2329] dark:text-white sm:rounded-[22px]'
                }`}
              >
                <div className="relative z-10 break-words">
                  {message.role === 'assistant' ? (
                    <div className="font-body text-[14px] leading-[1.6] tracking-wide text-[#0A2540] dark:text-white sm:text-[16px] sm:leading-[1.75]">
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                          ul: ({ children }) => <ul className="my-2 list-disc pl-5">{children}</ul>,
                          li: ({ children }) => <li className="mb-1">{children}</li>,
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="font-body whitespace-pre-wrap text-[14px] font-medium leading-[1.6] tracking-wide text-white sm:text-[16px] sm:leading-[1.75]">
                      {message.content}
                    </p>
                  )}
                </div>
              </motion.div>

              {index === 0 && message.role === 'assistant' && selectedCourseIds.length === 0 && !showCourseSelector && !isProcessing && (
                <motion.button
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.3 }}
                  onClick={onOpenCourseSelector}
                  className="flex items-center gap-2 self-start rounded-xl border border-[#0A2540]/20 bg-white px-3.5 py-2 text-sm font-medium text-[#0A2540] shadow-sm transition-all hover:border-[#00D4B3]/50 hover:bg-[#00D4B3]/5 hover:text-[#0A2540] dark:border-[#6C757D]/30 dark:bg-[#1E2329] dark:text-white dark:hover:border-[#00D4B3]/50 dark:hover:bg-[#00D4B3]/10"
                >
                  <BookOpen size={15} className="text-[#00D4B3]" />
                  Seleccionar taller
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      ))}

      {isProcessing && (
        <motion.div
          initial={{ opacity: 0, y: 15, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="group flex justify-start"
        >
          <div className="flex items-end gap-2 sm:gap-2.5">
            <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-full border-2 border-[#0A2540]/30 shadow-lg dark:border-[#00D4B3]/40 sm:h-10 sm:w-10">
              <Image src="/lia-avatar.png" alt="LIA" fill sizes="40px" className="object-cover" />
            </div>
            <motion.div
              className="relative overflow-hidden rounded-[20px] rounded-bl-[6px] border border-[#E9ECEF] bg-[#FFFFFF] px-4 py-3 shadow-sm dark:border-[#6C757D]/30 dark:bg-[#1E2329] sm:px-5 sm:py-3.5"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
            >
              <div className="relative z-10 flex items-center gap-1.5">
                {[0, 0.2, 0.4].map((delay) => (
                  <motion.div
                    key={delay}
                    animate={{ scale: [1, 1.3, 1], y: [0, -4, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay, ease: 'easeInOut' }}
                    className="h-2 w-2 rounded-full bg-[#00D4B3] shadow-lg sm:h-2.5 sm:w-2.5"
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}

      <div className="h-2 sm:h-4" />

      {isListening && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center">
          <div className="flex items-center gap-2 rounded-full border border-[#10B981]/30 bg-[#10B981]/10 px-4 py-2 dark:bg-[#10B981]/20">
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="h-3 w-3 rounded-full bg-[#10B981]"
            />
            <span className="text-sm text-[#10B981]">Escuchando...</span>
          </div>
        </motion.div>
      )}
    </>
  );
}
