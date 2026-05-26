import { BriefcaseBusiness, GraduationCap, LayoutDashboard, ShieldCheck, type LucideIcon } from 'lucide-react'
import { useMemo } from 'react'
import { cn } from '@/shared/utils/cn'
import type { useUserDropdownLogic } from './useUserDropdownLogic'

type UserDropdownLogic = ReturnType<typeof useUserDropdownLogic>

interface PanelSwitcherItem {
  id: string
  icon: LucideIcon
  label: string
  isActive: boolean
  onClick: () => void
}

interface PanelSwitcherProps {
  items: PanelSwitcherItem[]
  label: string
}

function PanelSwitcherGrid({ items, label }: PanelSwitcherProps) {
  const gridClassName = items.length >= 4 ? 'grid-cols-2' : items.length === 3 ? 'grid-cols-3' : 'grid-cols-2'

  return (
    <div className="border-b border-gray-200 px-3.5 py-2.5 dark:border-white/5">
      <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <div className={cn('grid gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-900/70', gridClassName)}>
        {items.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              type="button"
              aria-current={item.isActive ? 'page' : undefined}
              onClick={item.onClick}
              className={cn(
                'flex min-h-10 min-w-0 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/20',
                item.isActive
                  ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200 dark:bg-white/10 dark:text-white dark:ring-white/10'
                  : 'text-gray-600 hover:bg-white/70 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white',
              )}
            >
              <Icon className={cn('h-3.5 w-3.5 shrink-0', item.isActive ? 'text-emerald-500' : 'text-gray-400')} />
              <span className="min-w-0 truncate">{item.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function UserDropdownPanelSwitcher({ logic }: { logic: UserDropdownLogic }) {
  const { currentOrganization, handleNavigation, isAdmin, isInstructor, isOrgAdmin, pathname, t } = logic

  const panelLinks = useMemo<PanelSwitcherItem[]>(() => {
    const links: PanelSwitcherItem[] = []

    if (isAdmin) {
      links.push({
        id: 'admin',
        icon: ShieldCheck,
        label: t('profileDropdown.panels.admin'),
        isActive: pathname?.startsWith('/admin') ?? false,
        onClick: () => handleNavigation('/admin/dashboard'),
      })
    }

    if (isInstructor) {
      links.push({
        id: 'instructor',
        icon: GraduationCap,
        label: t('profileDropdown.panels.instructor'),
        isActive: pathname?.startsWith('/instructor') ?? false,
        onClick: () => handleNavigation('/instructor/dashboard'),
      })
    }

    if (isOrgAdmin && currentOrganization) {
      links.push({
        id: 'business',
        icon: BriefcaseBusiness,
        label: t('profileDropdown.panels.business'),
        isActive: pathname?.startsWith(`/${currentOrganization.slug}/business-panel`) ?? false,
        onClick: () => handleNavigation(`/${currentOrganization.slug}/business-panel`),
      })
    }

    links.push({
      id: 'user',
      icon: LayoutDashboard,
      label: t('profileDropdown.panels.user'),
      isActive: currentOrganization?.slug
        ? pathname?.startsWith(`/${currentOrganization.slug}/business-user`) ?? false
        : pathname === '/dashboard',
      onClick: logic.handleUserDashboardNavigation,
    })

    return links
  }, [currentOrganization, handleNavigation, isAdmin, isInstructor, isOrgAdmin, pathname, t, logic.handleUserDashboardNavigation])

  if (panelLinks.length <= 1) return null

  return <PanelSwitcherGrid items={panelLinks} label={t('profileDropdown.panels.title')} />
}
