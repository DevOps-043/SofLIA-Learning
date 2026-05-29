import { useMemo } from 'react'
import { Award, BarChart2, Building2, LayoutDashboard, Moon, Sun, User } from 'lucide-react'
import { LanguageSubmenu } from './LanguageSubmenu'
import { MenuItem } from './MenuItem'
import type { useUserDropdownLogic } from './useUserDropdownLogic'

type UserDropdownLogic = ReturnType<typeof useUserDropdownLogic>

export function UserDropdownMenuItems({ logic }: { logic: UserDropdownLogic }) {
  const businessPanelPath = logic.currentOrganization?.slug
    ? `/${logic.currentOrganization.slug}/business-panel`
    : null
  const { canSwitch } = logic

  const hasPanelSwitcher = useMemo(() => {
    let count = 0
    if (logic.isAdmin) count++
    if (logic.isInstructor) count++
    if (logic.isOrgAdmin && logic.currentOrganization) count++
    count++ // user panel is always included
    return count > 1
  }, [logic.isAdmin, logic.isInstructor, logic.isOrgAdmin, logic.currentOrganization])

  return (
    <div className="py-1 space-y-0.5">
      {!hasPanelSwitcher && (
        <MenuItem icon={LayoutDashboard} label={logic.t('menu.userPanel')} onClick={logic.handleUserDashboardNavigation} />
      )}
      {!hasPanelSwitcher && logic.isAdmin && (
        <MenuItem icon={LayoutDashboard} label={logic.t('menu.adminPanel')} onClick={() => logic.handleNavigation('/admin/dashboard')} />
      )}
      {!hasPanelSwitcher && logic.isInstructor && (
        <MenuItem icon={LayoutDashboard} label={logic.t('menu.instructorPanel')} onClick={() => logic.handleNavigation('/instructor/dashboard')} />
      )}
      {!hasPanelSwitcher && logic.isOrgAdmin && businessPanelPath && (
        <MenuItem icon={LayoutDashboard} label={logic.t('business:header.administratorRole')} onClick={() => logic.handleNavigation(businessPanelPath)} />
      )}
      {logic.isB2B && (
        <MenuItem
          icon={Building2}
          label={canSwitch ? logic.t('profileDropdown.viewAllOrganizations') : logic.t('profileDropdown.organizations')}
          onClick={() => logic.handleNavigation('/auth/select-organization')}
        />
      )}
      {logic.showCertificatesAction && (
        <MenuItem
          icon={Award}
          label={logic.t('menu.certificates')}
          onClick={logic.handleCertificatesClick}
          rightElement={logic.certificatesCount > 0 ? (
            <span className="rounded-full bg-accent/10 px-1.5 py-0.5 text-[10px] font-bold text-accent">
              {logic.certificatesCount}
            </span>
          ) : null}
        />
      )}
      {logic.showAnalyticsAction && (
        <MenuItem icon={BarChart2} label={logic.t('menu.stats')} onClick={logic.handleAnalyticsClick} />
      )}
      <MenuItem icon={User} label={logic.t('menu.profile')} onClick={logic.handleProfileClick} />
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
