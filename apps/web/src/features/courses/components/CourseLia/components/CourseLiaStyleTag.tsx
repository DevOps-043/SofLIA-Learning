import type { CourseLiaThemeColors } from '../types';

interface CourseLiaStyleTagProps {
  forceDarkText: boolean;
  isLightTheme: boolean;
  themeColors: CourseLiaThemeColors;
}

export function CourseLiaStyleTag({
  forceDarkText,
  isLightTheme,
  themeColors,
}: CourseLiaStyleTagProps) {
  const textColor = isLightTheme ? 'var(--color-legacy-1e293b)' : themeColors.textPrimary;
  const mutedColor = isLightTheme ? 'var(--color-gray-500)' : themeColors.textSecondary;

  return (
    <style>{`
      @keyframes liaPulse {
        0%, 100% { opacity: 0.4; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.2); }
      }

      #lia-course-chat-input {
        background-color: transparent !important;
        border: none !important;
        box-shadow: none !important;
        outline: none !important;
        color: ${textColor} !important;
        caret-color: ${textColor} !important;
        -webkit-text-fill-color: ${textColor} !important;
      }

      #lia-course-chat-input::placeholder {
        color: ${mutedColor} !important;
        opacity: 1 !important;
        -webkit-text-fill-color: ${mutedColor} !important;
      }

      .lia-header-title {
        color: ${textColor} !important;
      }

      .lia-msg-user-text {
        color: white !important;
        -webkit-text-fill-color: white !important;
      }

      .lia-msg-assistant-text,
      .lia-chat-input {
        color: ${textColor} !important;
        caret-color: ${textColor} !important;
        -webkit-text-fill-color: ${textColor} !important;
      }

      .lia-chat-input::placeholder {
        color: ${mutedColor} !important;
        opacity: 1 !important;
        -webkit-text-fill-color: ${mutedColor} !important;
      }

      ${forceDarkText ? `
        .lia-msg-assistant-text,
        .lia-chat-input,
        #lia-course-chat-input {
          color: var(--color-legacy-0f172a) !important;
          caret-color: var(--color-legacy-0f172a) !important;
          -webkit-text-fill-color: var(--color-legacy-0f172a) !important;
        }
        .lia-chat-input::placeholder,
        #lia-course-chat-input::placeholder {
          color: var(--color-gray-500) !important;
          -webkit-text-fill-color: var(--color-gray-500) !important;
        }
        .lia-header-title {
          color: var(--color-legacy-0f172a) !important;
        }
      ` : ''}
    `}</style>
  );
}
