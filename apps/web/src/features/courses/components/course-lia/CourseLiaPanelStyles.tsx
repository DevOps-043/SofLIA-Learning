import type { CourseLiaThemeColors } from './CourseLia.types';

interface CourseLiaPanelStylesProps {
  forceDarkText: boolean;
  isLightTheme: boolean;
  themeColors: CourseLiaThemeColors;
}

export function CourseLiaPanelStyles({
  forceDarkText,
  isLightTheme,
  themeColors,
}: CourseLiaPanelStylesProps) {
  const inputTextColor = isLightTheme ? '#1E293B' : themeColors.textPrimary;
  const placeholderColor = isLightTheme ? '#64748B' : themeColors.textSecondary;

  return (
    <style>{`
      @keyframes liaPulse { 0%, 100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 1; transform: scale(1.2); } }

      #lia-course-chat-input {
        background-color: transparent !important;
        border: none !important;
        box-shadow: none !important;
        outline: none !important;
        color: ${inputTextColor} !important;
        caret-color: ${inputTextColor} !important;
        -webkit-text-fill-color: ${inputTextColor} !important;
      }

      #lia-course-chat-input::placeholder {
        color: ${placeholderColor} !important;
        opacity: 1 !important;
        -webkit-text-fill-color: ${placeholderColor} !important;
      }

      .lia-header-title {
        color: ${inputTextColor} !important;
      }

      .lia-msg-user-text {
        color: white !important;
        -webkit-text-fill-color: white !important;
      }

      .lia-msg-assistant-text,
      .lia-chat-input {
        color: ${inputTextColor} !important;
        caret-color: ${inputTextColor} !important;
        -webkit-text-fill-color: ${inputTextColor} !important;
      }

      .lia-chat-input::placeholder {
        color: ${placeholderColor} !important;
        opacity: 1 !important;
        -webkit-text-fill-color: ${placeholderColor} !important;
      }

      ${forceDarkText ? `
        .lia-msg-assistant-text,
        .lia-chat-input,
        #lia-course-chat-input {
          color: #0F172A !important;
          caret-color: #0F172A !important;
          -webkit-text-fill-color: #0F172A !important;
        }
        .lia-chat-input::placeholder,
        #lia-course-chat-input::placeholder {
          color: #64748B !important;
          -webkit-text-fill-color: #64748B !important;
        }
        .lia-header-title {
          color: #0F172A !important;
        }
      ` : ''}
    `}</style>
  );
}
