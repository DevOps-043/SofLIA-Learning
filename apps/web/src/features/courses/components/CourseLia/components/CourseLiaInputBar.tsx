import type { CSSProperties, RefObject } from 'react';

import styles from '../CourseLiaPanel.module.css';
import type { CourseLiaThemeColors, PrimaryActionMode } from '../types';

import { PrimaryActionButton } from './PrimaryActionButton';
import { VoiceWaveformBars } from './VoiceWaveformBars';

interface CourseLiaInputBarProps {
  inputClassName?: string;
  inputId?: string;
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
  inputClassName = 'lia-input-reset lia-chat-input',
  inputId = 'lia-course-chat-input',
  inputRef,
  inputValue,
  isInteractionBlocked,
  isListening,
  onInputChange,
  onKeyDown,
  onPrimaryAction,
  placeholder,
  primaryActionLabel,
  primaryActionMode,
  themeColors,
}: CourseLiaInputBarProps) {
  const themeVariables = {
    '--course-lia-accent': themeColors.accentColor,
    '--course-lia-text': themeColors.textPrimary,
    '--course-lia-muted': themeColors.textSecondary,
    '--course-lia-input': themeColors.inputBg,
    '--course-lia-input-border': themeColors.inputBorder,
    '--course-lia-primary': themeColors.primaryAction,
  } as CSSProperties;

  return (
    <div className={styles.composer} style={themeVariables}>
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
        className={`${inputClassName} ${styles.textarea}`}
        id={inputId}
      />
      <PrimaryActionButton
        disabled={isInteractionBlocked}
        isListening={isListening}
        label={primaryActionLabel}
        mode={primaryActionMode}
        onClick={onPrimaryAction}
        themeColors={themeColors}
      />
    </div>
  );
}
