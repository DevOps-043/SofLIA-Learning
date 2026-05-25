import { Suspense } from 'react'

import { ModernNavbar } from './dynamic-components'
import type { BusinessUserDashboardShellProps } from './types'

type DashboardNavbarProps = Pick<
  BusinessUserDashboardShellProps,
  | 'disableHeavyEffects'
  | 'displayName'
  | 'handleAnalyticsClick'
  | 'handleCertificatesClick'
  | 'handleLogout'
  | 'handleProfileClick'
  | 'initials'
  | 'organization'
  | 'orgColors'
  | 'orgRole'
  | 'stats'
  | 'user'
  | 'userDashboardStyles'
>

export function DashboardNavbar(props: DashboardNavbarProps) {
  const { disableHeavyEffects, displayName, initials, orgColors, stats } = props

  return (
    <Suspense
      fallback={
        <nav
          className={`sticky top-0 z-50 h-16 w-full ${disableHeavyEffects ? '' : 'backdrop-blur-xl'}`}
          style={{
            backgroundColor: orgColors.sidebarBg,
            borderBottom: `1px solid ${orgColors.border}`,
          }}
        />
      }
    >
      <ModernNavbar
        organization={props.organization}
        user={props.user}
        orgRole={props.orgRole}
        getDisplayName={() => displayName}
        getInitials={() => initials}
        onProfileClick={props.handleProfileClick}
        onLogout={props.handleLogout}
        styles={props.userDashboardStyles}
        disableHeavyEffects={disableHeavyEffects}
        onCertificatesClick={stats.certificates > 0 ? props.handleCertificatesClick : undefined}
        onAnalyticsClick={props.handleAnalyticsClick}
        certificatesCount={stats.certificates}
      />
    </Suspense>
  )
}
