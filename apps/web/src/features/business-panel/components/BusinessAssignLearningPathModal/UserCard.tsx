import { Check } from 'lucide-react'
import type { BusinessUser } from '../../services/businessUsers.service'
import type { BusinessPanelTheme, BusinessT } from './types'
import { getUserDisplayName } from './utils'
import modalStyles from '../ContentModal.module.css'

export function UserCard({ alreadyAssignedUserIds, handleToggleUser, selectedUserIds, t, user }: {
  alreadyAssignedUserIds: Set<string>
  handleToggleUser: (userId: string) => void
  selectedUserIds: Set<string>
  t: BusinessT
  theme: BusinessPanelTheme
  user: BusinessUser
}) {
  const isSelected = selectedUserIds.has(user.id)
  const isAlreadyAssigned = alreadyAssignedUserIds.has(user.id)
  const displayName = getUserDisplayName(user)

  return (
    <button
      className={`${modalStyles.userCard} ${isSelected ? modalStyles.userCardSelected : ''}`}
      disabled={isAlreadyAssigned}
      onClick={() => handleToggleUser(user.id)}
      type="button"
    >
      <div className={modalStyles.userAvatar}>
        {user.profile_picture_url ? <img alt="" src={user.profile_picture_url} /> : displayName.slice(0, 1).toUpperCase()}
      </div>
      <div className={modalStyles.userIdentity}>
        <strong>{displayName}</strong>
        <span>{user.email}</span>
      </div>
      {isSelected ? <span className={modalStyles.checkMark}><Check aria-hidden="true" /></span> : null}
      {isAlreadyAssigned ? <Badge label={t('assignLearningPath.alreadyAssigned', { defaultValue: 'Ya asignado' })} /> : user.job_title ? <Badge label={user.job_title} /> : null}
    </button>
  )
}

function Badge({ label }: { label: string }) {
  return <span className={modalStyles.badge}>{label}</span>
}
