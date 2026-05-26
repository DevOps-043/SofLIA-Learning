import { AnimatePresence, motion } from 'framer-motion';
import {
  Award,
  BarChart2,
  Building2,
  Check,
  ChevronRight,
  CalendarDays,
  CalendarPlus,
  Globe,
  LayoutDashboard,
  LogOut,
  Moon,
  Sun,
  User,
} from 'lucide-react';
import type { Theme } from '../../../../../../core/stores/themeStore';
import { LANGUAGE_OPTIONS, THEME_OPTIONS } from './constants';
import { ModernNavbarAvatar } from './ModernNavbarAvatar';
import { buildStudyPlannerEntryPath } from './service';
import type { ModernNavbarColors, ModernNavbarOrganization, ModernNavbarUser } from './types';
import { useOrganization, type Organization } from '../../../../../../core/hooks/useOrganization';

interface ModernNavbarMobileMenuProps {
  canAccessAdminPanel: boolean;
  colors: ModernNavbarColors;
  getDisplayName: () => string;
  getInitials: () => string;
  hasStudyPlan: boolean | null;
  isOpen: boolean;
  language: string;
  onClose: () => void;
  onLogout: () => void;
  onProfileClick: () => void;
  organization: ModernNavbarOrganization | null;
  resolvedTheme: string | null | undefined;
  router: { push: (href: string) => void };
  setLanguage: (value: 'es' | 'en' | 'pt') => void;
  setTheme: (value: Theme) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
  theme: Theme;
  user: ModernNavbarUser | null;
  disableHeavyEffects?: boolean;
  showOrganizations: boolean;
  onCertificatesClick?: () => void;
  onAnalyticsClick?: () => void;
  certificatesCount?: number;
}

