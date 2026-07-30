import { useTranslation } from 'react-i18next';

import styles from '../CourseLiaPanel.module.css';
import type { CourseLiaThemeColors, PrimaryActionMode } from '../types';

import { CourseLiaInputBar } from './CourseLiaInputBar';
import { VoiceErrorBanner } from './VoiceErrorBanner';

interface CourseLiaInputProps {
  inputRef: React.RefObject<HTMLTextAreaElement>;
  inputValue: string;
  isInteractionBlocked: boolean;
  isLightTheme: boolean;
  isListening: boolean;
  isMobile: boolean;
  onInputChange: (value: string) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onPrimaryAction: () => void;
  primaryActionLabel: string;
  primaryActionMode: PrimaryActionMode;
  setVoiceError: (error: string | null) => void;
  themeColors: CourseLiaThemeColors;
  voiceError: string | null;
}

export function CourseLiaInput({
  isLightTheme,
  isMobile,
  setVoiceError,
  themeColors,
  voiceError,
  ...inputBarProps
}: CourseLiaInputProps) {
  const { t } = useTranslation('learn');

  return (
    <div
      data-tour-id="course-learn--soflia-input"
      className={styles.composerWrap}
    >
      <VoiceErrorBanner
        isLightTheme={isLightTheme}
        message={voiceError}
        onDismiss={() => setVoiceError(null)}
      />
      <CourseLiaInputBar
        {...inputBarProps}
        isLightTheme={isLightTheme}
        isMobile={isMobile}
        placeholder={t('lia.coursePlaceholder')}
        themeColors={themeColors}
      />
    </div>
  );
}
