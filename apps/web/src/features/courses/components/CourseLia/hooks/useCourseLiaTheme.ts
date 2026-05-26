import { useMemo, useState } from 'react';

import { COURSE_LIA_COLORS } from '../constants';
import type { CourseLiaCustomColors, CourseLiaThemeColors } from '../types';

interface UseCourseLiaThemeArgs {
  customColors?: CourseLiaCustomColors;
  isLightTheme: boolean;
}

export function useCourseLiaTheme({
  customColors,
  isLightTheme,
}: UseCourseLiaThemeArgs) {
  const [forceDarkText, setForceDarkText] = useState(false);

  const themeColors = useMemo<CourseLiaThemeColors>(() => {
    const isCustomTheme = Boolean(customColors?.panelBg);
    const textPrimary = forceDarkText
      ? COURSE_LIA_COLORS.textLight
      : customColors?.textPrimary || (isLightTheme ? COURSE_LIA_COLORS.textLight : COURSE_LIA_COLORS.textDark);
    const textSecondary = forceDarkText
      ? COURSE_LIA_COLORS.textMutedLight
      : customColors?.textSecondary || (isLightTheme ? COURSE_LIA_COLORS.textMutedLight : COURSE_LIA_COLORS.textMutedDark);
    const inputBg = forceDarkText
      ? COURSE_LIA_COLORS.inputLight
      : isCustomTheme
        ? isLightTheme
          ? COURSE_LIA_COLORS.inputLight
          : COURSE_LIA_COLORS.customDarkInput
        : isLightTheme
          ? COURSE_LIA_COLORS.inputLight
          : COURSE_LIA_COLORS.subtleDarkInput;
    const borderColor = forceDarkText
      ? COURSE_LIA_COLORS.borderLight
      : customColors?.borderColor || (isLightTheme ? COURSE_LIA_COLORS.borderLight : COURSE_LIA_COLORS.bubbleDark);
    const messageBubbleAssistant = forceDarkText
      ? COURSE_LIA_COLORS.inputLight
      : isCustomTheme
        ? COURSE_LIA_COLORS.subtleWhite
        : isLightTheme
          ? COURSE_LIA_COLORS.inputLight
          : COURSE_LIA_COLORS.bubbleDark;

    return {
      panelBg: customColors?.panelBg || (isLightTheme ? COURSE_LIA_COLORS.white : COURSE_LIA_COLORS.panelDark),
      headerBg: customColors?.panelBg || (isLightTheme ? 'var(--color-gray-800)' : COURSE_LIA_COLORS.panelDark),
      borderColor,
      messageBubbleAssistant,
      messageBubbleUser: COURSE_LIA_COLORS.primary,
      textPrimary,
      textSecondary,
      inputBg,
      inputBorder: forceDarkText
        ? COURSE_LIA_COLORS.inputBorderLight
        : customColors?.borderColor
          ? 'transparent'
          : isLightTheme
            ? COURSE_LIA_COLORS.inputBorderLight
            : COURSE_LIA_COLORS.inputBorderDark,
      accentColor: customColors?.accentColor || COURSE_LIA_COLORS.accent,
      primaryAction: customColors?.accentColor || COURSE_LIA_COLORS.primary,
      assistantLinkColor: isLightTheme ? COURSE_LIA_COLORS.primary : COURSE_LIA_COLORS.accent,
    };
  }, [customColors, forceDarkText, isLightTheme]);

  return { forceDarkText, setForceDarkText, themeColors };
}
