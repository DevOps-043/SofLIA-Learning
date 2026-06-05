'use client';

import React from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ChevronDown, CheckCircle2, Settings, Trash2, MoreVertical,
} from 'lucide-react';

interface ChatHeaderProps {
  assistantName: string
  assistantAvatar: string
  theme: { header: string }
  modeMenuRef: React.RefObject<HTMLDivElement>
  optionsMenuRef: React.RefObject<HTMLDivElement>
  currentMode: string
  modeMenuOpen: boolean
  setModeMenuOpen: (v: boolean) => void
  isOptionsMenuOpen: boolean
  setIsOptionsMenuOpen: (v: boolean) => void
  isDark: boolean
  promptModeTitle: string
  contextModeTitle: string
  assistantModeTitle: string
  nanobanaDesc: string
  promptModeDesc: string
  contextModeDesc: string
  normalMessages: unknown[]
  useContextMode: boolean
  clearConversationLabel: string
  setIsNanoBananaMode: (v: boolean) => void
  setIsPromptMode: (v: boolean) => void
  setUseContextMode: (v: boolean) => void
  promptMessages: unknown[]
  handleOpenPromptMode: () => void
  setIsPersonalizationOpen: (v: boolean) => void
  handleClearConversation: () => void
  handleClose: () => void
}

