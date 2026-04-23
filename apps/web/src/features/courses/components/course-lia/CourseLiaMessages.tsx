import type { RefObject } from 'react';

import type { SofLIAMessage } from '../../../../core/types/lia.types';
import type { CourseLiaThemeColors } from './CourseLia.types';
import { CourseLiaMessageItem } from './CourseLiaMessageItem';
import { CourseLiaTypingIndicator } from './CourseLiaTypingIndicator';

interface CourseLiaMessagesProps {
  copiedMessageId: string | null;
  isDarkMode: boolean;
  isLightTheme: boolean;
  isLoading: boolean;
  messages: SofLIAMessage[];
  messagesEndRef: RefObject<HTMLDivElement>;
  onCopyMessage: (messageId: string, content: string) => void;
  onLinkClick: (url: string) => void;
  onSaveNote?: (content: string) => void;
  onStop: () => void;
  themeColors: CourseLiaThemeColors;
}

export function CourseLiaMessages({
  copiedMessageId,
  isDarkMode,
  isLightTheme,
  isLoading,
  messages,
  messagesEndRef,
  onCopyMessage,
  onLinkClick,
  onSaveNote,
  onStop,
  themeColors,
}: CourseLiaMessagesProps) {
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {messages.map((message) => (
        <CourseLiaMessageItem
          key={message.id}
          copiedMessageId={copiedMessageId}
          isDarkMode={isDarkMode}
          isLightTheme={isLightTheme}
          message={message}
          onCopyMessage={onCopyMessage}
          onLinkClick={onLinkClick}
          onSaveNote={onSaveNote}
          themeColors={themeColors}
        />
      ))}
      <CourseLiaTypingIndicator isLoading={isLoading} onStop={onStop} themeColors={themeColors} />
      <div ref={messagesEndRef} />
    </div>
  );
}
