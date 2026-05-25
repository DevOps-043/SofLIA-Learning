import { useBusinessPanelTheme } from '@/features/business-panel/hooks/useBusinessPanelTheme'

export function useBusinessUsersTheme() {
  const theme = useBusinessPanelTheme()
  return {
    theme,
    isDark: theme.isDark,
    primaryColor: theme.primaryColor,
    secondaryColor: theme.secondaryColor,
    accentColor: theme.accentColor,
    themeColors: {
      text: theme.textColor,
      secondaryText: theme.subtextColor,
      cardBg: theme.cardBg,
      borderColor: theme.borderColor,
      primary: theme.primaryColor,
      secondary: theme.secondaryColor,
      accent: theme.accentColor,
    },
  }
}
