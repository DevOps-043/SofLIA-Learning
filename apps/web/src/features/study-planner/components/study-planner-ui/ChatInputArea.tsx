'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Send, Loader2 } from 'lucide-react';

interface ChatInputAreaProps {
  userMessage: string;
  isMobile: boolean;
  isProcessing: boolean;
  isListening: boolean;
  showApproachButtons: boolean;
  studyApproach: string | null;
  onMessageChange: (value: string) => void;
  onSendMessage: (message: string) => void;
  onToggleListening: () => void;
}

export function ChatInputArea({
  userMessage,
  isMobile,
  isProcessing,
  isListening,
  showApproachButtons,
  studyApproach,
  onMessageChange,
  onSendMessage,
  onToggleListening,
}: ChatInputAreaProps) {
  return (
    <div className="flex-shrink-0 bg-white dark:bg-[#0F1419] backdrop-blur-xl border-t border-[#E9ECEF] dark:border-[#6C757D]/30 px-3 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-4 sm:py-4">
      <div className="max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-2 sm:gap-3 w-full">
          {/* Input de texto */}
          <input
            id="lia-chat-input"
            type="text"
            value={userMessage}
            onChange={(e) => onMessageChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && userMessage.trim()) {
                e.preventDefault();
                onSendMessage(userMessage);
                onMessageChange('');
              }
            }}
            placeholder={isMobile ? "Escribe un mensaje..." : "Escribe tu mensaje o usa el micrófono..."}
            disabled={isProcessing || isListening || (showApproachButtons && !studyApproach)}
            style={{ fontSize: '16px' }}
            className="flex-1 min-w-0 px-4 py-3 bg-white dark:bg-[#1E2329] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D] focus:outline-none focus:ring-2 focus:ring-[#00D4B3]/50 focus:border-[#00D4B3]/50 disabled:opacity-50 shadow-sm transition-all"
          />

          {/* Botón dinámico: micrófono cuando vacío, enviar cuando hay texto */}
          <motion.button
            id="lia-voice-button"
            onClick={() => {
              if (userMessage.trim()) {
                onSendMessage(userMessage);
                onMessageChange('');
              } else {
                onToggleListening();
              }
            }}
            disabled={isProcessing || (isListening && !!userMessage.trim()) || (showApproachButtons && !studyApproach)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`w-11 h-11 sm:w-12 sm:h-12 flex-shrink-0 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm ${userMessage.trim()
              ? 'bg-[#0A2540] dark:bg-[#0A2540] text-white hover:bg-[#0d2f4d] dark:hover:bg-[#0d2f4d]'
              : isListening
                ? 'bg-[#10B981] text-white hover:bg-[#10B981]/90'
                : 'bg-[#0A2540] dark:bg-[#0A2540] text-white hover:bg-[#0d2f4d] dark:hover:bg-[#0d2f4d]'
              } ${(isProcessing || (isListening && userMessage.trim()) || (showApproachButtons && !studyApproach)) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <AnimatePresence mode="wait">
              {isProcessing && userMessage.trim() ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  <Loader2 size={20} className="animate-spin" />
                </motion.div>
              ) : userMessage.trim() ? (
                <motion.div
                  key="send"
                  initial={{ opacity: 0, scale: 0.8, rotate: -90 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.8, rotate: 90 }}
                  transition={{ duration: 0.2 }}
                >
                  <Send size={20} />
                </motion.div>
              ) : isListening ? (
                <motion.div
                  key="mic-off"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  <MicOff size={20} />
                </motion.div>
              ) : (
                <motion.div
                  key="mic"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  <Mic size={20} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
