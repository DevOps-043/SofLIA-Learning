import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { Award, BarChart2, Building2, Check, Globe, LayoutDashboard, Monitor, Moon, Sun, User, type LucideIcon } from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import { LanguageSubmenu } from './LanguageSubmenu'
import { MenuItem } from './MenuItem'
import type { useUserDropdownLogic } from './useUserDropdownLogic'

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
    <div className={cn('py-1 space-y-0.5', logic.isMobileViewport && 'flex h-full flex-col gap-2 px-2 py-2')}>
      <div className={cn(logic.isMobileViewport && 'space-y-0.5')}>
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
          icon={Award}
          label={logic.t('menu.certificates')}
          onClick={logic.handleCertificatesClick}
          rightElement={logic.certificatesCount > 0 ? (
            <span
              className="rounded-full px-1.5 py-0.5 text-[10px] font-bold"
              style={{
                backgroundColor: `color-mix(in srgb, ${logic.accentColor} 10%, transparent)`,
                color: logic.accentColor,
              }}
            >
              {logic.certificatesCount}
            </span>
          ) : null}
        />
      )}
      {logic.showAnalyticsAction && (
        <MenuItem icon={BarChart2} label={logic.t('menu.stats')} onClick={logic.handleAnalyticsClick} />
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
    <div className="grid flex-1 grid-rows-2 gap-2 pt-1">
      <PreferenceGroup
        icon={logic.resolvedTheme === 'dark' ? Moon : Sun}
        title={logic.t('profileDropdown.theme')}
      >
        <div className="grid h-full grid-cols-3 gap-2">
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
                  'flex min-w-0 flex-col items-center justify-center gap-1.5 rounded-xl border px-1.5 py-2 text-center text-[11px] font-semibold leading-tight transition-colors',
                  !isActive && 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10',
                )}
                style={isActive ? {
                  borderColor: `color-mix(in srgb, ${logic.accentColor} 30%, transparent)`,
                  backgroundColor: `color-mix(in srgb, ${logic.accentColor} 15%, transparent)`,
                  color: logic.accentColor,
                } : undefined}
              >
                <Icon
                  className={cn('h-4 w-4 shrink-0', !isActive && 'text-gray-400')}
                  style={isActive ? { color: logic.accentColor } : undefined}
                />
                <span className="max-w-full truncate">{logic.t(option.labelKey)}</span>
                {isActive && <Check className="h-3 w-3 shrink-0" />}
              </button>
            )
          })}
        </div>
      </PreferenceGroup>

      <PreferenceGroup icon={Globe} title={logic.t('menu.languages.title')}>
        <div className="grid h-full grid-cols-3 gap-2">
          {MOBILE_LANGUAGE_OPTIONS.map((option) => {
            const isActive = logic.language === option.value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => logic.setLanguage(option.value)}
                aria-pressed={isActive}
                className={cn(
                  'flex min-w-0 flex-col items-center justify-center gap-1.5 rounded-xl border px-1.5 py-2 text-center text-[11px] font-semibold leading-tight transition-colors',
                  !isActive && 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10',
                )}
                style={isActive ? {
                  borderColor: `color-mix(in srgb, ${logic.accentColor} 30%, transparent)`,
                  backgroundColor: `color-mix(in srgb, ${logic.accentColor} 15%, transparent)`,
                  color: logic.accentColor,
                } : undefined}
              >
                <span
                  className={cn('text-sm font-bold', !isActive && 'text-gray-500 dark:text-gray-300')}
                  style={isActive ? { color: logic.accentColor } : undefined}
                >
                  {option.shortLabel}
                </span>
                <span className="max-w-full truncate">{logic.t(option.labelKey)}</span>
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
    <section className="flex min-h-0 flex-col rounded-2xl border border-gray-200 bg-white p-2 dark:border-white/10 dark:bg-white/5">
      <div className="mb-2 flex items-center gap-2 px-1 text-xs font-semibold text-gray-600 dark:text-gray-300">
        <Icon className="h-3.5 w-3.5 text-gray-400" />
        <span>{title}</span>
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  )
}
