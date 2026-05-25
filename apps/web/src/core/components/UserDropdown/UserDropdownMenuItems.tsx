import { Award, BarChart3, Building2, GraduationCap, LayoutDashboard, Moon, ShieldCheck, Sun, User } from 'lucide-react'
import { LanguageSubmenu } from './LanguageSubmenu'
import { MenuItem } from './MenuItem'
import type { useUserDropdownLogic } from './useUserDropdownLogic'

type UserDropdownLogic = ReturnType<typeof useUserDropdownLogic>

export function UserDropdownMenuItems({ logic }: { logic: UserDropdownLogic }) {
  const businessPanelPath = logic.currentOrganization?.slug
    ? `/${logic.currentOrganization.slug}/business-panel`
    : null

  return (
    <div className="py-1.5 space-y-0.5">
      {logic.isAdmin && <MenuItem icon={ShieldCheck} label={logic.t('menu.adminPanel')} onClick={() => logic.handleNavigation('/admin/dashboard')} />}
      {logic.isInstructor && <MenuItem icon={GraduationCap} label={logic.t('menu.instructorPanel')} onClick={() => logic.handleNavigation('/instructor/dashboard')} />}
      {logic.isOrgAdmin && businessPanelPath && (
        <MenuItem icon={LayoutDashboard} label={logic.t('business:header.administratorRole')} onClick={() => logic.handleNavigation(businessPanelPath)} />
      )}
      <MenuItem icon={LayoutDashboard} label={logic.t('menu.userPanel')} onClick={logic.handleUserDashboardNavigation} />
      {logic.isB2B && <MenuItem icon={Building2} label={logic.t('profileDropdown.organizations')} onClick={() => logic.handleNavigation('/auth/select-organization')} />}
      {logic.userStatsPath && <MenuItem icon={BarChart3} label={logic.t('menu.stats')} onClick={() => logic.handleNavigation(logic.userStatsPath!)} />}
      <MenuItem icon={Award} label={logic.t('menu.certificates')} onClick={() => logic.handleNavigation('/certificates')} />
      <MenuItem icon={User} label={logic.t('menu.profile')} onClick={() => logic.handleNavigation(logic.profilePath)} />
      <MenuItem
        icon={logic.resolvedTheme === 'dark' ? Sun : Moon}
        label={logic.isMounted ? (logic.resolvedTheme === 'dark' ? logic.t('menu.theme.light') : logic.t('menu.theme.dark')) : '...'}
        onClick={logic.toggleTheme}
      />
      <LanguageSubmenu
        activeSubmenu={logic.activeSubmenu}
        isMounted={logic.isMounted}
        language={logic.language}
        setActiveSubmenu={logic.setActiveSubmenu}
        setLanguage={logic.setLanguage}
        t={logic.t}
      />
    </div>
  )
}
