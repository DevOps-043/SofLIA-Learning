'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Download, Target, MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import { ReporteProblema } from '../ReporteProblema/ReporteProblema';
import { PromptPreviewPanel, type PromptDraft } from './PromptPreviewPanel';
import { NanoBananaPreviewPanel } from './NanoBananaPreviewPanel';
import { SofLIAPersonalizationSettings } from '../../../features/lia/components/SofLIAPersonalizationSettings';
import { type AIChatAgentProps } from './types';
import { useAIChatAgentLogic } from './hooks/useAIChatAgentLogic';
import { ChatFloatingButton } from './ChatFloatingButton';
import { ChatHeader } from './ChatHeader';
import { ChatMessagesPanel } from './ChatMessagesPanel';
import { ChatInputArea } from './ChatInputArea';
import { ClearConfirmModal } from './ClearConfirmModal';

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
    isDark, theme, currentMode, bottomPosition, chatBottomPosition, promptBottomPosition,
    calculateMaxHeight,
    isOpen, isPromptMode, isNanoBananaMode, useContextMode,
    setUseContextMode, setIsNanoBananaMode, setIsPromptMode,
    hasUnreadMessages, areButtonsExpanded, setAreButtonsExpanded,
    messages, normalMessages, promptMessages, nanoBananaMessages,
    nanoBananaSchema, setNanoBananaSchema, nanoBananaJsonString, setNanoBananaJsonString,
    nanoBananaDomain, setNanoBananaDomain, nanoBananaFormat, setNanoBananaFormat,
    isNanoBananaPanelOpen, setIsNanoBananaPanelOpen,
    generatedPrompt, setGeneratedPrompt, isPromptPanelOpen, setIsPromptPanelOpen,
    selectedPromptMessageId, setSelectedPromptMessageId, isSavingPrompt,
    inputMessage, setInputMessage, isTyping, inputRef, messagesEndRef,
    adjustTextareaHeight, placeholderText,
    isPersonalizationOpen, setIsPersonalizationOpen,
    isOptionsMenuOpen, setIsOptionsMenuOpen, optionsMenuRef,
    modeMenuOpen, setModeMenuOpen, modeMenuRef,
    showClearConfirm, setShowClearConfirm,
    isReportOpen, setIsReportOpen,
    isRecording,
    containerRef, hasMoved, handleMouseDown, handleTouchStart,
    handleToggle, handleClose, handleOpenPromptMode,
    handleClearConversation, executeClearConversation, clearContextMessages,
    handleDownloadPrompt, handleSavePrompt,
    handleSendMessage, handleKeyPress, handleToggleRecording,
    clearConversationLabel, changeModeLabel, clearContextLabel, clearContextConfirmLabel, reportProblemLabel,
    promptModeTitle, promptModeDesc, promptModeEmptyDesc,
    nanobanaDesc, nanobanaEmptyDesc,
    contextModeTitle, contextModeDesc, contextModeEmptyDesc,
    assistantModeTitle, assistantModeEmptyDesc,
  } = useAIChatAgentLogic({ assistantName, context, initialMessage, promptPlaceholder });

  return (
    <>
      {/* Floating buttons (closed state) */}
      {!isOpen && (
        <ChatFloatingButton
          bottomPosition={bottomPosition}
          assistantAvatar={assistantAvatar}
          assistantName={assistantName}
          hasUnreadMessages={hasUnreadMessages}
          areButtonsExpanded={areButtonsExpanded}
          setAreButtonsExpanded={setAreButtonsExpanded}
          setIsReportOpen={setIsReportOpen}
          reportProblemLabel={reportProblemLabel}
          handleToggle={handleToggle}
        />
      )}

      {/* Inline prompt preview panel */}
      <AnimatePresence>
        {isPromptMode && generatedPrompt && isPromptPanelOpen && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="fixed right-6 z-[100000] w-96 max-w-[calc(100vw-3rem)]"
            style={{ bottom: promptBottomPosition, height: calculateMaxHeight, maxHeight: calculateMaxHeight }}
          >
            <div className="rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-[#0A2540]/30 flex flex-col bg-white dark:bg-[#1E2329] h-full">
              <motion.div
                className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 p-4 relative overflow-hidden flex-shrink-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                />
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="relative p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Prompt Generado</h3>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setIsPromptPanelOpen(false); setGeneratedPrompt(null); setSelectedPromptMessageId(null) }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-[#0a0a0a] min-h-0 overscroll-contain" style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}>
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
                    <MessageSquare className="w-4 h-4 text-[#00D4B3]" />
                    <span className="text-sm">{tCommon('aiChat.promptMode.contentLabel')}</span>
                  </h4>
                  <div className="text-gray-700 dark:text-slate-300 text-sm prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-xs sm:text-sm leading-relaxed break-words">{generatedPrompt.content}</pre>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {generatedPrompt.tags.slice(0, 3).map((tag: string, index: number) => (
                    <span key={index} className="px-3 py-1 bg-purple-500/20 text-purple-700 dark:text-purple-300 rounded-full text-xs">{tag}</span>
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

      {/* Chat widget */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="fixed right-6 z-[99999] w-96 max-w-[calc(100vw-3rem)]"
            style={{ bottom: chatBottomPosition, height: calculateMaxHeight, maxHeight: calculateMaxHeight }}
          >
            <div className="rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-[#0A2540]/30 flex flex-col bg-white dark:bg-[#1E2329] h-full">
              <ChatHeader
                assistantName={assistantName}
                assistantAvatar={assistantAvatar}
                theme={theme}
                modeMenuRef={modeMenuRef}
                optionsMenuRef={optionsMenuRef}
                currentMode={currentMode}
                modeMenuOpen={modeMenuOpen}
                setModeMenuOpen={setModeMenuOpen}
                isOptionsMenuOpen={isOptionsMenuOpen}
                setIsOptionsMenuOpen={setIsOptionsMenuOpen}
                isDark={isDark}
                promptModeTitle={promptModeTitle}
                contextModeTitle={contextModeTitle}
                assistantModeTitle={assistantModeTitle}
                nanobanaDesc={nanobanaDesc}
                promptModeDesc={promptModeDesc}
                contextModeDesc={contextModeDesc}
                normalMessages={normalMessages}
                useContextMode={useContextMode}
                clearConversationLabel={clearConversationLabel}
                setIsNanoBananaMode={setIsNanoBananaMode}
                setIsPromptMode={setIsPromptMode}
                setUseContextMode={setUseContextMode}
                promptMessages={promptMessages}
                handleOpenPromptMode={handleOpenPromptMode}
                setIsPersonalizationOpen={setIsPersonalizationOpen}
                handleClearConversation={handleClearConversation}
                handleClose={handleClose}
              />

              <div className="flex flex-col w-full h-full flex-1 min-h-0 overflow-hidden">
                <ChatMessagesPanel
                  messages={messages}
                  isTyping={isTyping}
                  useContextMode={useContextMode}
                  currentMode={currentMode}
                  assistantAvatar={assistantAvatar}
                  assistantName={assistantName}
                  isPromptMode={isPromptMode}
                  theme={theme}
                  messagesEndRef={messagesEndRef}
                  user={user}
                  nanobanaDesc={nanobanaDesc}
                  promptModeEmptyDesc={promptModeEmptyDesc}
                  contextModeEmptyDesc={contextModeEmptyDesc}
                  assistantModeEmptyDesc={assistantModeEmptyDesc}
                  clearContextLabel={clearContextLabel}
                  clearContextConfirmLabel={clearContextConfirmLabel}
                  clearContextMessages={clearContextMessages}
                  setGeneratedPrompt={setGeneratedPrompt}
                  setIsPromptPanelOpen={setIsPromptPanelOpen}
                  setSelectedPromptMessageId={setSelectedPromptMessageId}
                  setNanoBananaSchema={setNanoBananaSchema}
                  setNanoBananaJsonString={setNanoBananaJsonString}
                  setNanoBananaDomain={setNanoBananaDomain}
                  setNanoBananaFormat={setNanoBananaFormat}
                  setIsNanoBananaPanelOpen={setIsNanoBananaPanelOpen}
                  onNavigate={(url) => router.push(url)}
                />

                <ChatInputArea
                  inputMessage={inputMessage}
                  setInputMessage={setInputMessage}
                  isTyping={isTyping}
                  isRecording={isRecording}
                  useContextMode={useContextMode}
                  currentMode={currentMode}
                  promptPlaceholder={promptPlaceholder}
                  placeholderText={placeholderText}
                  inputRef={inputRef}
                  theme={theme}
                  adjustTextareaHeight={adjustTextareaHeight}
                  handleSendMessage={handleSendMessage}
                  handleKeyPress={handleKeyPress}
                  handleToggleRecording={handleToggleRecording}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <ReporteProblema isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} fromLia={true} />

      <ClearConfirmModal
        show={showClearConfirm}
        normalMessagesCount={normalMessages.length}
        onCancel={() => setShowClearConfirm(false)}
        onConfirm={executeClearConversation}
      />

      <AnimatePresence>
        {isPromptMode && generatedPrompt && isPromptPanelOpen && (
          <PromptPreviewPanel
            draft={generatedPrompt as PromptDraft}
            onSave={handleSavePrompt}
            onClose={() => setIsPromptPanelOpen(false)}
            onEdit={(editedDraft) => { setGeneratedPrompt(editedDraft as any) }}
            isSaving={isSavingPrompt}
          />
        )}
      </AnimatePresence>

      {nanoBananaSchema && isNanoBananaPanelOpen && (
        <div className="fixed right-4 top-20 z-[100001]" style={{ width: 'min(400px, calc(100vw - 2rem))', maxHeight: 'calc(100vh - 6rem)' }}>
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
              const lastUserMessage = nanoBananaMessages.filter((m: { role: string }) => m.role === 'user').pop();
              if (lastUserMessage) setInputMessage((lastUserMessage as { content: string }).content);
            }}
          />
        </div>
      )}

      <SofLIAPersonalizationSettings isOpen={isPersonalizationOpen} onClose={() => setIsPersonalizationOpen(false)} />
    </>
  );
}
