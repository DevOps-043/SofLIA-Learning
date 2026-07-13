import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronRight } from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import type { Organization } from '../../hooks/useOrganization'
import { resolveOrganizationBrandColors } from '../../theme/organization-brand-colors'
import type { useUserDropdownLogic } from './useUserDropdownLogic'

type UserDropdownLogic = ReturnType<typeof useUserDropdownLogic>

interface UserDropdownOrgSectionProps {
  logic: UserDropdownLogic
}

function OrganizationMark({ organization }: { organization: Organization }) {
  const logoUrl = organization.brandLogoUrl || organization.logoUrl
  const { primaryColor: brandColor } = resolveOrganizationBrandColors(organization)
  const label = organization.name?.trim() || organization.slug?.trim() || organization.id?.trim() || 'O'

  if (logoUrl) {
    return (
      <span className="h-7 w-7 shrink-0 overflow-hidden rounded-lg bg-gray-100 ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-white/10">
        <img src={logoUrl} alt="" className="h-full w-full object-cover" />
      </span>
    )
  }

  return (
    <span
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white shadow-sm"
      style={{ background: `linear-gradient(135deg, ${brandColor}, var(--color-accent))` }}
      aria-hidden="true"
    >
      {label.charAt(0).toUpperCase()}
    </span>
  )
}

export function UserDropdownOrgSection({ logic }: UserDropdownOrgSectionProps) {
  const { currentOrganization, canSwitch, organizations, isOrgSwitcherOpen, setIsOrgSwitcherOpen, setActiveSubmenu, handleOrganizationSwitch, t } = logic

  if (!currentOrganization) return null

  const getOrgDisplayName = (org: Organization) =>
    org.name?.trim() || org.slug?.trim() || org.id?.trim() || t('profileDropdown.organizations')

  const getOrgRoleLabel = (role?: Organization['role']) =>
    role ? t(`profileDropdown.orgRoles.${role}`) : t('profileDropdown.orgRoles.member')

  return (
    <div className="border-b border-gray-200 px-3 py-2 dark:border-white/5">
      <div className="rounded-xl border border-gray-200 bg-gray-50/90 p-2 dark:border-white/10 dark:bg-white/5">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <OrganizationMark organization={currentOrganization} />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-gray-900 dark:text-white">
                {getOrgDisplayName(currentOrganization)}
              </p>
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                {getOrgRoleLabel(currentOrganization.role)}
              </p>
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-300">
            {t('profileDropdown.currentOrganization')}
          </span>
        </div>

        {canSwitch && organizations.length > 1 && (
          <div className="space-y-1">
            <p className="px-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {t('profileDropdown.quickSwitch')}
            </p>
            <button
              type="button"
              aria-expanded={isOrgSwitcherOpen}
              onClick={() => { setIsOrgSwitcherOpen(!isOrgSwitcherOpen); setActiveSubmenu(null) }}
              className="flex h-8 w-full items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-2.5 text-left text-xs font-semibold text-gray-800 shadow-sm transition-colors hover:border-emerald-300 hover:bg-emerald-50/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/15 dark:border-white/10 dark:bg-gray-900/80 dark:text-white dark:hover:border-emerald-500/50 dark:hover:bg-emerald-500/10"
            >
              <span className="min-w-0 flex-1 truncate">{getOrgDisplayName(currentOrganization)}</span>
              <ChevronRight className={cn('h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform', isOrgSwitcherOpen ? '-rotate-90' : 'rotate-90')} />
            </button>

            <AnimatePresence initial={false}>
              {isOrgSwitcherOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-gray-900"
                >
                  {organizations.map((org) => {
                    const isActive = org.id === currentOrganization.id
                    return (
                      <button
                        key={org.id}
                        type="button"
                        onClick={() => handleOrganizationSwitch(org.slug)}
                        className={cn(
                          'flex w-full items-center gap-2 px-2.5 py-2 text-left transition-colors',
                          isActive
                            ? 'bg-emerald-50 text-gray-900 dark:bg-emerald-500/10 dark:text-white'
                            : 'text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/5',
                        )}
                      >
                        <OrganizationMark organization={org} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-semibold">{getOrgDisplayName(org)}</span>
                          <span className="block truncate text-[11px] text-gray-500 dark:text-gray-400">{getOrgRoleLabel(org.role)}</span>
                        </span>
                        {isActive && <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" />}
                      </button>
                    )
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
