export interface ModernNavbarStyleConfig {
  accent_color?: string | null;
  card_background?: string | null;
  primary_button_color?: string | null;
  sidebar_background?: string | null;
  sidebar_opacity?: number;
  text_color?: string | null;
}

export interface ModernNavbarOrganization {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
  favicon_url?: string | null;
  brand_logo_url?: string | null;
  brand_favicon_url?: string | null;
  show_navbar_name?: boolean;
}

export interface ModernNavbarUser {
  profile_picture_url?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  display_name?: string | null;
  username?: string | null;
  email?: string | null;
  cargo_rol?: string | null;
}

export interface ModernNavbarProps {
  organization: ModernNavbarOrganization | null;
  user: ModernNavbarUser | null;
  orgRole?: 'owner' | 'admin' | 'member' | 'superadmin' | null;
  getDisplayName: () => string;
  getInitials: () => string;
  onProfileClick: () => void;
  onLogout: () => void;
  styles?: ModernNavbarStyleConfig | null;
  onRestartTour?: () => void;
}

export interface ModernNavbarColors {
  primary: string;
  accent: string;
  text: string;
  cardBg: string;
  navBg: string;
  border: string;
  borderActive: string;
  gradientStart: string;
  gradientEnd: string;
  isLightMode: boolean;
}
