'use client';

import { useEffect, useRef, useState } from 'react';

import { useLiaCourseChat } from '../../../../core/hooks/useLiaCourseChat';
import { useThemeStore } from '../../../../core/stores/themeStore';
import { useLiaCourse } from '../../context/LiaCourseContext';
import type { CourseLiaProps } from './CourseLia.types';
import { CourseLiaInputBar } from './CourseLiaInputBar';
import { CourseLiaMessages } from './CourseLiaMessages';
import { CourseLiaPanelFrame } from './CourseLiaPanelFrame';
import { CourseLiaPanelHeader } from './CourseLiaPanelHeader';
import { CourseLiaPanelStyles } from './CourseLiaPanelStyles';
import { useCourseLiaActions } from './useCourseLiaActions';
import { useCourseLiaAttachments } from './useCourseLiaAttachments';
import { useCourseLiaClipboard } from './useCourseLiaClipboard';
import { useCourseLiaContrast } from './useCourseLiaContrast';
import { useCourseLiaLinkNavigation } from './useCourseLiaLinkNavigation';
import { useCourseLiaMobile } from './useCourseLiaMobile';
import { useCourseLiaRegistration } from './useCourseLiaRegistration';
import { useCourseLiaResolvedContext } from './useCourseLiaResolvedContext';
import { useCourseLiaTheme } from './useCourseLiaTheme';

export function CourseLiaPanelContent(props: CourseLiaProps) {
  const { closeLia, currentActivity, isOpen, registerLiaChat, setCourseContext } = useLiaCourse();
  const { resolvedTheme } = useThemeStore();
  const isDarkMode = resolvedTheme === 'dark';
  const isLightTheme = !isDarkMode;
  const resolvedLessonContext = useCourseLiaResolvedContext(props);
  const isMobile = useCourseLiaMobile();
  const themeColors = useCourseLiaTheme(props.customColors, isLightTheme);
  const liaChat = useLiaCourseChat(null);
  const { clearHistory, isLoading, messages, sendMessage, stop } = liaChat;
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const attachments = useCourseLiaAttachments(isOpen);
  const { copiedMessageId, handleCopyMessage } = useCourseLiaClipboard();
  const { forceDarkText, panelRef } = useCourseLiaContrast(themeColors.panelBg, isLightTheme);
  const handleLinkClick = useCourseLiaLinkNavigation();
  const actions = useCourseLiaActions({
    attachments,
    inputValue,
    isLoading,
    resolvedLessonContext,
    sendMessage,
    setInputValue,
    stop,
  });

  useCourseLiaRegistration({
    currentActivity,
    isOpen,
    liaChat,
    registerLiaChat,
    resolvedLessonContext,
    setCourseContext,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  return (
    <CourseLiaPanelFrame
      isMobile={isMobile}
      isOpen={isOpen}
      panelRef={panelRef}
      themeColors={themeColors}
    >
      <CourseLiaPanelHeader isLightTheme={isLightTheme} onClearHistory={clearHistory} onClose={closeLia} themeColors={themeColors} />
      <CourseLiaMessages
        copiedMessageId={copiedMessageId}
        isDarkMode={isDarkMode}
        isLightTheme={isLightTheme}
        isLoading={isLoading}
        messages={messages}
        messagesEndRef={messagesEndRef}
        onCopyMessage={(messageId, content) => void handleCopyMessage(messageId, content)}
        onLinkClick={handleLinkClick}
        onSaveNote={props.onSaveNote}
        onStop={stop}
        themeColors={themeColors}
      />
      <CourseLiaInputBar
        attachments={attachments}
        canSendMessage={actions.canSendMessage}
        inputRef={inputRef}
        inputValue={inputValue}
        isLightTheme={isLightTheme}
        isLoading={isLoading}
        isMobile={isMobile}
        onInputChange={setInputValue}
        onKeyDown={actions.handleKeyDown}
        onPrimaryAction={actions.handlePrimaryAction}
        themeColors={themeColors}
      />
      <CourseLiaPanelStyles forceDarkText={forceDarkText} isLightTheme={isLightTheme} themeColors={themeColors} />
    </CourseLiaPanelFrame>
  );
}
