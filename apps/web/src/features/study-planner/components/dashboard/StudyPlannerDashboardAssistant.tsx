'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  Loader2,
  Send,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
import type { RefObject } from 'react';
import type {
  DashboardMessage,
  StudyPlannerAction,
} from '../../hooks/useStudyPlannerDashboardSofLIA';
import { StudyPlannerDashboardAssistantLauncher } from './StudyPlannerDashboardAssistantLauncher';
import { StudyPlannerDashboardAssistantMessage } from './StudyPlannerDashboardAssistantMessage';

interface StudyPlannerDashboardAssistantProps {
  clearError: () => void;
  clearMessages: () => void;
  error: string | null;
  isCollapsed: boolean;
  isOpen: boolean;
  isSending: boolean;
  liaPanelRef: RefObject<HTMLDivElement | null>;
  message: string;
  messages: DashboardMessage[];
  messagesEndRef: RefObject<HTMLDivElement | null>;
  onExecuteAction: (action: StudyPlannerAction, data: Record<string, unknown>) => Promise<void>;
  onMessageChange: (value: string) => void;
  onOpen: () => void;
  onSendMessage: () => void;
  setIsCollapsed: (value: boolean) => void;
}

export function StudyPlannerDashboardAssistant({
  clearError,
  clearMessages,
  error,
  isCollapsed,
  isOpen,
  isSending,
  liaPanelRef,
  message,
  messages,
  messagesEndRef,
  onExecuteAction,
  onMessageChange,
  onOpen,
  onSendMessage,
  setIsCollapsed,
}: StudyPlannerDashboardAssistantProps) {
  return (
    <>
      <AnimatePresence>
        {isOpen && !isCollapsed && (
          <motion.aside
            id="dashboard-lia-panel"
            ref={liaPanelRef}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 z-40 flex h-screen w-full max-w-[420px] flex-col overflow-hidden rounded-bl-[30px] rounded-tl-[30px] border-l border-gray-200 bg-white shadow-[-4px_0_32px_rgba(0,0,0,0.1)] dark:border-[#1e2a35] dark:bg-[#0a0f14] dark:shadow-[-4px_0_32px_rgba(0,0,0,0.4)]"
          >
            <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-5 dark:border-[#1e2a35] dark:bg-[#0a0f14]">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src="/lia-avatar.png"
                    alt="SofLIA"
                    width={40}
                    height={40}
                    className="rounded-full border-2 border-[#00D4B3] object-cover"
                  />
                  <div className="absolute bottom-[-2px] right-[-2px] h-[14px] w-[14px] rounded-full border-2 border-[#0a0f14] bg-green-500" />
                </div>

                <div>
                  <h2 className="m-0 text-base font-semibold leading-[1.2] text-gray-900 dark:text-white">
                    SofLIA
                  </h2>
                  <p className="m-0 text-xs font-medium text-[#00D4B3]">
                    Asistente de tu plan
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={clearMessages}
                  title="Limpiar conversacion"
                  className={`flex h-8 w-8 items-center justify-center rounded-lg border-none bg-transparent transition-colors ${
                    messages.length > 0
                      ? 'cursor-pointer opacity-100 hover:bg-red-50 dark:hover:bg-[#450a0a]'
                      : 'cursor-not-allowed opacity-50'
                  }`}
                  disabled={messages.length === 0}
                >
                  <Trash2 className="h-[18px] w-[18px] text-red-500 dark:text-[#f87171]" />
                </button>

                <button
                  onClick={() => setIsCollapsed(true)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border-none bg-transparent transition-colors hover:bg-gray-100 dark:hover:bg-[#1e2a35]"
                >
                  <X className="h-[18px] w-[18px] text-gray-500 dark:text-[#6b7280]" />
                </button>
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-5 py-4">
              {messages.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center px-5 text-center opacity-80">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="relative mb-6"
                  >
                    <div className="absolute top-1/2 left-1/2 h-[120px] w-[120px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#00D4B3] opacity-20 blur-[40px] z-0" />
                    <img
                      src="/lia-avatar.png"
                      alt="SofLIA"
                      width={80}
                      height={80}
                      className="relative z-10 rounded-full border-[3px] border-[#00D4B3] object-cover shadow-[0_0_20px_rgba(0,212,179,0.4)]"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                  >
                    <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                      SofLIA
                    </h3>
                    <p className="mx-auto max-w-[280px] text-sm leading-relaxed text-gray-500 dark:text-[#6b7280]">
                      Puedo ayudarte a reprogramar sesiones, ajustar tu plan o resolver conflictos de horario.
                    </p>
                  </motion.div>
                </div>
              ) : (
                <>
                  {messages.map((currentMessage) => (
                    <StudyPlannerDashboardAssistantMessage
                      key={currentMessage.id}
                      isBusy={isSending}
                      message={currentMessage}
                      onExecuteAction={onExecuteAction}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}

              {isSending && (
                <div className="flex justify-start">
                  <div className="mr-2 flex-shrink-0">
                    <img
                      src="/lia-avatar.png"
                      alt="SofLIA"
                      width={32}
                      height={32}
                      className="rounded-full object-cover"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 rounded-[16px_16px_16px_4px] bg-gray-100 px-4 py-3 dark:bg-[#1e2a35]">
                    <div className="h-2 w-2 rounded-full bg-[#00D4B3] animate-[liaPulse_1s_infinite]" />
                    <div className="h-2 w-2 rounded-full bg-[#00D4B3] animate-[liaPulse_1s_infinite_0.2s]" />
                    <div className="h-2 w-2 rounded-full bg-[#00D4B3] animate-[liaPulse_1s_infinite_0.4s]" />
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="border-t border-red-100 bg-red-50 px-5 py-2 dark:border-red-900/20 dark:bg-red-900/10">
                <div className="flex items-center justify-between">
                  <p className="m-0 text-sm text-red-500 dark:text-[#f87171]">{error}</p>
                  <button onClick={clearError} className="border-none bg-transparent p-1">
                    <XCircle className="h-4 w-4 text-red-500 dark:text-[#f87171]" />
                  </button>
                </div>
              </div>
            )}

            <div className="border-t border-gray-200 bg-white p-3 pb-4 dark:border-[#1e2a35] dark:bg-[#0a0f14]">
              <div className="flex items-center gap-3 rounded-3xl border border-gray-200 bg-gray-50 px-4 py-2.5 dark:border-[#374151] dark:bg-[rgba(255,255,255,0.05)]">
                <input
                  id="dashboard-chat-input"
                  value={message}
                  onChange={(event) => onMessageChange(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      onSendMessage();
                    }
                  }}
                  placeholder="Escribe un mensaje a SofLIA..."
                  className="flex-1 border-none bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-white"
                />

                <button
                  onClick={onSendMessage}
                  disabled={!message.trim() || isSending}
                  className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                    message.trim() && !isSending
                      ? 'cursor-pointer bg-[#00D4B3] hover:bg-[#00c0a3]'
                      : 'cursor-not-allowed bg-gray-200 dark:bg-[#374151]'
                  }`}
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                  ) : (
                    <Send className="h-4 w-4 text-white" />
                  )}
                </button>
              </div>
            </div>

            <style>{`
              @keyframes liaPulse {
                0%, 100% { opacity: 0.4; transform: scale(1); }
                50% { opacity: 1; transform: scale(1.2); }
              }
            `}</style>
          </motion.aside>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(isCollapsed || !isOpen) && (
          <StudyPlannerDashboardAssistantLauncher
            hasMessages={messages.length > 0}
            onOpen={onOpen}
          />
        )}
      </AnimatePresence>
    </>
  );
}
