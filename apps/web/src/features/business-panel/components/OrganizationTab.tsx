'use client'

import { useBusinessPanelTheme } from '../hooks/useBusinessPanelTheme'
import { useOrgFormState } from './useOrgFormState'
import { OrganizationBasicInfoSection } from './OrganizationTab/OrganizationBasicInfoSection'
import { OrganizationContactSection } from './OrganizationTab/OrganizationContactSection'
import { OrganizationEmptyState } from './OrganizationTab/OrganizationEmptyState'
import { OrganizationFormActions } from './OrganizationTab/OrganizationFormActions'
import { OrganizationMediaSection } from './OrganizationTab/OrganizationMediaSection'
import { OrganizationSofliaContextSection } from './OrganizationTab/OrganizationSofliaContextSection'
import { OrganizationStatusAlerts } from './OrganizationTab/OrganizationStatusAlerts'
import type { OrganizationTabProps, OrganizationTabStyles } from './OrganizationTab/types'

export function OrganizationTab(props: OrganizationTabProps) {
  const theme = useBusinessPanelTheme()
  const formState = useOrgFormState(props)

  if (!props.organization) return <OrganizationEmptyState theme={theme} />

  const styles: OrganizationTabStyles = {
    cardStyle: { backgroundColor: theme.cardBg, borderColor: theme.borderColor },
    inputStyle: { backgroundColor: theme.inputBg, borderColor: theme.borderColor, color: theme.textColor },
    labelStyle: { color: theme.textColor },
    helpStyle: { color: theme.subtextColor },
    mutedStyle: { color: theme.mutedTextColor },
  }

  return (
    <form onSubmit={formState.handleSubmit} className="space-y-8">
      <OrganizationMediaSection formState={formState} styles={styles} theme={theme} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <OrganizationBasicInfoSection formState={formState} styles={styles} theme={theme} />
        <OrganizationContactSection formState={formState} styles={styles} theme={theme} />
      </div>
      <OrganizationSofliaContextSection formState={formState} styles={styles} theme={theme} />
      <OrganizationStatusAlerts saveError={props.saveError} saveSuccess={props.saveSuccess} theme={theme} />
      <OrganizationFormActions formState={formState} theme={theme} />
    </form>
  )
}
