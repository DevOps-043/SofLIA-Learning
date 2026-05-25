export interface CourseThemeColors {
  accent: string;
  bgPrimary: string;
  bgSecondary: string;
  isLightMode: boolean;
  primary: string;
  text: string;
}

export interface CourseDashboardStyles {
  accent_color?: string | null;
  background_value?: string | null;
  card_background?: string | null;
  primary_button_color?: string | null;
}

export interface CoursePanelStyles {
  sidebar_background?: string | null;
}

export interface CourseThemeStyleSource {
  panel?: CoursePanelStyles | null;
  userDashboard?: CourseDashboardStyles | null;
}
