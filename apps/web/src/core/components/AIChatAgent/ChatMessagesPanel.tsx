'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { User, Brain, Trash2, Sparkles, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { renderTextWithLinks } from './AIChatAgent.utils';
import { MAX_CONTEXT_MESSAGES } from './types';
import type { GeneratedPrompt, Message } from './types';
import type {
  NanoBananaDomain,
  NanoBananaSchema,
  OutputFormat,
} from '../../../lib/nanobana/templates';

interface ChatMessagesPanelProps {
  messages: Message[]
  isTyping: boolean
  useContextMode: boolean
  currentMode: string
  assistantAvatar: string
  assistantName: string
  isPromptMode: boolean
  theme: { borderUser: string }
  messagesEndRef: React.RefObject<HTMLDivElement>
  user: { profile_picture_url?: string; display_name?: string; username?: string } | null
  nanobanaDesc: string
  promptModeEmptyDesc: string
  contextModeEmptyDesc: string
  assistantModeEmptyDesc: string
  clearContextLabel: string
  clearContextConfirmLabel: string
  clearContextMessages: () => void
  setGeneratedPrompt: (value: GeneratedPrompt | null) => void
  setIsPromptPanelOpen: (v: boolean) => void
  setSelectedPromptMessageId: (v: string | null) => void
  setNanoBananaSchema: (value: NanoBananaSchema | null) => void
  setNanoBananaJsonString: (v: string) => void
  setNanoBananaDomain: (value: NanoBananaDomain) => void
  setNanoBananaFormat: (value: OutputFormat) => void
  setIsNanoBananaPanelOpen: (v: boolean) => void
  onNavigate: (url: string) => void
}

export function ChatMessagesPanel({
  messages, isTyping, useContextMode, currentMode,
  assistantAvatar, assistantName, isPromptMode, theme,
  messagesEndRef, user,
  nanobanaDesc, promptModeEmptyDesc, contextModeEmptyDesc, assistantModeEmptyDesc,
  clearContextLabel, clearContextConfirmLabel, clearContextMessages,
  setGeneratedPrompt, setIsPromptPanelOpen, setSelectedPromptMessageId,
  setNanoBananaSchema, setNanoBananaJsonString, setNanoBananaDomain, setNanoBananaFormat, setIsNanoBananaPanelOpen,
  onNavigate,
}: ChatMessagesPanelProps) {
  const { t: tCommon } = useTranslation('common');
  const [showClearContextConfirm, setShowClearContextConfirm] = useState(false);

  return (
    <motion.div
      className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-neutral-950 min-h-0 overscroll-contain relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{ scrollBehavior: 'smooth' }}
    >
      {/* Context indicator */}
      {useContextMode && messages.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="sticky top-0 z-10 mb-2">
          <div className="bg-accent/10 dark:bg-accent/20 border border-accent/30 rounded-lg px-3 py-2 flex items-center justify-between gap-2 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-xs text-accent">
              <Brain className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="font-medium">
                Contexto activo: {messages.length} mensaje{messages.length !== 1 ? 's' : ''} {messages.length > MAX_CONTEXT_MESSAGES ? `(mostrando últimos ${MAX_CONTEXT_MESSAGES})` : ''}
              </span>
            </div>
            {showClearContextConfirm ? (
              <div className="flex items-center gap-1">
                <span className="text-xs text-accent">{clearContextConfirmLabel}</span>
                <button onClick={() => { clearContextMessages(); setShowClearContextConfirm(false); }} className="text-xs px-2 py-0.5 rounded bg-accent text-white">Sí</button>
                <button onClick={() => setShowClearContextConfirm(false)} className="text-xs px-2 py-0.5 rounded bg-white/10 text-accent">No</button>
              </div>
            ) : (
              <button
                onClick={() => setShowClearContextConfirm(true)}
                className="text-accent hover:text-accent transition-colors"
                title={clearContextLabel}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* Empty state */}
      {messages.length === 0 && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center px-6">
          <div className="max-w-sm text-center opacity-80">
            <div className="mx-auto mb-3 w-16 h-16 rounded-full flex items-center justify-center shadow-lg overflow-hidden bg-transparent">
              <img src="/Logo.png" onError={(e) => ((e.target as HTMLImageElement).src = assistantAvatar)} alt="SofLIA" className="w-full h-full object-contain" />
            </div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-1 text-base">SofLIA</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              {currentMode === 'nanobana' ? nanobanaDesc : currentMode === 'prompt' ? promptModeEmptyDesc : currentMode === 'analysis' ? contextModeEmptyDesc : assistantModeEmptyDesc}
            </p>
          </div>
        </div>
      )}

      {/* Messages */}
      {messages.map((message, index) => (
        <motion.div
          key={message.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
        >
          <div className={`flex-shrink-0 w-9 h-9 rounded-full overflow-hidden border ${theme.borderUser} relative`}>
            {message.role === 'user' ? (
              user?.profile_picture_url ? (
                <Image src={user.profile_picture_url} alt={user.display_name || user.username || 'Usuario'} fill className="object-cover" sizes="40px" />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-primary to-accent flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
              )
            ) : (
              <Image src={assistantAvatar} alt={assistantName} fill className="object-cover" sizes="40px" />
            )}
          </div>

          <div className={`flex-1 rounded-2xl px-3.5 py-3 shadow-lg ${message.role === 'user' ? 'bg-success text-white' : 'bg-primary text-white dark:bg-primary'}`}>
            <p className="text-[13px] leading-relaxed whitespace-pre-wrap font-medium">
              {renderTextWithLinks(message.content, (url) => onNavigate(url))}
            </p>

            {message.role === 'assistant' && message.generatedPrompt && isPromptMode && (
              <motion.button
                onClick={() => { setGeneratedPrompt(message.generatedPrompt!); setIsPromptPanelOpen(true); setSelectedPromptMessageId(message.id) }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg text-xs font-semibold transition-all duration-200"
              >
                <Sparkles className="w-3 h-3" />
                {tCommon('aiChat.promptMode.viewGenerated')}
              </motion.button>
            )}

            {message.role === 'assistant' && message.generatedNanoBanana && (
              <motion.button
                onClick={() => {
                  setNanoBananaSchema(message.generatedNanoBanana!.schema);
                  setNanoBananaJsonString(message.generatedNanoBanana!.jsonString);
                  setNanoBananaDomain(message.generatedNanoBanana!.domain);
                  setNanoBananaFormat(message.generatedNanoBanana!.outputFormat);
                  setIsNanoBananaPanelOpen(true);
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg text-xs font-semibold transition-all duration-200"
              >
                <Download className="w-3 h-3" />
                Ver JSON NanoBanana
              </motion.button>
            )}
          </div>
        </motion.div>
      ))}

      {/* Typing indicator */}
      {isTyping && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 items-center">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-purple-500 relative">
            <Image src={assistantAvatar} alt={assistantName} fill className="object-cover" sizes="40px" />
          </div>
          <div className="bg-white dark:bg-carbon-800 border border-gray-200 dark:border-primary/30 rounded-2xl px-4 py-3">
            <div className="flex gap-1">
              {[0, 0.2, 0.4].map((delay) => (
                <motion.div
                  key={delay}
                  className="w-2 h-2 bg-gray-400 rounded-full"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}

      <div ref={messagesEndRef} />
    </motion.div>
  );
}