export function ModernNavbarMobileMenu({
  canAccessAdminPanel,
  colors,
  getDisplayName,
  getInitials,
  hasStudyPlan,
  isOpen,
  language,
  onClose,
  onLogout,
  onProfileClick,
  organization,
  resolvedTheme,
  router,
  setLanguage,
  setTheme,
  t,
  theme,
  user,
  disableHeavyEffects = false,
  showOrganizations,
  onCertificatesClick,
  onAnalyticsClick,
  certificatesCount = 0,
}: ModernNavbarMobileMenuProps) {
  const {
    currentOrganization,
    organizations,
    canSwitch,
    switchOrganization,
  } = useOrganization();

  const handleOrganizationSwitch = (targetOrganization: Organization) => {
    if (targetOrganization.id !== currentOrganization?.id) {
      switchOrganization(targetOrganization.slug);
    }
    onClose();
  };

  const getOrganizationRoleLabel = (role?: Organization['role']) => {
    if (!role) return t('common:profileDropdown.orgRoles.member');
    return t(`common:profileDropdown.orgRoles.${role}`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={disableHeavyEffects ? false : { opacity: 0, y: -20 }}
          animate={disableHeavyEffects ? undefined : { opacity: 1, y: 0 }}
          exit={disableHeavyEffects ? undefined : { opacity: 0, y: -20 }}
          transition={disableHeavyEffects ? undefined : { duration: 0.3, ease: 'easeInOut' }}
          className="md:hidden fixed inset-x-0 top-16 bottom-0 z-[100] flex flex-col"
          style={{
            backgroundColor: colors.cardBg,
            borderTop: `1px solid ${colors.border}`,
          }}
        >
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 pb-8">
            <div
              className="flex items-center gap-3 p-3 rounded-xl mb-3"
              style={{
                background: `linear-gradient(135deg, color-mix(in srgb, ${colors.primary} 8.2%, transparent), color-mix(in srgb, ${colors.accent} 6.3%, transparent))`,
                border: `1px solid ${colors.border}`,
              }}
            >
              <div
                className="h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})` }}
              >
                <ModernNavbarAvatar
                  alt={getDisplayName()}
                  className="h-full w-full rounded-xl object-cover"
                  initials={getInitials()}
                  profilePictureUrl={user?.profile_picture_url}
                  size={48}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: colors.text }}>{getDisplayName()}</p>
                <p className="text-xs truncate opacity-70" style={{ color: colors.text }}>{user?.email || ''}</p>
              </div>
            </div>

            {showOrganizations && currentOrganization && (
              <div
                className="rounded-xl p-3"
                style={{
                  background: `linear-gradient(135deg, ${colors.primary}14, ${colors.accent}10)`,
                  border: `1px solid ${colors.border}`,
                }}
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <MobileOrganizationMark organization={currentOrganization} colors={colors} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold" style={{ color: colors.text }}>
                        {currentOrganization.name}
                      </p>
                      <p className="truncate text-xs opacity-70" style={{ color: colors.text }}>
                        {getOrganizationRoleLabel(currentOrganization.role)}
                      </p>
                    </div>
                  </div>
                  <span
                    className="shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold"
                    style={{ backgroundColor: `${colors.accent}18`, color: colors.accent }}
                  >
                    {t('common:profileDropdown.currentOrganization')}
                  </span>
                </div>

                {canSwitch && organizations.length > 1 && (
                  <div className="space-y-1">
                    <p className="px-1 text-[11px] font-semibold uppercase tracking-wide opacity-70" style={{ color: colors.text }}>
                      {t('common:profileDropdown.quickSwitch')}
                    </p>
                    <div className="max-h-44 space-y-1 overflow-y-auto pr-1">
                      {organizations.slice(0, 5).map((targetOrganization) => {
                        const isActive = targetOrganization.id === currentOrganization.id;

                        return (
                          <button
                            key={targetOrganization.id}
                            type="button"
                            onClick={() => handleOrganizationSwitch(targetOrganization)}
                            className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left transition-colors"
                            style={{
                              backgroundColor: isActive ? `${colors.accent}14` : 'transparent',
                              color: colors.text,
                            }}
                            aria-current={isActive ? 'true' : undefined}
                          >
                            <MobileOrganizationMark organization={targetOrganization} colors={colors} compact />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-xs font-semibold">
                                {targetOrganization.name}
                              </span>
                              <span className="block truncate text-[11px] opacity-70">
                                {getOrganizationRoleLabel(targetOrganization.role)}
                              </span>
                            </span>
                            {isActive ? (
                              <Check className="h-4 w-4 shrink-0" style={{ color: colors.accent }} />
                            ) : (
                              <ChevronRight className="h-4 w-4 shrink-0 opacity-50" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {organizations.length > 5 && (
                      <p className="px-1 pt-1 text-[11px] opacity-70" style={{ color: colors.text }}>
                        {t('common:profileDropdown.moreOrganizations', { count: organizations.length - 5 })}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {canAccessAdminPanel && (
              <motion.button
                onClick={() => {
                  router.push(`/${organization?.slug || ''}/business-panel/dashboard`);
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors"
                whileTap={disableHeavyEffects ? undefined : { scale: 0.98 }}
                style={{
                  backgroundColor: `color-mix(in srgb, ${colors.primary} 6.3%, transparent)`,
                  border: `1px solid ${colors.border}`,
                }}
              >
                <div
                  className="p-2 rounded-xl text-white flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})` }}
                >
                  <LayoutDashboard className="h-4 w-4" />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <span className="font-medium block text-sm" style={{ color: colors.text }}>{t('business:header.adminPanel')}</span>
                  <span className="text-xs opacity-70" style={{ color: colors.text }}>{t('business:header.manageOrganization')}</span>
                </div>
              </motion.button>
            )}



            {showOrganizations && (
              <motion.button
                onClick={() => {
                  router.push('/auth/select-organization');
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors"
                whileTap={disableHeavyEffects ? undefined : { scale: 0.98 }}
                style={{
                  backgroundColor: `color-mix(in srgb, ${colors.primary} 6.3%, transparent)`,
                  border: `1px solid ${colors.border}`,
                }}
              >
                <div
                  className="p-2 rounded-xl text-white flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})` }}
                >
                  <Building2 className="h-4 w-4" />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <span className="font-medium block text-sm" style={{ color: colors.text }}>{t('common:profileDropdown.organizations')}</span>
                  <span className="text-xs opacity-70" style={{ color: colors.text }}>{t('common:profileDropdown.viewAllOrganizations')}</span>
                </div>
              </motion.button>
            )}

            {/* Certificados */}
            {onCertificatesClick && (
              <motion.button
                onClick={() => { onCertificatesClick(); onClose(); }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors"
                whileTap={disableHeavyEffects ? undefined : { scale: 0.98 }}
                style={{ backgroundColor: `color-mix(in srgb, ${colors.primary} 6.3%, transparent)`, border: `1px solid ${colors.border}` }}
              >
                <div className="p-2 rounded-xl flex-shrink-0" style={{ backgroundColor: `color-mix(in srgb, ${colors.accent} 12.5%, transparent)` }}>
                  <Award className="h-4 w-4" style={{ color: colors.accent }} />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <span className="font-medium block text-sm" style={{ color: colors.text }}>{t('common:menu.certificates')}</span>
                  {certificatesCount > 0 && (
                    <span className="text-xs" style={{ color: colors.accent }}>
                      {t('common:profileDropdown.certificatesObtained', { count: certificatesCount })}
                    </span>
                  )}
                </div>
              </motion.button>
            )}

            {/* Mis estadísticas */}
            {onAnalyticsClick && (
              <motion.button
                onClick={() => { onAnalyticsClick(); onClose(); }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors"
                whileTap={disableHeavyEffects ? undefined : { scale: 0.98 }}
                style={{ backgroundColor: `color-mix(in srgb, ${colors.primary} 6.3%, transparent)`, border: `1px solid ${colors.border}` }}
              >
                <div className="p-2 rounded-xl flex-shrink-0" style={{ backgroundColor: `color-mix(in srgb, ${colors.accent} 12.5%, transparent)` }}>
                  <BarChart2 className="h-4 w-4" style={{ color: colors.accent }} />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <span className="font-medium block text-sm" style={{ color: colors.text }}>{t('common:menu.stats')}</span>
                </div>
              </motion.button>
            )}

            <motion.button
              onClick={() => {
                onProfileClick();
                onClose();
              }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors"
              whileTap={disableHeavyEffects ? undefined : { scale: 0.98 }}
              style={{
                backgroundColor: `color-mix(in srgb, ${colors.primary} 6.3%, transparent)`,
                border: `1px solid ${colors.border}`,
              }}
            >
              <div className="p-2 rounded-xl flex-shrink-0" style={{ backgroundColor: `color-mix(in srgb, ${colors.accent} 12.5%, transparent)` }}>
                <User className="h-4 w-4" style={{ color: colors.accent }} />
              </div>
              <div className="text-left flex-1 min-w-0">
                <span className="font-medium block text-sm" style={{ color: colors.text }}>{t('business:header.editProfile')}</span>
                <span className="text-xs opacity-70" style={{ color: colors.text }}>{t('business:header.updateInfo')}</span>
              </div>
            </motion.button>



            <div className="px-3 py-2">
              <div className="flex items-center gap-2 mb-2 px-1">
                <Globe className="w-3.5 h-3.5 opacity-70" style={{ color: colors.text }} />
                <span className="text-xs font-medium opacity-70" style={{ color: colors.text }}>
                  {t('business:header.language')}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {LANGUAGE_OPTIONS.map((option) => (
                  <motion.button
                    key={option.value}
                    onClick={() => setLanguage(option.value)}
                    className="relative overflow-hidden rounded-xl py-2 text-sm font-medium transition-colors border"
                    style={{
                      backgroundColor: language === option.value ? `color-mix(in srgb, ${colors.accent} 8.2%, transparent)` : 'transparent',
                      borderColor: language === option.value ? `color-mix(in srgb, ${colors.accent} 18.8%, transparent)` : colors.border,
                      color: language === option.value ? colors.accent : colors.text,
                      opacity: language === option.value ? 1 : 0.7,
                    }}
                    whileTap={disableHeavyEffects ? undefined : { scale: 0.95 }}
                  >
                    {option.compactLabel}
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="px-3 py-2">
              <div className="flex items-center gap-2 mb-2 px-1">
                {resolvedTheme === 'dark' ? (
                  <Moon className="w-3.5 h-3.5 opacity-70" style={{ color: colors.text }} />
                ) : (
                  <Sun className="w-3.5 h-3.5 opacity-70" style={{ color: colors.text }} />
                )}
                <span className="text-xs font-medium opacity-70" style={{ color: colors.text }}>
                  {t('common:profileDropdown.theme')}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {THEME_OPTIONS.map((option) => {
                  const ThemeIcon = option.icon;
                  return (
                    <motion.button
                      key={option.value}
                      onClick={() => setTheme(option.value)}
                      className="relative overflow-hidden rounded-xl py-2 text-sm font-medium transition-colors border flex items-center justify-center gap-1.5"
                      style={{
                        backgroundColor: theme === option.value ? `color-mix(in srgb, ${colors.accent} 8.2%, transparent)` : 'transparent',
                        borderColor: theme === option.value ? `color-mix(in srgb, ${colors.accent} 18.8%, transparent)` : colors.border,
                        color: theme === option.value ? colors.accent : colors.text,
                        opacity: theme === option.value ? 1 : 0.7,
                      }}
                      whileTap={disableHeavyEffects ? undefined : { scale: 0.95 }}
                    >
                      <ThemeIcon className="w-3 h-3" />
                      {t(`common:menu.theme.${option.value}`)}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <motion.button
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors"
              whileTap={disableHeavyEffects ? undefined : { scale: 0.98 }}
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.15)',
              }}
            >
              <div className="p-2 rounded-xl flex-shrink-0" style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)' }}>
                <LogOut className="h-4 w-4 text-red-400" />
              </div>
              <div className="text-left flex-1 min-w-0">
                <span className="text-red-400 font-medium block text-sm">{t('business:header.logout')}</span>
                <span className="text-xs opacity-70" style={{ color: colors.text }}>{t('business:header.exitAccount')}</span>
              </div>
            </motion.button>
          </div>

          <div
            className="h-1 w-full flex-shrink-0"
            style={{
              background: `linear-gradient(90deg, ${colors.primary}, ${colors.accent})`,
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface MobileOrganizationMarkProps {
  organization: Organization;
  colors: ModernNavbarColors;
  compact?: boolean;
}

function MobileOrganizationMark({ organization, colors, compact = false }: MobileOrganizationMarkProps) {
  const logoUrl = organization.brandLogoUrl || organization.logoUrl;
  const sizeClassName = compact ? 'h-8 w-8 rounded-lg text-xs' : 'h-10 w-10 rounded-xl text-sm';
  const organizationLabel =
    organization.name?.trim() ||
    organization.slug?.trim() ||
    organization.id?.trim() ||
    'O';

  if (logoUrl) {
    return (
      <span className={`shrink-0 overflow-hidden ${sizeClassName}`} style={{ backgroundColor: colors.cardBg }}>
        <img src={logoUrl} alt="" className="h-full w-full object-cover" />
      </span>
    );
  }

  return (
    <span
      className={`flex shrink-0 items-center justify-center font-bold text-white shadow-sm ${sizeClassName}`}
      style={{ background: `linear-gradient(135deg, ${organization.brandColorPrimary || colors.primary}, ${colors.accent})` }}
      aria-hidden="true"
    >
      {organizationLabel.charAt(0).toUpperCase()}
    </span>
  );
}