export function ChatHeader({
  assistantName, assistantAvatar, theme,
  modeMenuRef, optionsMenuRef,
  currentMode, modeMenuOpen, setModeMenuOpen,
  isOptionsMenuOpen, setIsOptionsMenuOpen, isDark,
  promptModeTitle, contextModeTitle, assistantModeTitle,
  nanobanaDesc, promptModeDesc, contextModeDesc,
  normalMessages, useContextMode,
  clearConversationLabel,
  setIsNanoBananaMode, setIsPromptMode, setUseContextMode,
  promptMessages, handleOpenPromptMode,
  setIsPersonalizationOpen,
  handleClearConversation,
  handleClose,
}: ChatHeaderProps) {
  return (
    <motion.div
      className={`${theme.header} px-2 py-2 relative flex-shrink-0`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-0" ref={modeMenuRef}>
          {/* Avatar */}
          <div className="relative w-8 h-8">
            <Image
              src={assistantAvatar}
              alt={assistantName}
              fill
              className="rounded-full object-cover border border-white/60"
              sizes="32px"
            />
            <motion.div
              className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-accent rounded-full border border-white/70"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>

          {/* Mode selector button */}
          <button
            onClick={() => setModeMenuOpen(!modeMenuOpen)}
            className="flex items-center gap-2 leading-none min-w-0 hover:opacity-80 transition-opacity group"
          >
            <div className="flex items-center gap-2">
              <h3 className="text-white font-semibold text-sm">{assistantName}</h3>
              <span className={`text-[11px] px-2 py-1 rounded-full border truncate max-w-[140px] font-medium ${currentMode === 'nanobana'
                ? 'text-amber-100 bg-amber-500/40 border-amber-400/60'
                : currentMode === 'prompt'
                  ? 'text-purple-100 bg-purple-500/40 border-purple-400/60'
                  : 'text-white bg-white/25 border-white/40'
              }`}>
                {currentMode === 'nanobana' ? 'Generador de Imágenes' : currentMode === 'prompt' ? promptModeTitle : currentMode === 'analysis' ? contextModeTitle : assistantModeTitle}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-white/70 transition-transform ${modeMenuOpen ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {/* Mode dropdown */}
          <AnimatePresence>
            {modeMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute left-0 top-12 z-50 max-h-[calc(var(--soflia-viewport-height)-7rem)] min-w-[min(280px,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-500/30 dark:bg-carbon-800"
              >
                <div className="py-2">
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-500/30 flex items-center justify-between">
                    <div className="text-sm font-semibold text-primary dark:text-white">SofLIA</div>
                    <button
                      onClick={() => setModeMenuOpen(false)}
                      className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-gray-50 dark:hover:bg-carbon-800/50 transition-colors text-gray-500 dark:text-white/60"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="py-1">
                    {/* NANOBANA */}
                    <button
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-carbon-800/50 transition-colors ${currentMode === 'nanobana' ? 'bg-gray-50 dark:bg-carbon-800/30' : ''}`}
                      onClick={() => { setIsNanoBananaMode(true); setIsPromptMode(false); setUseContextMode(false); setModeMenuOpen(false) }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 w-2 h-2 rounded-full bg-amber-500" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="text-sm font-medium text-primary dark:text-white">Generador de Imágenes</div>
                            <span className="text-[9px] px-1.5 py-0.5 bg-amber-500/20 text-amber-700 dark:text-amber-300 rounded-full font-medium">NEW</span>
                            {currentMode === 'nanobana' && <CheckCircle2 className="w-4 h-4 text-accent ml-auto" />}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-white/60">{nanobanaDesc}</div>
                        </div>
                      </div>
                    </button>

                    {/* PROMPT */}
                    <button
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-carbon-800/50 transition-colors ${currentMode === 'prompt' ? 'bg-gray-50 dark:bg-carbon-800/30' : ''}`}
                      onClick={() => { setIsPromptMode(true); setIsNanoBananaMode(false); setUseContextMode(false); setModeMenuOpen(false); if (promptMessages.length === 0) handleOpenPromptMode() }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 w-2 h-2 rounded-full bg-purple-500" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="text-sm font-medium text-primary dark:text-white">{promptModeTitle}</div>
                            {currentMode === 'prompt' && <CheckCircle2 className="w-4 h-4 text-accent ml-auto" />}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-white/60">{promptModeDesc}</div>
                        </div>
                      </div>
                    </button>

                    {/* CONTEXT MODE */}
                    <button
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-carbon-800/50 transition-colors ${currentMode === 'analysis' ? 'bg-gray-50 dark:bg-carbon-800/30' : ''}`}
                      onClick={() => { setUseContextMode(true); setIsPromptMode(false); setIsNanoBananaMode(false); setModeMenuOpen(false) }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 w-2 h-2 rounded-full bg-accent" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="text-sm font-medium text-primary dark:text-white">{contextModeTitle}</div>
                            {normalMessages.length > 0 && useContextMode && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-accent/20 text-accent rounded-full font-medium">
                                {normalMessages.length} msg
                              </span>
                            )}
                            {currentMode === 'analysis' && <CheckCircle2 className="w-4 h-4 text-accent ml-auto" />}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-white/60">{contextModeDesc}</div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-1">
          {/* Options menu */}
          <div className="relative" ref={optionsMenuRef}>
            <button
              onClick={() => setIsOptionsMenuOpen(!isOptionsMenuOpen)}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors text-white"
              aria-label="Opciones"
              title="Opciones"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            <AnimatePresence>
              {isOptionsMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="absolute right-0 top-full z-[100000] mt-2 max-h-[calc(var(--soflia-viewport-height)-7rem)] min-w-[min(200px,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] overflow-y-auto rounded-xl border backdrop-blur-xl"
                  style={{
                    backgroundColor: isDark ? 'var(--color-gray-800)' : 'var(--color-bg-light)',
                    borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                  }}
                >
                  <div className="py-2">
                    <button
                      onClick={() => { setIsPersonalizationOpen(true); setIsOptionsMenuOpen(false) }}
                      className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 transition-all duration-150"
                      style={{ backgroundColor: 'transparent', color: isDark ? 'var(--color-bg-light)' : 'var(--color-primary)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                    >
                      <Settings className="w-4 h-4" style={{ color: isDark ? 'var(--color-legacy-9ca3af)' : 'var(--color-gray-500)' }} />
                      <span>Personalización</span>
                    </button>

                    <button
                      onClick={() => { handleClearConversation(); setIsOptionsMenuOpen(false) }}
                      className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 transition-all duration-150"
                      style={{ backgroundColor: 'transparent', color: isDark ? 'var(--color-legacy-f87171)' : 'var(--color-error)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>{clearConversationLabel}</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Close button */}
          <button
            onClick={handleClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
