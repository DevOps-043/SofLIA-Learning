'use client'

import { ToastNotification } from '@/core/components/ToastNotification/ToastNotification'
import { PersonalizationEmptyState } from './personalization-tab/PersonalizationEmptyState'
import { PersonalizationInfoBox } from './personalization-tab/PersonalizationInfoBox'
import { PersonalizationSectionHeader } from './personalization-tab/PersonalizationSectionHeader'
import { SlugSettingsCard } from './personalization-tab/SlugSettingsCard'
import { SSOSettingsCard } from './personalization-tab/SSOSettingsCard'
import { AccessLinksCard } from './personalization-tab/AccessLinksCard'
import type { PersonalizationTabProps } from './personalization-tab/personalization.types'
import { usePersonalizationTabState } from './personalization-tab/usePersonalizationTabState'

export function PersonalizationTab(props: PersonalizationTabProps) {
  const { organization } = props
  const state = usePersonalizationTabState(props)

  if (!organization) return <PersonalizationEmptyState />

  return (
    <>
    <div className="space-y-8">
      <PersonalizationSectionHeader />
      <SlugSettingsCard organization={organization} state={state} />
      {organization.slug && <AccessLinksCard state={state} />}
      <SSOSettingsCard organization={organization} state={state} />
      <PersonalizationInfoBox />
    </div>
    <ToastNotification
      isOpen={state.toast.isOpen}
      onClose={state.hideToast}
      message={state.toast.message}
      type={state.toast.type}
      position="top-right"
    />
    </>
  )
}
