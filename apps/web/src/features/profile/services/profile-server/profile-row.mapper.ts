import { mapUserProfileRow } from '../profile.shared'
import type { ProfileMembership } from './profile-server.types'

type UserProfileRowInput = Parameters<typeof mapUserProfileRow>[0]

export function mapProfileWithMembership(
  profile: UserProfileRowInput,
  membership: Pick<ProfileMembership, 'job_title' | 'job_description'> | null,
) {
  return mapUserProfileRow({
    ...profile,
    job_title: membership?.job_title ?? null,
    job_description: membership?.job_description ?? null,
  })
}
