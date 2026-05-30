'use client';

import { ChatSuggestionsChips } from './chat-suggestions';
import { CourseLiaHeader } from './components/CourseLiaHeader';
import { CourseLiaInput } from './components/CourseLiaInput';
import { CourseLiaMessages } from './components/CourseLiaMessages';
import { CourseLiaPanelShell } from './components/CourseLiaPanelShell';
import { CourseLiaStyleTag } from './components/CourseLiaStyleTag';
import { useCourseLiaController } from './hooks/useCourseLiaController';
import type { CourseLiaProps } from './types';

export function CourseLiaPanelContent(props: CourseLiaProps) {
  const controller = useCourseLiaController(props);
  const isPanelOpen = controller.isOpen && (!controller.isInteractionBlocked || controller.currentActivity !== null);

  return (
    <CourseLiaPanelShell
      isMobile={controller.isMobile}
      isOpen={isPanelOpen}
      panelRef={controller.panelRef}
      themeColors={controller.themeColors}
    >
      <CourseLiaHeader
        isLightTheme={controller.isLightTheme}
        onClearHistory={controller.clearHistory}
        onClose={controller.closeLia}
        themeColors={controller.themeColors}
        isMobile={controller.isMobile}
      />
      <CourseLiaMessages
        copiedMessageId={controller.copiedMessageId}
        editInputRef={controller.editInputRef}
        editingMessageId={controller.editingMessageId}
        editingValue={controller.editingValue}
        forceDarkText={controller.forceDarkText}
        isDarkMode={controller.isDarkMode}
        isLightTheme={controller.isLightTheme}
        isLoading={controller.isLoading}
        messages={controller.messages}
        messagesEndRef={controller.messagesEndRef}
        onCancelEditing={controller.handleCancelEditingMessage}
        onCopyMessage={controller.handleCopyMessage}
        onEditKeyDown={controller.handleEditKeyDown}
        onLinkClick={controller.handleLinkClick}
        onSaveNote={controller.onSaveNote}
        onStartEditing={controller.handleStartEditingMessage}
        onSubmitEditedMessage={controller.handleSubmitEditedMessage}
        setEditingValue={controller.setEditingValue}
        stop={controller.stop}
        themeColors={controller.themeColors}
      />
      <ChatSuggestionsChips
        suggestions={controller.lessonSuggestions}
        isLoading={controller.isLoadingSuggestions}
        isLightTheme={controller.isLightTheme || controller.forceDarkText}
        theme={{
          accentColor: controller.themeColors.accentColor,
          borderColor: controller.themeColors.borderColor,
          inputBg: controller.themeColors.inputBg,
          textPrimary: controller.themeColors.textPrimary,
          textSecondary: controller.themeColors.textSecondary,
        }}
        onSuggestionClick={controller.handleSuggestionClick}
        forceCollapse={controller.currentActivity?.timestamp || false}
      />
      <CourseLiaInput
        inputRef={controller.inputRef}
        inputValue={controller.inputValue}
        isInteractionBlocked={controller.isInteractionBlocked && controller.currentActivity === null}
        isLightTheme={controller.isLightTheme}
        isListening={controller.isListening}
        isMobile={controller.isMobile}
        onInputChange={controller.setInputValue}
        onKeyDown={controller.handleKeyDown}
        onPrimaryAction={controller.handlePrimaryAction}
        primaryActionLabel={controller.primaryActionLabel}
        primaryActionMode={controller.primaryActionMode}
        setVoiceError={controller.setVoiceError}
        themeColors={controller.themeColors}
        voiceError={controller.voiceError}
      />
      <CourseLiaStyleTag
        forceDarkText={controller.forceDarkText}
        isLightTheme={controller.isLightTheme}
        themeColors={controller.themeColors}
      />
    </CourseLiaPanelShell>
  );
}
