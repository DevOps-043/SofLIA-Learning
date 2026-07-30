import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronRight } from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import type { Organization } from '../../hooks/useOrganization'
import { resolveOrganizationBrandColors } from '../../theme/organization-brand-colors'
import type { useUserDropdownLogic } from './useUserDropdownLogic'
import styles from './UserDropdown.module.css'

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
      <span className={styles.orgMark}>
        <img src={logoUrl} alt="" className={styles.orgMarkImage} />
      </span>
    )
  }

  return (
    <span
      className={styles.orgMark}
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
    <section className={styles.orgSection}>
      <div className={styles.orgCard}>
        <div className={styles.orgHeader}>
          <div className={styles.orgIdentity}>
            <OrganizationMark organization={currentOrganization} />
            <div className={styles.orgCopy}>
              <p className={styles.orgName}>
                {getOrgDisplayName(currentOrganization)}
              </p>
              <p className={styles.orgRole}>
                {getOrgRoleLabel(currentOrganization.role)}
              </p>
            </div>
          </div>
          <span className={styles.currentBadge}>
            {t('profileDropdown.currentOrganization')}
          </span>
        </div>

        {canSwitch && organizations.length > 1 && (
          <div className={styles.switcher}>
            <p className={styles.microLabel}>
              {t('profileDropdown.quickSwitch')}
            </p>
            <button
              type="button"
              aria-expanded={isOrgSwitcherOpen}
              onClick={() => { setIsOrgSwitcherOpen(!isOrgSwitcherOpen); setActiveSubmenu(null) }}
              className={styles.orgTrigger}
            >
              <span className={styles.orgTriggerLabel}>{getOrgDisplayName(currentOrganization)}</span>
              <ChevronRight className={cn(styles.orgChevron, isOrgSwitcherOpen && styles.orgChevronOpen)} />
            </button>

            <AnimatePresence initial={false}>
              {isOrgSwitcherOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className={styles.orgList}
                >
                  {organizations.map((org) => {
                    const isActive = org.id === currentOrganization.id
                    return (
                      <button
                        key={org.id}
                        type="button"
                        onClick={() => handleOrganizationSwitch(org.slug)}
                        className={cn(
                          styles.orgOption,
                          isActive && styles.orgOptionActive,
                        )}
                      >
                        <OrganizationMark organization={org} />
                        <span className={styles.orgCopy}>
                          <span className={styles.orgName}>{getOrgDisplayName(org)}</span>
                          <span className={styles.orgRole}>{getOrgRoleLabel(org.role)}</span>
                        </span>
                        {isActive && <Check className={styles.orgCheck} />}
                      </button>
                    )
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </section>
  )
}
