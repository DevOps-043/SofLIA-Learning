import { AnimatePresence, motion } from 'framer-motion';
import {
  Building2,
  CalendarDays,
  CalendarPlus,
  Check,
  ChevronRight,
  Globe,
  LayoutDashboard,
  LogOut,
  Moon,
  Sun,
  User,
} from 'lucide-react';
import { BUSINESS_USER_DASHBOARD_TOUR_TARGET_IDS } from '../../../../../../core/constants/tourTargets';
import type { Theme } from '../../../../../../core/stores/themeStore';
import { LANGUAGE_OPTIONS, THEME_OPTIONS } from './constants';
import { ModernNavbarAvatar } from './ModernNavbarAvatar';
import { buildStudyPlannerEntryPath } from './service';
import type { ModernNavbarColors, ModernNavbarOrganization, ModernNavbarUser } from './types';

interface ModernNavbarDesktopMenuProps {
  activeSubmenu: string | null;
  canAccessAdminPanel: boolean;
  colors: ModernNavbarColors;
  getDisplayName: () => string;
  getInitials: () => string;
  hasStudyPlan: boolean | null;
  language: string;
  onClose: () => void;
  onLogout: () => void;
  onProfileClick: () => void;
  onRestartTour?: () => void;
  organization: ModernNavbarOrganization | null;
  resolvedTheme: string | null | undefined;
  router: { push: (href: string) => void };
  setActiveSubmenu: (value: string | null) => void;
  setLanguage: (value: 'es' | 'en' | 'pt') => void;
  setTheme: (value: Theme) => void;
  setUserDropdownOpen: (value: boolean) => void;
  t: (key: string) => string;
  theme: Theme;
  user: ModernNavbarUser | null;
  userDropdownOpen: boolean;
}

