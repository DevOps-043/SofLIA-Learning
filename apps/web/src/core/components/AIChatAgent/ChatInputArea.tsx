'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Send, Mic, MicOff, Loader2 } from 'lucide-react';

interface ChatInputAreaProps {
  inputMessage: string
  setInputMessage: (v: string) => void
  isTyping: boolean
  isRecording: boolean
  useContextMode: boolean
  currentMode: string
  promptPlaceholder?: string
  placeholderText: string
  inputRef: React.RefObject<HTMLTextAreaElement>
  theme: { ring: string; bubbleUser: string }
  adjustTextareaHeight: () => void
  handleSendMessage: () => void
  handleKeyPress: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  handleToggleRecording: () => void
}

export function ChatInputArea({
  inputMessage, setInputMessage, isTyping, isRecording,
  useContextMode, currentMode, promptPlaceholder, placeholderText,
  inputRef, theme, adjustTextareaHeight,
  handleSendMessage, handleKeyPress, handleToggleRecording,
}: ChatInputAreaProps) {
  return (
    <motion.div
      className="p-2 border-t border-gray-200 dark:border-primary/30 bg-white dark:bg-carbon-800 flex-shrink-0"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="flex items-center gap-2">
        <textarea
          ref={inputRef}
          value={inputMessage}
          onChange={(e) => {
            setInputMessage(e.target.value);
            setTimeout(() => adjustTextareaHeight(), 0);
          }}
          onKeyDown={handleKeyPress}
          placeholder={useContextMode ? 'Escribe tu pregunta...' : (promptPlaceholder ?? placeholderText)}
          disabled={isTyping}
          rows={1}
          className={`flex-1 px-3 py-2 border ${useContextMode
            ? 'bg-white/90 dark:bg-carbon-800 border-accent dark:border-accent ring-2 ring-accent/30'
            : `bg-white/90 dark:bg-carbon-800 ${currentMode === 'prompt' ? 'border-purple-300 ring-2 ring-purple-300/30' : 'border-accent ring-2 ring-accent/30'}`
          } rounded-lg focus:outline-none focus:ring-2 ${theme.ring} text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 font-medium shadow-inner transition-all resize-none`}
          style={{ minHeight: '38px', lineHeight: '1.5' }}
        />

        <motion.button
          onClick={() => {
            if (inputMessage.trim()) handleSendMessage();
            else handleToggleRecording();
          }}
          disabled={isTyping && !!inputMessage.trim()}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300 ${inputMessage.trim()
            ? useContextMode
              ? 'bg-gradient-to-r from-accent to-accent text-white hover:opacity-90 shadow-lg'
              : `bg-gradient-to-r ${theme.bubbleUser} text-white hover:opacity-90 shadow-lg`
            : isRecording
              ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/50'
              : `${currentMode === 'prompt' ? 'bg-purple-100 text-purple-600' : 'bg-accent/20 text-accent'} hover:opacity-90`
          } ${isTyping && !!inputMessage.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isTyping && inputMessage.trim() ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : inputMessage.trim() ? (
            <Send className="w-4 h-4" />
          ) : isRecording ? (
            <MicOff className="w-4 h-4" />
          ) : (
            <Mic className="w-4 h-4" />
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}
