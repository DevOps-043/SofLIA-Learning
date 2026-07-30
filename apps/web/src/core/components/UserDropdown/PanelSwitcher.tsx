import { BriefcaseBusiness, GraduationCap, LayoutDashboard, ShieldCheck, type LucideIcon } from 'lucide-react'
import { useMemo } from 'react'
import { cn } from '@/shared/utils/cn'
import type { useUserDropdownLogic } from './useUserDropdownLogic'
import styles from './UserDropdown.module.css'

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
  accentColor: string
}

function PanelSwitcherGrid({ items, label, accentColor }: PanelSwitcherProps) {
  const gridClassName = items.length === 3 ? styles.panelGridThree : styles.panelGridTwo

  return (
    <section className={styles.panelSection}>
      <p className={styles.panelLabel}>
        {label}
      </p>
      <div className={cn(styles.panelGrid, gridClassName)}>
        {items.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              type="button"
              aria-current={item.isActive ? 'page' : undefined}
              onClick={item.onClick}
              className={cn(
                styles.panelButton,
                item.isActive && styles.panelButtonActive,
              )}
            >
              <Icon
                className={styles.panelIcon}
                style={item.isActive ? { color: accentColor } : undefined}
              />
              <span className={styles.panelButtonLabel}>{item.label}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

export function UserDropdownPanelSwitcher({ logic }: { logic: UserDropdownLogic }) {
  const { accentColor, currentOrganization, handleNavigation, isAdmin, isInstructor, isOrgAdmin, pathname, t } = logic

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

    if ((isOrgAdmin || isAdmin) && currentOrganization) {
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

  return <PanelSwitcherGrid items={panelLinks} label={t('profileDropdown.panels.title')} accentColor={accentColor} />
}