export function ModernNavbarDesktopMenu({
  activeSubmenu,
  canAccessAdminPanel,
  colors,
  getDisplayName,
  getInitials,
  hasStudyPlan,
  language,
  onClose,
  onLogout,
  onProfileClick,
  onRestartTour,
  organization,
  resolvedTheme,
  router,
  setActiveSubmenu,
  setLanguage,
  setTheme,
  setUserDropdownOpen,
  t,
  theme,
  user,
  userDropdownOpen,
}: ModernNavbarDesktopMenuProps) {
  const hoverBackground = colors.isLightMode ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)';

  return (
    <>
      <motion.button
        id={BUSINESS_USER_DASHBOARD_TOUR_TARGET_IDS.userDropdownTrigger}
        onClick={() => setUserDropdownOpen(!userDropdownOpen)}
        className="flex items-center justify-center transition-all duration-300 p-1"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div
          className="h-10 w-10 rounded-xl flex items-center justify-center relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
            boxShadow: `0 4px 15px ${colors.primary}40`,
          }}
        >
          <ModernNavbarAvatar
            alt={getDisplayName()}
            className="h-full w-full rounded-xl object-cover"
            initials={getInitials()}
            profilePictureUrl={user?.profile_picture_url}
            size={40}
          />
        </div>
      </motion.button>

      <AnimatePresence>
        {userDropdownOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[998] bg-black/5 backdrop-blur-[1px]"
              onClick={onClose}
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 w-64 rounded-xl border backdrop-blur-xl shadow-xl z-[999] overflow-hidden"
              style={{
                backgroundColor: colors.navBg,
                borderColor: colors.border,
              }}
            >
              <div className="px-4 py-3 border-b" style={{ borderColor: colors.border }}>
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-full flex items-center justify-center ring-2"
                    style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})` }}
                  >
                    <ModernNavbarAvatar
                      alt={getDisplayName()}
                      className="h-full w-full rounded-full object-cover"
                      initials={getInitials()}
                      profilePictureUrl={user?.profile_picture_url}
                      size={40}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: colors.text }}>
                      {getDisplayName()}
                    </p>
                    <p
                      className="text-xs truncate"
                      style={{ color: colors.isLightMode ? '#64748B' : 'rgba(255, 255, 255, 0.7)' }}
                    >
                      {user?.email || ''}
                    </p>
                  </div>
                </div>
              </div>

              <div className="py-1.5">
                {canAccessAdminPanel && (
                  <motion.button
                    onClick={() => {
                      router.push(`/${organization?.slug || ''}/business-panel/dashboard`);
                      onClose();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                    style={{ color: colors.text }}
                    whileHover={{ x: 2, backgroundColor: hoverBackground }}
                  >
                    <LayoutDashboard className="h-4 w-4 opacity-70" />
                    <span className="block">{t('header.adminPanel')}</span>
                  </motion.button>
                )}

                {hasStudyPlan !== null && (
                  <motion.button
                    onClick={() => {
                      router.push(
                        buildStudyPlannerEntryPath({
                          hasStudyPlan,
                          organizationSlug: organization?.slug,
                        }),
                      );
                      onClose();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                    style={{ color: colors.text }}
                    whileHover={{ x: 2, backgroundColor: hoverBackground }}
                  >
                    {hasStudyPlan ? <CalendarDays className="h-4 w-4 opacity-70" /> : <CalendarPlus className="h-4 w-4 opacity-70" />}
                    <span className="block">{hasStudyPlan ? t('header.myPlanner') : t('header.createStudyPlan')}</span>
                  </motion.button>
                )}

                <motion.button
                  onClick={() => {
                    router.push('/auth/select-organization');
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                  style={{ color: colors.text }}
                  whileHover={{ x: 2, backgroundColor: hoverBackground }}
                >
                  <Building2 className="h-4 w-4 opacity-70" />
                  <span>Mis organizaciones</span>
                </motion.button>

                <motion.button
                  onClick={() => {
                    onProfileClick();
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                  style={{ color: colors.text }}
                  whileHover={{ x: 2, backgroundColor: hoverBackground }}
                >
                  <User className="h-4 w-4 opacity-70" />
                  <span>{t('header.editProfile')}</span>
                </motion.button>



                <div className="relative">
                  <motion.button
                    onClick={(event) => {
                      event.stopPropagation();
                      setActiveSubmenu(activeSubmenu === 'language' ? null : 'language');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                    style={{ color: colors.text }}
                    whileHover={{ x: 2, backgroundColor: hoverBackground }}
                  >
                    <Globe className="h-4 w-4 opacity-70" />
                    <span className="flex-1 text-left">{t('header.language')}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs opacity-70">{language.toUpperCase()}</span>
                      <ChevronRight
                        className={`h-3.5 w-3.5 opacity-70 transition-transform ${activeSubmenu === 'language' ? 'rotate-90' : ''}`}
                      />
                    </div>
                  </motion.button>

                  <AnimatePresence>
                    {activeSubmenu === 'language' && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                        style={{ backgroundColor: colors.isLightMode ? 'rgba(0, 0, 0, 0.05)' : 'rgba(0, 0, 0, 0.2)' }}
                      >
                        {LANGUAGE_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setLanguage(option.value);
                              setActiveSubmenu(null);
                            }}
                            className="w-full flex items-center gap-3 px-10 py-2 text-xs transition-colors"
                            style={{ color: language === option.value ? colors.accent : colors.text }}
                            onMouseEnter={(event) => {
                              event.currentTarget.style.backgroundColor = hoverBackground;
                            }}
                            onMouseLeave={(event) => {
                              event.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            <span>{option.label}</span>
                            {language === option.value && <Check className="h-3 w-3 ml-auto" />}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="relative">
                  <motion.button
                    onClick={(event) => {
                      event.stopPropagation();
                      setActiveSubmenu(activeSubmenu === 'theme' ? null : 'theme');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                    style={{ color: colors.text }}
                    whileHover={{ x: 2, backgroundColor: hoverBackground }}
                  >
                    {resolvedTheme === 'dark' ? <Moon className="h-4 w-4 opacity-70" /> : <Sun className="h-4 w-4 opacity-70" />}
                    <span className="flex-1 text-left">Tema</span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs opacity-70">
                        {theme === 'light' ? 'Claro' : theme === 'dark' ? 'Oscuro' : 'Sistema'}
                      </span>
                      <ChevronRight
                        className={`h-3.5 w-3.5 opacity-70 transition-transform ${activeSubmenu === 'theme' ? 'rotate-90' : ''}`}
                      />
                    </div>
                  </motion.button>

                  <AnimatePresence>
                    {activeSubmenu === 'theme' && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                        style={{ backgroundColor: colors.isLightMode ? 'rgba(0, 0, 0, 0.05)' : 'rgba(0, 0, 0, 0.2)' }}
                      >
                        {THEME_OPTIONS.map((option) => {
                          const ThemeIcon = option.icon;
                          return (
                            <button
                              key={option.value}
                              onClick={() => {
                                setTheme(option.value);
                                setActiveSubmenu(null);
                              }}
                              className="w-full flex items-center gap-3 px-10 py-2 text-xs transition-colors"
                              style={{ color: theme === option.value ? colors.accent : colors.text }}
                              onMouseEnter={(event) => {
                                event.currentTarget.style.backgroundColor = hoverBackground;
                              }}
                              onMouseLeave={(event) => {
                                event.currentTarget.style.backgroundColor = 'transparent';
                              }}
                            >
                              <ThemeIcon className="h-3.5 w-3.5" />
                              <span>{option.label}</span>
                              {theme === option.value && <Check className="h-3 w-3 ml-auto" />}
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="my-1 border-t" style={{ borderColor: colors.border }} />

                <motion.button
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  whileHover={{ x: 2 }}
                >
                  <LogOut className="h-4 w-4" />
                  <span>{t('header.logout')}</span>
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
