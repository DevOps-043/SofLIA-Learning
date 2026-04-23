import { Paperclip } from 'lucide-react';
import type { KeyboardEventHandler, RefObject } from 'react';

import type { CourseLiaThemeColors } from './CourseLia.types';
import { CourseLiaSendButton } from './CourseLiaSendButton';

interface CourseLiaInputControlsProps {
  canSendMessage: boolean;
  inputRef: RefObject<HTMLInputElement>;
  inputValue: string;
  isLightTheme: boolean;
  isLoading: boolean;
  isMobile: boolean;
  onAttachmentButtonClick: () => void;
  onInputChange: (value: string) => void;
  onKeyDown: KeyboardEventHandler<HTMLInputElement>;
  onPrimaryAction: () => void;
  selectedAttachment: boolean;
  themeColors: CourseLiaThemeColors;
}

export function CourseLiaInputControls({
  canSendMessage,
  inputRef,
  inputValue,
  isLightTheme,
  isLoading,
  isMobile,
  onAttachmentButtonClick,
  onInputChange,
  onKeyDown,
  onPrimaryAction,
  selectedAttachment,
  themeColors,
}: CourseLiaInputControlsProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '2%' : '12px', backgroundColor: themeColors.inputBg, borderRadius: '24px', padding: isMobile ? '8px 3%' : '10px 16px', border: `1px solid ${themeColors.inputBorder}`, overflow: 'hidden', minWidth: 0 }}>
      <button
        type="button"
        onClick={onAttachmentButtonClick}
        title="Adjuntar imagen"
        style={{ width: '36px', height: '36px', borderRadius: '999px', border: 'none', backgroundColor: selectedAttachment ? 'rgba(0,212,179,0.12)' : 'transparent', color: selectedAttachment ? themeColors.accentColor : themeColors.textSecondary, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
      >
        <Paperclip style={{ width: '16px', height: '16px' }} />
      </button>
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(event) => onInputChange(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Pregunta sobre la leccion..."
        style={{ flex: 1, backgroundColor: 'transparent', border: 'none', outline: 'none', color: themeColors.textPrimary, fontSize: '14px' }}
        id="lia-course-chat-input"
        className="lia-input-reset lia-chat-input"
      />
      <CourseLiaSendButton
        canSendMessage={canSendMessage}
        isLightTheme={isLightTheme}
        isLoading={isLoading}
        isMobile={isMobile}
        onClick={onPrimaryAction}
        themeColors={themeColors}
      />
    </div>
  );
}
