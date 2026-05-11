'use client'

import { ProfilePageContent } from '../../../features/profile/components/profile-page/ProfilePageContent'
import { ProfileErrorState, ProfileLoadingState } from '../../../features/profile/components/profile-page/ProfilePageStates'
import { useProfilePageLogic } from '../../../features/profile/hooks/useProfilePageLogic'

export default function OrgProfilePage() {
  const logic = useProfilePageLogic()

  if (logic.loading) {
    return <ProfileLoadingState colors={logic.colors} />
  }

  if (!logic.profile) {
    return <ProfileErrorState colors={logic.colors} retryLoad={logic.retryLoad} goToLogin={logic.goToLogin} />
  }

  return <ProfilePageContent {...logic} />
}
