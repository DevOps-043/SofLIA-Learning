import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { BadgeCheck, Building2, ChartNoAxesCombined, Check, Globe2, LayoutDashboard, Monitor, Moon, Sun, type LucideIcon } from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import { LanguageSubmenu } from './LanguageSubmenu'
import { MenuItem } from './MenuItem'
import type { useUserDropdownLogic } from './useUserDropdownLogic'
import styles from './UserDropdown.module.css'

type UserDropdownLogic = ReturnType<typeof useUserDropdownLogic>

const MOBILE_LANGUAGE_OPTIONS = [
  { value: 'es' as const, labelKey: 'menu.languages.es', shortLabel: 'ES' },
  { value: 'en' as const, labelKey: 'menu.languages.en', shortLabel: 'EN' },
  { value: 'pt' as const, labelKey: 'menu.languages.pt', shortLabel: 'PT' },
]

const MOBILE_THEME_OPTIONS = [
  { value: 'light' as const, labelKey: 'menu.theme.light', icon: Sun },
  { value: 'dark' as const, labelKey: 'menu.theme.dark', icon: Moon },
  { value: 'system' as const, labelKey: 'menu.theme.system', icon: Monitor },
]

export function UserDropdownMenuItems({ logic }: { logic: UserDropdownLogic }) {
  const businessPanelPath = logic.currentOrganization?.slug
    ? `/${logic.currentOrganization.slug}/business-panel`
    : null
  const { canSwitch } = logic

  const hasPanelSwitcher = useMemo(() => {
    let count = 0
    if (logic.isAdmin) count++
    if (logic.isInstructor) count++
    if ((logic.isOrgAdmin || logic.isAdmin) && logic.currentOrganization) count++
    count++ // user panel is always included
    return count > 1
  }, [logic.isAdmin, logic.isInstructor, logic.isOrgAdmin, logic.currentOrganization])

  return (
    <div className={cn(styles.menuItems, logic.isMobileViewport && styles.menuItemsMobile)}>
      <div>
      {!hasPanelSwitcher && (
        <MenuItem icon={LayoutDashboard} label={logic.t('menu.userPanel')} onClick={logic.handleUserDashboardNavigation} />
      )}
      {!hasPanelSwitcher && logic.isAdmin && (
        <MenuItem icon={LayoutDashboard} label={logic.t('menu.adminPanel')} onClick={() => logic.handleNavigation('/admin/dashboard')} />
      )}
      {!hasPanelSwitcher && logic.isInstructor && (
        <MenuItem icon={LayoutDashboard} label={logic.t('menu.instructorPanel')} onClick={() => logic.handleNavigation('/instructor/dashboard')} />
      )}
      {!hasPanelSwitcher && (logic.isOrgAdmin || logic.isAdmin) && businessPanelPath && (
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
          icon={BadgeCheck}
          label={logic.t('menu.certificates')}
          onClick={logic.handleCertificatesClick}
          rightElement={logic.certificatesCount > 0 ? (
            <span className={styles.countBadge}>
              {logic.certificatesCount}
            </span>
          ) : null}
        />
      )}
      {logic.showAnalyticsAction && (
        <MenuItem icon={ChartNoAxesCombined} label={logic.t('menu.stats')} onClick={logic.handleAnalyticsClick} />
      )}
      </div>
      {logic.isMobileViewport ? (
        <MobilePreferenceSections logic={logic} />
      ) : (
        <>
          <MenuItem
            icon={logic.resolvedTheme === 'dark' ? Sun : Moon}
            label={logic.isMounted ? (logic.resolvedTheme === 'dark' ? logic.t('menu.theme.light') : logic.t('menu.theme.dark')) : '...'}
            onClick={logic.toggleTheme}
          />
          <LanguageSubmenu
            activeSubmenu={logic.activeSubmenu}
            accentColor={logic.accentColor}
            isMounted={logic.isMounted}
            language={logic.language}
            setActiveSubmenu={logic.setActiveSubmenu}
            setLanguage={logic.setLanguage}
            t={logic.t}
          />
        </>
      )}
    </div>
  )
}

function MobilePreferenceSections({ logic }: { logic: UserDropdownLogic }) {
  return (
    <div className={styles.preferences}>
      <PreferenceGroup
        icon={logic.resolvedTheme === 'dark' ? Moon : Sun}
        title={logic.t('profileDropdown.theme')}
      >
        <div className={styles.preferenceGrid}>
          {MOBILE_THEME_OPTIONS.map((option) => {
            const Icon = option.icon
            const isActive = logic.theme === option.value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => logic.setTheme(option.value)}
                aria-pressed={isActive}
                className={cn(
                  styles.preferenceButton,
                  isActive && styles.preferenceButtonActive,
                )}
              >
                <Icon
                  className="h-4 w-4 shrink-0"
                />
                <span className={styles.preferenceOptionLabel}>{logic.t(option.labelKey)}</span>
                {isActive && <Check className="h-3 w-3 shrink-0" />}
              </button>
            )
          })}
        </div>
      </PreferenceGroup>

      <PreferenceGroup icon={Globe2} title={logic.t('menu.languages.title')}>
        <div className={styles.preferenceGrid}>
          {MOBILE_LANGUAGE_OPTIONS.map((option) => {
            const isActive = logic.language === option.value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => logic.setLanguage(option.value)}
                aria-pressed={isActive}
                className={cn(
                  styles.preferenceButton,
                  isActive && styles.preferenceButtonActive,
                )}
              >
                <span className="text-sm font-bold">
                  {option.shortLabel}
                </span>
                <span className={styles.preferenceOptionLabel}>{logic.t(option.labelKey)}</span>
                {isActive && <Check className="h-3 w-3 shrink-0" />}
              </button>
            )
          })}
        </div>
      </PreferenceGroup>
    </div>
  )
}

function PreferenceGroup({
  children,
  icon: Icon,
  title,
}: {
  children: ReactNode
  icon: LucideIcon
  title: string
}) {
  return (
    <section className={styles.preferenceGroup}>
      <div className={styles.preferenceTitle}>
        <Icon className="h-3.5 w-3.5" />
        <span>{title}</span>
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  )
}
