'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  CheckCircle,
  Loader2,
  Send,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { RefObject } from 'react';
import type { DashboardMessage } from '../../hooks/useStudyPlannerDashboardSofLIA';

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
  onMessageChange: (value: string) => void;
  onOpen: () => void;
  onSendMessage: () => void;
  setIsCollapsed: (value: boolean) => void;
}

function DashboardAssistantMessage({
  message,
}: {
  message: DashboardMessage;
}) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="mr-2 flex-shrink-0">
          <img
            src="/lia-avatar.png"
            alt="SofLIA"
            width={32}
            height={32}
            className="rounded-full object-cover"
          />
        </div>
      )}
      <div
        className={`max-w-[85%] px-4 py-3 ${
          isUser
            ? 'bg-[#0A2540] dark:bg-[#0A2540] text-white rounded-[16px_16px_4px_16px]'
            : 'bg-gray-100 dark:bg-[#1e2a35] text-gray-900 dark:text-white rounded-[16px_16px_16px_4px]'
        }`}
      >
        <div className="text-sm leading-relaxed m-0 whitespace-pre-wrap">
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
              ul: ({ children }) => <ul className="my-2 pl-5 list-disc">{children}</ul>,
              li: ({ children }) => <li className="mb-1">{children}</li>,
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
        {message.actionStatus === 'success' && (
          <div className="flex items-center gap-1 mt-2 text-xs text-green-500">
            <CheckCircle className="w-3 h-3" />
            <span>Accion completada</span>
          </div>
        )}
        {message.actionStatus === 'error' && (
          <div className="flex items-center gap-1 mt-2 text-xs text-red-500">
            <XCircle className="w-3 h-3" />
            <span>Error en la accion</span>
          </div>
        )}
        <p
          className={`text-[10px] mt-1.5 mb-0 ${
            isUser ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          {message.timestamp.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  );
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
            className="fixed top-0 right-0 w-full max-w-[420px] h-screen bg-white dark:bg-[#0a0f14] border-l border-gray-200 dark:border-[#1e2a35] rounded-tl-[30px] rounded-bl-[30px] overflow-hidden z-40 flex flex-col shadow-[-4px_0_32px_rgba(0,0,0,0.1)] dark:shadow-[-4px_0_32px_rgba(0,0,0,0.4)]"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-[#1e2a35] bg-white dark:bg-[#0a0f14]">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src="/lia-avatar.png"
                    alt="SofLIA"
                    width={40}
                    height={40}
                    className="rounded-full object-cover border-2 border-[#00D4B3]"
                  />
                  <div className="absolute bottom-[-2px] right-[-2px] w-[14px] h-[14px] bg-green-500 rounded-full border-2 border-[#0a0f14]" />
                </div>

                <div>
                  <h2 className="text-gray-900 dark:text-white text-base font-semibold m-0 leading-[1.2]">
                    SofLIA
                  </h2>
                  <p className="text-[#00D4B3] text-xs font-medium m-0">
                    Asistente de tu plan
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={clearMessages}
                  title="Limpiar conversacion"
                  className={`w-8 h-8 rounded-lg bg-transparent border-none flex items-center justify-center transition-colors ${
                    messages.length > 0
                      ? 'cursor-pointer opacity-100 hover:bg-red-50 dark:hover:bg-[#450a0a]'
                      : 'cursor-not-allowed opacity-50'
                  }`}
                  disabled={messages.length === 0}
                >
                  <Trash2 className="w-[18px] h-[18px] text-red-500 dark:text-[#f87171]" />
                </button>

                <button
                  onClick={() => setIsCollapsed(true)}
                  className="w-8 h-8 rounded-lg bg-transparent border-none flex items-center justify-center transition-colors cursor-pointer hover:bg-gray-100 dark:hover:bg-[#1e2a35]"
                >
                  <X className="w-[18px] h-[18px] text-gray-500 dark:text-[#6b7280]" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
              {messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-80 px-5">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="mb-6 relative"
                  >
                    <div className="absolute top-1/2 left-1/2 w-[120px] h-[120px] rounded-full bg-[#00D4B3] blur-[40px] opacity-20 -translate-x-1/2 -translate-y-1/2 z-0" />
                    <img
                      src="/lia-avatar.png"
                      alt="SofLIA"
                      width={80}
                      height={80}
                      className="rounded-full object-cover border-[3px] border-[#00D4B3] shadow-[0_0_20px_rgba(0,212,179,0.4)] relative z-10"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                  >
                    <h3 className="text-gray-900 dark:text-white text-lg font-semibold mb-2">
                      SofLIA
                    </h3>
                    <p className="text-gray-500 dark:text-[#6b7280] text-sm leading-relaxed max-w-[280px] mx-auto">
                      Puedo ayudarte a reprogramar sesiones, ajustar tu plan o resolver conflictos de horario.
                    </p>
                  </motion.div>
                </div>
              ) : (
                <>
                  {messages.map((currentMessage) => (
                    <DashboardAssistantMessage
                      key={currentMessage.id}
                      message={currentMessage}
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
                  <div className="px-4 py-3 rounded-[16px_16px_16px_4px] bg-gray-100 dark:bg-[#1e2a35] flex gap-1.5 items-center">
                    <div className="w-2 h-2 rounded-full bg-[#00D4B3] animate-[liaPulse_1s_infinite]" />
                    <div className="w-2 h-2 rounded-full bg-[#00D4B3] animate-[liaPulse_1s_infinite_0.2s]" />
                    <div className="w-2 h-2 rounded-full bg-[#00D4B3] animate-[liaPulse_1s_infinite_0.4s]" />
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="px-5 py-2 bg-red-50 dark:bg-red-900/10 border-t border-red-100 dark:border-red-900/20">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-red-500 dark:text-[#f87171] m-0">{error}</p>
                  <button onClick={clearError} className="bg-transparent border-none cursor-pointer p-1">
                    <XCircle className="w-4 h-4 text-red-500 dark:text-[#f87171]" />
                  </button>
                </div>
              </div>
            )}

            <div className="p-3 pb-4 border-t border-gray-200 dark:border-[#1e2a35] bg-white dark:bg-[#0a0f14]">
              <div className="flex items-center gap-3 bg-gray-50 dark:bg-[rgba(255,255,255,0.05)] rounded-3xl px-4 py-2.5 border border-gray-200 dark:border-[#374151]">
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
                  className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white text-sm placeholder:text-gray-400"
                />

                <button
                  onClick={onSendMessage}
                  disabled={!message.trim() || isSending}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                    message.trim() && !isSending
                      ? 'bg-[#00D4B3] hover:bg-[#00c0a3] cursor-pointer'
                      : 'bg-gray-200 dark:bg-[#374151] cursor-not-allowed'
                  }`}
                >
                  {isSending ? (
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 text-white" />
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
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            onClick={onOpen}
            className="fixed right-4 bottom-4 z-50 w-16 h-16 rounded-full shadow-2xl hover:shadow-[#0A2540]/50 dark:hover:shadow-[#00D4B3]/50 flex items-center justify-center transition-all hover:scale-110 active:scale-95 group overflow-hidden ring-4 ring-[#0A2540]/20 dark:ring-[#00D4B3]/30"
            title="Abrir LIA Coach"
          >
            <div className="relative w-full h-full">
              <img
                src="/lia-avatar.png"
                alt="SofLIA"
                className="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-110"
                width={64}
                height={64}
              />
            </div>
            {messages.length > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 z-10"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="w-full h-full bg-red-500 rounded-full"
                />
              </motion.div>
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
