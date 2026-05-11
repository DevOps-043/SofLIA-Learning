'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useOrganizationStore } from '../../core/stores/organizationStore'
import { ProfilePageContent } from '../../features/profile/components/profile-page/ProfilePageContent'
import { ProfileErrorState, ProfileLoadingState } from '../../features/profile/components/profile-page/ProfilePageStates'
import { useProfilePageLogic } from '../../features/profile/hooks/useProfilePageLogic'

export default function ProfilePage() {
  const router = useRouter()
  const currentOrg = useOrganizationStore((state) => state.currentOrganization)

  // If the user belongs to an org, redirect to the org-scoped profile so
  // the organization context (org ID, job_title, job_description) is unambiguous.
  useEffect(() => {
    if (currentOrg?.slug) {
      router.replace(`/${currentOrg.slug}/profile`)
    }
  }, [currentOrg?.slug, router])

  const logic = useProfilePageLogic()

  // Show loader while redirect is in progress
  if (currentOrg?.slug) {
    return <ProfileLoadingState colors={logic.colors} />
  }

  if (logic.loading) {
    return <ProfileLoadingState colors={logic.colors} />
  }

  if (!logic.profile) {
    return <ProfileErrorState colors={logic.colors} retryLoad={logic.retryLoad} goToLogin={logic.goToLogin} />
  }

  return <ProfilePageContent {...logic} />
}
