import { useTranslation } from 'react-i18next';

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
    <div data-tour-id="course-learn--soflia-input" style={{ padding: isMobile ? '8px 3% 10px' : '10px 16px 12px', borderTop: `1px solid ${themeColors.borderColor}` }}>
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
