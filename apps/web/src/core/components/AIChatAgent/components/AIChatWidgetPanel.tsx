'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChatHeader } from '../ChatHeader';
import { ChatInputArea } from '../ChatInputArea';
import { ChatMessagesPanel } from '../ChatMessagesPanel';
import type { AIChatAgentLogic, ChatPanelUser } from './ai-chat-agent-view.types';

interface AIChatWidgetPanelProps {
  assistantAvatar: string;
  assistantName: string;
  logic: AIChatAgentLogic;
  onNavigate: (url: string) => void;
  promptPlaceholder?: string;
  user: ChatPanelUser | null;
}

export function AIChatWidgetPanel({
  assistantAvatar,
  assistantName,
  logic,
  onNavigate,
  promptPlaceholder,
  user,
}: AIChatWidgetPanelProps) {
  return (
    <AnimatePresence>
      {logic.isOpen ? (
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="fixed right-6 z-[99999] w-96 max-w-[calc(100vw-3rem)]"
          style={{ bottom: logic.chatBottomPosition, height: logic.calculateMaxHeight, maxHeight: logic.calculateMaxHeight }}
        >
          <div className="rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-[#0A2540]/30 flex flex-col bg-white dark:bg-[#1E2329] h-full">
            <ChatHeader
              assistantName={assistantName} assistantAvatar={assistantAvatar} theme={logic.theme}
              modeMenuRef={logic.modeMenuRef} optionsMenuRef={logic.optionsMenuRef}
              currentMode={logic.currentMode} modeMenuOpen={logic.modeMenuOpen}
              setModeMenuOpen={logic.setModeMenuOpen} isOptionsMenuOpen={logic.isOptionsMenuOpen}
              setIsOptionsMenuOpen={logic.setIsOptionsMenuOpen} isDark={logic.isDark}
              promptModeTitle={logic.promptModeTitle} contextModeTitle={logic.contextModeTitle}
              assistantModeTitle={logic.assistantModeTitle} nanobanaDesc={logic.nanobanaDesc}
              promptModeDesc={logic.promptModeDesc} contextModeDesc={logic.contextModeDesc}
              normalMessages={logic.normalMessages} useContextMode={logic.useContextMode}
              clearConversationLabel={logic.clearConversationLabel}
              setIsNanoBananaMode={logic.setIsNanoBananaMode} setIsPromptMode={logic.setIsPromptMode}
              setUseContextMode={logic.setUseContextMode} promptMessages={logic.promptMessages}
              handleOpenPromptMode={logic.handleOpenPromptMode}
              setIsPersonalizationOpen={logic.setIsPersonalizationOpen}
              handleClearConversation={logic.handleClearConversation} handleClose={logic.handleClose}
            />
            <div className="flex flex-col w-full h-full flex-1 min-h-0 overflow-hidden">
              <ChatMessagesPanel
                messages={logic.messages} isTyping={logic.isTyping}
                useContextMode={logic.useContextMode} currentMode={logic.currentMode}
                assistantAvatar={assistantAvatar} assistantName={assistantName}
                isPromptMode={logic.isPromptMode} theme={logic.theme}
                messagesEndRef={logic.messagesEndRef} user={user}
                nanobanaDesc={logic.nanobanaDesc} promptModeEmptyDesc={logic.promptModeEmptyDesc}
                contextModeEmptyDesc={logic.contextModeEmptyDesc} assistantModeEmptyDesc={logic.assistantModeEmptyDesc}
                clearContextLabel={logic.clearContextLabel} clearContextConfirmLabel={logic.clearContextConfirmLabel}
                clearContextMessages={logic.clearContextMessages}
                setGeneratedPrompt={logic.setGeneratedPrompt} setIsPromptPanelOpen={logic.setIsPromptPanelOpen}
                setSelectedPromptMessageId={logic.setSelectedPromptMessageId}
                setNanoBananaSchema={logic.setNanoBananaSchema} setNanoBananaJsonString={logic.setNanoBananaJsonString}
                setNanoBananaDomain={logic.setNanoBananaDomain} setNanoBananaFormat={logic.setNanoBananaFormat}
                setIsNanoBananaPanelOpen={logic.setIsNanoBananaPanelOpen} onNavigate={onNavigate}
              />
              {logic.voiceError ? <p className="mx-4 mb-1 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">{logic.voiceError}</p> : null}
              <ChatInputArea
                inputMessage={logic.inputMessage} setInputMessage={logic.setInputMessage}
                isTyping={logic.isTyping} isRecording={logic.isRecording}
                useContextMode={logic.useContextMode} currentMode={logic.currentMode}
                promptPlaceholder={promptPlaceholder} placeholderText={logic.placeholderText}
                inputRef={logic.inputRef} theme={logic.theme}
                adjustTextareaHeight={logic.adjustTextareaHeight}
                handleSendMessage={logic.handleSendMessage} handleKeyPress={logic.handleKeyPress}
                handleToggleRecording={logic.handleToggleRecording}
              />
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
