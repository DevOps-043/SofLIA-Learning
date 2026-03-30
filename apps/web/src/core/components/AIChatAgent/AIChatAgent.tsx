'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  X,
  Send,
  Mic,
  MicOff,
  Loader2,
  User,
  ChevronUp,
  ChevronDown,
  Bug,
  Sparkles,
  Download,
  Target,
  MessageSquare,
  Brain,
  Trash2,
  CheckCircle2,
  Settings,
  MoreVertical,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import { ReporteProblema } from '../ReporteProblema/ReporteProblema';
import { PromptPreviewPanel, type PromptDraft } from './PromptPreviewPanel';
import { NanoBananaPreviewPanel } from './NanoBananaPreviewPanel';
import { SofLIAPersonalizationSettings } from '../../../features/lia/components/SofLIAPersonalizationSettings';
import { type AIChatAgentProps, MAX_CONTEXT_MESSAGES } from './types';
import { renderTextWithLinks } from './AIChatAgent.utils';
import { useAIChatAgentLogic } from './hooks/useAIChatAgentLogic';

export function AIChatAgent({
  assistantName = 'SofLIA',
  assistantAvatar = '/lia-avatar.png',
  initialMessage,
  promptPlaceholder,
  context = 'general',
}: AIChatAgentProps) {
  const router = useRouter();
  const { t: tCommon } = useTranslation('common');
  const { user } = useAuth();

  const {
    // Theme / layout
    isDark, theme, currentMode, bottomPosition, chatBottomPosition, promptBottomPosition,
    calculateMaxHeight,
    // Open / mode state
    isOpen, isPromptMode, isNanoBananaMode, useContextMode,
    setUseContextMode, setIsNanoBananaMode, setIsPromptMode,
    hasUnreadMessages, areButtonsExpanded, setAreButtonsExpanded,
    // Messages
    messages, normalMessages, promptMessages, nanoBananaMessages,
    // NanoBanana
    nanoBananaSchema, setNanoBananaSchema, nanoBananaJsonString, setNanoBananaJsonString,
    nanoBananaDomain, setNanoBananaDomain, nanoBananaFormat, setNanoBananaFormat,
    isNanoBananaPanelOpen, setIsNanoBananaPanelOpen,
    // Prompt
    generatedPrompt, setGeneratedPrompt, isPromptPanelOpen, setIsPromptPanelOpen,
    selectedPromptMessageId, setSelectedPromptMessageId, isSavingPrompt,
    // Input
    inputMessage, setInputMessage, isTyping, inputRef, messagesEndRef,
    adjustTextareaHeight, placeholderText,
    // Menus
    isPersonalizationOpen, setIsPersonalizationOpen,
    isOptionsMenuOpen, setIsOptionsMenuOpen, optionsMenuRef,
    modeMenuOpen, setModeMenuOpen, modeMenuRef,
    showClearConfirm, setShowClearConfirm,
    isReportOpen, setIsReportOpen,
    // Voice
    isRecording,
    // Drag
    containerRef, hasMoved, handleMouseDown, handleTouchStart,
    // Handlers
    handleToggle, handleClose, handleOpenPromptMode,
    handleClearConversation, executeClearConversation, clearContextMessages,
    handleDownloadPrompt, handleSavePrompt,
    handleSendMessage, handleKeyPress, handleToggleRecording,
    // Strings
    clearConversationLabel, changeModeLabel, clearContextLabel, clearContextConfirmLabel, reportProblemLabel,
    promptModeTitle, promptModeDesc, promptModeEmptyDesc,
    nanobanaDesc, nanobanaEmptyDesc,
    contextModeTitle, contextModeDesc, contextModeEmptyDesc,
    assistantModeTitle, assistantModeEmptyDesc,
  } = useAIChatAgentLogic({ assistantName, context, initialMessage, promptPlaceholder });

  return (
    <>
      {/* Botones flotantes */}
      {!isOpen && (
        <div
          className="fixed right-6 z-40 flex flex-col gap-2 items-end bottom-6 md:bottom-6"
          style={{
            bottom: bottomPosition,
          }}
        >
          <AnimatePresence>
            {/* Botones expandidos: Reportar Problema */}
            {areButtonsExpanded && (
              <motion.div
                key="expanded-buttons"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-2 overflow-hidden"
              >
                {/* Botón de reportar problema */}
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsReportOpen(true);
                    setAreButtonsExpanded(false);
                  }}
                  initial={{ scale: 0, opacity: 0, y: 10 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0, opacity: 0, y: 10 }}
                  transition={{ duration: 0.15 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-12 h-12 rounded-full bg-gradient-to-r from-red-500 to-orange-500 shadow-lg hover:shadow-red-500/50 transition-all cursor-pointer flex items-center justify-center group relative"
                  title={reportProblemLabel}
                >
                  <Bug className="w-6 h-6 text-white" />

                  {/* Tooltip */}
                  <div className="absolute right-full mr-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    Reportar problema
                    <div className="absolute top-1/2 -translate-y-1/2 right-[-6px] w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[6px] border-l-gray-900"></div>
                  </div>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Botón de expandir/colapsar */}
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              setAreButtonsExpanded(!areButtonsExpanded);
            }}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            className="cursor-pointer flex items-center justify-center group relative p-1"
            title={areButtonsExpanded ? "Ocultar opciones" : "Mostrar opciones"}
          >
            <motion.div
              animate={{ rotate: areButtonsExpanded ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronUp className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
            </motion.div>

            {/* Tooltip */}
            <div className="absolute right-full mr-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              {areButtonsExpanded ? "Ocultar opciones" : "Mostrar opciones"}
              <div className="absolute top-1/2 -translate-y-1/2 right-[-6px] w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[6px] border-l-gray-900"></div>
            </div>
          </motion.button>

          {/* Botón principal de LIA */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
          >
            <motion.button
              onClick={(e) => {
                handleToggle(e);
                setAreButtonsExpanded(false);
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="relative w-16 h-16 rounded-full bg-gradient-to-r from-[#00D4B3] via-[#00D4B3] to-[#00b89a] shadow-2xl hover:shadow-[#00D4B3]/50 transition-all cursor-pointer border-2 border-[#00D4B3]"
            >
              {/* Efecto de pulso */}
              <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-r from-[#00D4B3] via-[#00D4B3] to-[#00b89a]"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.7, 0, 0.7],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />

              <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-full">
                <img
                  src={assistantAvatar}
                  alt={assistantName}
                  className="w-full h-full object-cover"
                />
              </div>

              {hasUnreadMessages && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full"
                />
              )}
            </motion.button>
          </motion.div>
        </div>
      )}

      {/* Modal del prompt generado - Se sobrepone sobre el chat */}
      <AnimatePresence>
        {isPromptMode && generatedPrompt && isPromptPanelOpen && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="fixed right-6 z-[100000] w-96 max-w-[calc(100vw-3rem)]"
            style={{
              bottom: promptBottomPosition,
              height: calculateMaxHeight,
              maxHeight: calculateMaxHeight,
            }}
          >
            <div className="rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-[#0A2540]/30 flex flex-col bg-white dark:bg-[#1E2329] h-full">
              {/* Header del modal de prompt */}
              <motion.div
                className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 p-4 relative overflow-hidden flex-shrink-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {/* Efecto shimmer en el gradiente */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />

                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="relative p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Prompt Generado</h3>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsPromptPanelOpen(false);
                      setGeneratedPrompt(null);
                      setSelectedPromptMessageId(null);
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>

              {/* Contenido del prompt */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-[#0a0a0a] min-h-0 overscroll-contain" style={{
                scrollBehavior: 'smooth',
                WebkitOverflowScrolling: 'touch'
              }}>
                <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-gray-200 dark:border-slate-600/30">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Target className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span className="text-sm">{tCommon('aiChat.promptMode.titleLabel')}</span>
                    </h4>
                  </div>
                  <p className="text-gray-700 dark:text-slate-300 text-sm break-words">{generatedPrompt.title}</p>
                </div>

                <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-gray-200 dark:border-slate-600/30">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[#00D4B3] dark:text-[#00D4B3]" />
                    <span className="text-sm">{tCommon('aiChat.promptMode.contentLabel')}</span>
                  </h4>
                  <div className="text-gray-700 dark:text-slate-300 text-sm prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-xs sm:text-sm leading-relaxed break-words">{generatedPrompt.content}</pre>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {generatedPrompt.tags.slice(0, 3).map((tag, index) => (
                    <span key={index} className="px-3 py-1 bg-purple-500/20 text-purple-700 dark:text-purple-300 rounded-full text-xs">
                      {tag}
                    </span>
                  ))}
                </div>

                <motion.button
                  onClick={handleDownloadPrompt}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-[#0A2540] to-[#0A2540] hover:from-[#0d2f4d] hover:to-[#0d2f4d] text-white py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 text-sm"
                >
                  <Download className="w-4 h-4" />
                  {tCommon('aiChat.promptMode.download')}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Widget del chat */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="fixed right-6 z-[99999] w-96 max-w-[calc(100vw-3rem)]"
            style={{
              bottom: chatBottomPosition,
              height: calculateMaxHeight,
              maxHeight: calculateMaxHeight,
            }}
          >
            <div className={`rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-[#0A2540]/30 flex flex-col bg-white dark:bg-[#1E2329] h-full`}>
              {/* Header con gradiente - compacto */}
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
                      {/* Indicador de estado en línea */}
                      <motion.div
                        className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#00D4B3] rounded-full border border-white/70"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      />
                    </div>

                    {/* Botón clickeable para seleccionar modo */}
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
                            : currentMode === 'analysis'
                              ? 'text-white bg-white/25 border-white/40'
                              : 'text-white bg-white/25 border-white/40'
                          }`}>
                          {currentMode === 'nanobana' ? 'Generador de Imágenes' : currentMode === 'prompt' ? promptModeTitle : currentMode === 'analysis' ? contextModeTitle : assistantModeTitle}
                        </span>
                        <ChevronDown className={`w-3.5 h-3.5 text-white/70 transition-transform ${modeMenuOpen ? 'rotate-180' : ''}`} />
                      </div>
                    </button>

                    {/* Menú desplegable */}
                    <AnimatePresence>
                      {modeMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          className="absolute left-0 top-12 bg-white dark:bg-[#1E2329] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl shadow-xl overflow-hidden z-50 min-w-[280px]"
                        >
                          <div className="py-2">
                            {/* Header del modal con X */}
                            <div className="px-4 py-2 border-b border-[#E9ECEF] dark:border-[#6C757D]/30 flex items-center justify-between">
                              <div className="text-sm font-semibold text-[#0A2540] dark:text-white">SofLIA</div>
                              <button
                                onClick={() => setModeMenuOpen(false)}
                                className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-[#F8F9FA] dark:hover:bg-[#1E2329]/50 transition-colors text-[#6C757D] dark:text-white/60"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="py-1">
                              {/* NANOBANA */}
                              <button
                                className={`w-full text-left px-4 py-3 hover:bg-[#F8F9FA] dark:hover:bg-[#1E2329]/50 transition-colors ${currentMode === 'nanobana' ? 'bg-[#F8F9FA] dark:bg-[#1E2329]/30' : ''}`}
                                onClick={() => {
                                  setIsNanoBananaMode(true);
                                  setIsPromptMode(false);
                                  setUseContextMode(false);
                                  setModeMenuOpen(false);
                                }}
                              >
                                <div className="flex items-start gap-3">
                                  <div className="mt-0.5 w-2 h-2 rounded-full bg-amber-500"></div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <div className="text-sm font-medium text-[#0A2540] dark:text-white">
                                        Generador de Imágenes
                                      </div>
                                      <span className="text-[9px] px-1.5 py-0.5 bg-amber-500/20 text-amber-700 dark:text-amber-300 rounded-full font-medium">
                                        NEW
                                      </span>
                                      {currentMode === 'nanobana' && (
                                        <CheckCircle2 className="w-4 h-4 text-[#00D4B3] ml-auto" />
                                      )}
                                    </div>
                                    <div className="text-xs text-[#6C757D] dark:text-white/60">{nanobanaDesc}</div>
                                  </div>
                                </div>
                              </button>
                              {/* PROMPT */}
                              <button
                                className={`w-full text-left px-4 py-3 hover:bg-[#F8F9FA] dark:hover:bg-[#1E2329]/50 transition-colors ${currentMode === 'prompt' ? 'bg-[#F8F9FA] dark:bg-[#1E2329]/30' : ''}`}
                                onClick={() => {
                                  setIsPromptMode(true);
                                  setIsNanoBananaMode(false);
                                  setUseContextMode(false);
                                  setModeMenuOpen(false);
                                  if (promptMessages.length === 0) handleOpenPromptMode();
                                }}
                              >
                                <div className="flex items-start gap-3">
                                  <div className="mt-0.5 w-2 h-2 rounded-full bg-purple-500"></div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <div className="text-sm font-medium text-[#0A2540] dark:text-white">{promptModeTitle}</div>
                                      {currentMode === 'prompt' && (
                                        <CheckCircle2 className="w-4 h-4 text-[#00D4B3] ml-auto" />
                                      )}
                                    </div>
                                    <div className="text-xs text-[#6C757D] dark:text-white/60">{promptModeDesc}</div>
                                  </div>
                                </div>
                              </button>
                              {/* CONTEXTO PERSISTENTE */}
                              <button
                                className={`w-full text-left px-4 py-3 hover:bg-[#F8F9FA] dark:hover:bg-[#1E2329]/50 transition-colors ${currentMode === 'analysis' ? 'bg-[#F8F9FA] dark:bg-[#1E2329]/30' : ''}`}
                                onClick={() => {
                                  setUseContextMode(true);
                                  setIsPromptMode(false);
                                  setIsNanoBananaMode(false);
                                  setModeMenuOpen(false);
                                }}
                              >
                                <div className="flex items-start gap-3">
                                  <div className="mt-0.5 w-2 h-2 rounded-full bg-[#00D4B3]"></div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <div className="text-sm font-medium text-[#0A2540] dark:text-white">
                                        {contextModeTitle}
                                      </div>
                                      {normalMessages.length > 0 && useContextMode && (
                                        <span className="text-[10px] px-1.5 py-0.5 bg-[#00D4B3]/20 text-[#00D4B3] rounded-full font-medium">
                                          {normalMessages.length} msg
                                        </span>
                                      )}
                                      {currentMode === 'analysis' && (
                                        <CheckCircle2 className="w-4 h-4 text-[#00D4B3] ml-auto" />
                                      )}
                                    </div>
                                    <div className="text-xs text-[#6C757D] dark:text-white/60">
                                      {contextModeDesc}
                                    </div>
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
                    {/* Menú de opciones (3 puntos) */}
                    <div className="relative" ref={optionsMenuRef}>
                      <button
                        onClick={() => setIsOptionsMenuOpen(!isOptionsMenuOpen)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors text-white"
                        aria-label="Opciones"
                        title="Opciones"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {/* Menú desplegable */}
                      <AnimatePresence>
                        {isOptionsMenuOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.15, ease: 'easeOut' }}
                            className="absolute right-0 top-full mt-2 rounded-xl border overflow-hidden backdrop-blur-xl z-[100000] min-w-[200px]"
                            style={{
                              backgroundColor: isDark ? '#1E2329' : '#FFFFFF',
                              borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
                              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                            }}
                          >
                            <div className="py-2">
                              {/* Opción: Personalización */}
                              <button
                                onClick={() => {
                                  setIsPersonalizationOpen(true);
                                  setIsOptionsMenuOpen(false);
                                }}
                                className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 transition-all duration-150"
                                style={{
                                  backgroundColor: 'transparent',
                                  color: isDark ? '#FFFFFF' : '#0A2540',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                              >
                                <Settings className="w-4 h-4" style={{ color: isDark ? '#9CA3AF' : '#6C757D' }} />
                                <span>Personalización</span>
                              </button>

                              {/* Opción: Borrar chat */}
                              <button
                                onClick={() => {
                                  handleClearConversation();
                                  setIsOptionsMenuOpen(false);
                                }}
                                className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 transition-all duration-150"
                                style={{
                                  backgroundColor: 'transparent',
                                  color: isDark ? '#f87171' : '#ef4444',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>{clearConversationLabel}</span>
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Botón cerrar */}
                    <button
                      onClick={handleClose}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Contenedor principal del chat */}
              <div className="flex flex-col w-full h-full flex-1 min-h-0 overflow-hidden">

                {/* Mensajes */}
                <motion.div
                  className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-[#0a0a0a] min-h-0 overscroll-contain relative"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  style={{ scrollBehavior: 'smooth' }}
                >
                  {/* Indicador de contexto previo */}
                  {useContextMode && messages.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="sticky top-0 z-10 mb-2"
                    >
                      <div className="bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20 border border-[#00D4B3]/30 dark:border-[#00D4B3]/30 rounded-lg px-3 py-2 flex items-center justify-between gap-2 backdrop-blur-sm">
                        <div className="flex items-center gap-2 text-xs text-[#00D4B3] dark:text-[#00D4B3]">
                          <Brain className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="font-medium">
                            Contexto activo: {messages.length} mensaje{messages.length !== 1 ? 's' : ''} {messages.length > MAX_CONTEXT_MESSAGES ? `(mostrando últimos ${MAX_CONTEXT_MESSAGES})` : ''}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            if (window.confirm(clearContextConfirmLabel)) {
                              clearContextMessages();
                            }
                          }}
                          className="text-[#00D4B3] dark:text-[#00D4B3] hover:text-[#00b89a] dark:hover:text-[#00b89a] transition-colors"
                          title={clearContextLabel}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Fondo informativo del modelo */}
                  {messages.length === 0 && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center px-6">
                      <div className="max-w-sm text-center opacity-80">
                        <div className="mx-auto mb-3 w-16 h-16 rounded-full flex items-center justify-center shadow-lg overflow-hidden bg-transparent">
                          <img src="/Logo.png" onError={(e) => ((e.target as HTMLImageElement).src = assistantAvatar)} alt="SofLIA" className="w-full h-full object-contain" />
                        </div>
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-1 text-base">
                          SofLIA
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                          {currentMode === 'nanobana'
                            ? nanobanaDesc
                            : currentMode === 'prompt'
                              ? promptModeEmptyDesc
                              : currentMode === 'analysis'
                                ? contextModeEmptyDesc
                                : assistantModeEmptyDesc}
                        </p>
                      </div>
                    </div>
                  )}

                  {messages.map((message, index) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      {/* Avatar del mensaje */}
                      {message.role === 'user' ? (
                        <div className={`flex-shrink-0 w-9 h-9 rounded-full overflow-hidden border ${theme.borderUser} relative`}>
                          {user?.profile_picture_url ? (
                            <Image
                              src={user.profile_picture_url}
                              alt={user.display_name || user.username || 'Usuario'}
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-r from-[#0A2540] to-[#00D4B3] flex items-center justify-center">
                              <User className="w-6 h-6 text-white" />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className={`flex-shrink-0 w-9 h-9 rounded-full overflow-hidden border ${theme.borderUser} relative`}>
                          <Image
                            src={assistantAvatar}
                            alt={assistantName}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        </div>
                      )}

                      {/* Contenido del mensaje */}
                      <div className={`flex-1 rounded-2xl px-3.5 py-3 shadow-lg ${message.role === 'user'
                        ? 'bg-[#10B981] text-white'
                        : 'bg-[#0A2540] text-white dark:bg-[#0A2540]'
                        }`}>
                        <p className="text-[13px] leading-relaxed whitespace-pre-wrap font-medium">
                          {renderTextWithLinks(message.content, (url) => router.push(url))}
                        </p>

                        {/* Botón para reabrir prompt si el mensaje tiene un prompt generado */}
                        {message.role === 'assistant' && message.generatedPrompt && isPromptMode && (
                          <motion.button
                            onClick={() => {
                              setGeneratedPrompt(message.generatedPrompt!);
                              setIsPromptPanelOpen(true);
                              setSelectedPromptMessageId(message.id);
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg text-xs font-semibold transition-all duration-200"
                          >
                            <Sparkles className="w-3 h-3" />
                            {tCommon('aiChat.promptMode.viewGenerated')}
                          </motion.button>
                        )}

                        {/* Botón para reabrir NanoBanana JSON */}
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

                  {/* Indicador de escritura */}
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex gap-2 items-center"
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-purple-500 relative">
                        <Image
                          src={assistantAvatar}
                          alt={assistantName}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      </div>
                      <div className="bg-white dark:bg-[#1E2329] border border-gray-200 dark:border-[#0A2540]/30 rounded-2xl px-4 py-3">
                        <div className="flex gap-1">
                          <motion.div
                            className="w-2 h-2 bg-gray-400 dark:bg-gray-400 rounded-full"
                            animate={{ y: [0, -8, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                          />
                          <motion.div
                            className="w-2 h-2 bg-gray-400 dark:bg-gray-400 rounded-full"
                            animate={{ y: [0, -8, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                          />
                          <motion.div
                            className="w-2 h-2 bg-gray-400 dark:bg-gray-400 rounded-full"
                            animate={{ y: [0, -8, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </motion.div>

                {/* Input */}
                <motion.div
                  className="p-2 border-t border-gray-200 dark:border-[#0A2540]/30 bg-white dark:bg-[#1E2329] flex-shrink-0"
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
                      placeholder={useContextMode ? "Escribe tu pregunta..." : (promptPlaceholder ?? placeholderText)}
                      disabled={isTyping}
                      rows={1}
                      className={`flex-1 px-3 py-2 border ${useContextMode
                        ? 'bg-white/90 dark:bg-[#1E2329] border-[#00D4B3] dark:border-[#00D4B3] ring-2 ring-[#00D4B3]/30'
                        : `bg-white/90 dark:bg-[#1E2329] ${currentMode === 'prompt' ? 'border-purple-300 ring-2 ring-purple-300/30' : 'border-[#00D4B3] ring-2 ring-[#00D4B3]/30'}`
                        } rounded-lg focus:outline-none focus:ring-2 ${theme.ring} text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 font-medium shadow-inner transition-all resize-none`}
                      style={{ minHeight: '38px', lineHeight: '1.5' }}
                    />

                    {/* Botón dinámico: micrófono cuando está vacío, enviar cuando hay texto */}
                    <motion.button
                      onClick={() => {
                        if (inputMessage.trim()) {
                          handleSendMessage();
                        } else {
                          handleToggleRecording();
                        }
                      }}
                      disabled={isTyping && !!inputMessage.trim()}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300 ${inputMessage.trim()
                        ? useContextMode
                          ? 'bg-gradient-to-r from-[#00D4B3] to-[#00b89a] text-white hover:opacity-90 shadow-lg'
                          : `bg-gradient-to-r ${theme.bubbleUser} text-white hover:opacity-90 shadow-lg`
                        : isRecording
                          ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/50'
                          : `${currentMode === 'prompt' ? 'bg-purple-100 text-purple-600' : 'bg-[#00D4B3]/20 text-[#00D4B3]'} hover:opacity-90`
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
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Reporte de Problema */}
      <ReporteProblema
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        fromLia={true}
      />

      {/* Modal de Confirmación de Limpieza */}
      <AnimatePresence>
        {showClearConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setShowClearConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden border border-gray-200 dark:border-white/10"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-[#0A2540] to-[#00D4B3] p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Trash2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Limpiar Contexto</h3>
                    <p className="text-white/80 text-sm">PRL-1.0 Mini activo</p>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-6">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  Tienes <span className="font-semibold text-[#00D4B3] dark:text-[#00D4B3]">{normalMessages.length} mensajes</span> guardados en el contexto persistente.
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-3">
                  ¿Deseas borrar toda la conversación y el contexto guardado?
                </p>
              </div>

              {/* Footer */}
              <div className="flex gap-3 p-6 pt-0">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 px-4 py-3 rounded-xl font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={executeClearConversation}
                  className="flex-1 px-4 py-3 rounded-xl font-medium text-white bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 transition-all shadow-lg shadow-red-500/25"
                >
                  Borrar Todo
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Prompt Preview Panel */}
      <AnimatePresence>
        {isPromptMode && generatedPrompt && isPromptPanelOpen && (
          <PromptPreviewPanel
            draft={generatedPrompt as PromptDraft}
            onSave={handleSavePrompt}
            onClose={() => setIsPromptPanelOpen(false)}
            onEdit={(editedDraft) => {
              setGeneratedPrompt(editedDraft as any);
            }}
            isSaving={isSavingPrompt}
          />
        )}
      </AnimatePresence>

      {/* NanoBanana Preview Panel */}
      {nanoBananaSchema && isNanoBananaPanelOpen && (
        <div
          className="fixed right-4 top-20 z-[100001]"
          style={{
            width: 'min(400px, calc(100vw - 2rem))',
            maxHeight: 'calc(100vh - 6rem)'
          }}
        >
          <NanoBananaPreviewPanel
            schema={nanoBananaSchema}
            jsonString={nanoBananaJsonString}
            domain={nanoBananaDomain}
            outputFormat={nanoBananaFormat}
            isOpen={isNanoBananaPanelOpen}
            onClose={() => setIsNanoBananaPanelOpen(false)}
            onCopy={() => {}}
            onDownload={() => {}}
            onRegenerate={() => {
              const lastUserMessage = nanoBananaMessages.filter(m => m.role === 'user').pop();
              if (lastUserMessage) {
                setInputMessage(lastUserMessage.content);
              }
            }}
          />
        </div>
      )}

      {/* Modal de Personalización */}
      <SofLIAPersonalizationSettings
        isOpen={isPersonalizationOpen}
        onClose={() => setIsPersonalizationOpen(false)}
      />
    </>
  );
}
