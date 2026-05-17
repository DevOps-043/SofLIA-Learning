'use client'

import { PersonalizationEmptyState } from './personalization-tab/PersonalizationEmptyState'
import { PersonalizationInfoBox } from './personalization-tab/PersonalizationInfoBox'
import { PersonalizationSaveAlerts } from './personalization-tab/PersonalizationSaveAlerts'
import { PersonalizationSectionHeader } from './personalization-tab/PersonalizationSectionHeader'
import { SlugSettingsCard } from './personalization-tab/SlugSettingsCard'
import { SSOSettingsCard } from './personalization-tab/SSOSettingsCard'
import { AccessLinksCard } from './personalization-tab/AccessLinksCard'
import type { PersonalizationTabProps } from './personalization-tab/personalization.types'
import { usePersonalizationTabState } from './personalization-tab/usePersonalizationTabState'

export function PersonalizationTab(props: PersonalizationTabProps) {
  const { organization, saveError, saveSuccess } = props
  const state = usePersonalizationTabState(props)

  if (!organization) return <PersonalizationEmptyState />

  return (
    <div className="space-y-8">
      <PersonalizationSectionHeader />
      <SlugSettingsCard organization={organization} state={state} />
      {organization.slug && <AccessLinksCard state={state} />}
      <SSOSettingsCard organization={organization} state={state} />
      <PersonalizationInfoBox />
      <PersonalizationSaveAlerts saveError={saveError} saveSuccess={saveSuccess} />
    </div>
  )
}
