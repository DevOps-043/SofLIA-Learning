import type { RefObject } from 'react';

import type { CourseLiaThemeColors, PrimaryActionMode } from '../types';

import { PrimaryActionButton } from './PrimaryActionButton';
import { VoiceWaveformBars } from './VoiceWaveformBars';

interface CourseLiaInputBarProps {
  inputRef: RefObject<HTMLTextAreaElement>;
  inputValue: string;
  isInteractionBlocked: boolean;
  isLightTheme: boolean;
  isListening: boolean;
  isMobile: boolean;
  onInputChange: (value: string) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onPrimaryAction: () => void;
  placeholder: string;
  primaryActionLabel: string;
  primaryActionMode: PrimaryActionMode;
  themeColors: CourseLiaThemeColors;
}

export function CourseLiaInputBar({
  inputRef,
  inputValue,
  isInteractionBlocked,
  isLightTheme,
  isListening,
  isMobile,
  onInputChange,
  onKeyDown,
  onPrimaryAction,
  placeholder,
  primaryActionLabel,
  primaryActionMode,
  themeColors,
}: CourseLiaInputBarProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '2%' : '9px', backgroundColor: themeColors.inputBg, borderRadius: '20px', padding: isMobile ? '5px 3%' : '5px 9px 5px 14px', border: `1px solid ${themeColors.inputBorder}`, overflow: 'hidden', minWidth: 0 }}>
      {isListening && !inputValue ? (
        <div style={{ flexShrink: 0 }}>
          <VoiceWaveformBars color={themeColors.accentColor} count={5} size={18} />
        </div>
      ) : null}
      <textarea
        ref={inputRef}
        value={inputValue}
        onChange={(event) => {
          if (!isInteractionBlocked) {
            onInputChange(event.target.value);
          }
        }}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        disabled={isInteractionBlocked}
        rows={1}
        style={{ flex: 1, minHeight: '20px', maxHeight: '120px', resize: 'none', backgroundColor: 'transparent', border: 'none', outline: 'none', color: themeColors.textPrimary, fontSize: '14px', lineHeight: '20px', padding: 0, overflowY: 'hidden', display: 'block' }}
        id="lia-course-chat-input"
        className="lia-input-reset lia-chat-input"
      />
      <PrimaryActionButton
        disabled={isInteractionBlocked}
        isLightTheme={isLightTheme}
        isListening={isListening}
        label={primaryActionLabel}
        mode={primaryActionMode}
        onClick={onPrimaryAction}
        themeColors={themeColors}
      />
    </div>
  );
}
