import { AnimatePresence, motion } from 'framer-motion';
import {
  Award,
  BarChart2,
  Building2,
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

interface ModernNavbarMobileMenuProps {
  canAccessAdminPanel: boolean;
  certificatesCount?: number;
  colors: ModernNavbarColors;
  getDisplayName: () => string;
  getInitials: () => string;
  hasStudyPlan: boolean | null;
  isOpen: boolean;
  language: string;
  onClose: () => void;
  onLogout: () => void;
  onProfileClick: () => void;
  onRestartTour?: () => void;
  onCertificatesClick?: () => void;
  onAnalyticsClick?: () => void;
  organization: ModernNavbarOrganization | null;
  resolvedTheme: string | null | undefined;
  router: { push: (href: string) => void };
  setLanguage: (value: 'es' | 'en' | 'pt') => void;
  setTheme: (value: Theme) => void;
  t: (key: string) => string;
  theme: Theme;
  user: ModernNavbarUser | null;
  disableHeavyEffects?: boolean;
  showOrganizations: boolean;
}

export function ModernNavbarMobileMenu({
  canAccessAdminPanel,
  certificatesCount = 0,
  colors,
  getDisplayName,
  getInitials,
  hasStudyPlan,
  isOpen,
  language,
  onClose,
  onLogout,
  onProfileClick,
  onRestartTour,
  onCertificatesClick,
  onAnalyticsClick,
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
}: ModernNavbarMobileMenuProps) {
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
                background: `linear-gradient(135deg, ${colors.primary}15, ${colors.accent}10)`,
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

            {canAccessAdminPanel && (
              <motion.button
                onClick={() => {
                  router.push(`/${organization?.slug || ''}/business-panel/dashboard`);
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors"
                whileTap={disableHeavyEffects ? undefined : { scale: 0.98 }}
                style={{
                  backgroundColor: `${colors.primary}10`,
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
                  backgroundColor: `${colors.primary}10`,
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
                style={{ backgroundColor: `${colors.primary}10`, border: `1px solid ${colors.border}` }}
              >
                <div className="p-2 rounded-xl flex-shrink-0" style={{ backgroundColor: `${colors.accent}20` }}>
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
                style={{ backgroundColor: `${colors.primary}10`, border: `1px solid ${colors.border}` }}
              >
                <div className="p-2 rounded-xl flex-shrink-0" style={{ backgroundColor: `${colors.accent}20` }}>
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
                backgroundColor: `${colors.primary}10`,
                border: `1px solid ${colors.border}`,
              }}
            >
              <div className="p-2 rounded-xl flex-shrink-0" style={{ backgroundColor: `${colors.accent}20` }}>
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
                      backgroundColor: language === option.value ? `${colors.accent}15` : 'transparent',
                      borderColor: language === option.value ? `${colors.accent}30` : colors.border,
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
                        backgroundColor: theme === option.value ? `${colors.accent}15` : 'transparent',
                        borderColor: theme === option.value ? `${colors.accent}30` : colors.border,
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
