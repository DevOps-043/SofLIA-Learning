import type { BusinessUser } from '../../services/businessUsers.service'
import { UserCard } from './UserCard'
import type { BusinessAssignmentComponentProps } from './types'

export function UserGrid({
  alreadyAssignedUserIds,
  handleToggleUser,
  selectedUserIds,
  t,
  theme,
  users,
}: BusinessAssignmentComponentProps & {
  alreadyAssignedUserIds: Set<string>
  handleToggleUser: (userId: string) => void
  selectedUserIds: Set<string>
  users: BusinessUser[]
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {users.map((user) => (
        <UserCard
          key={user.id}
          alreadyAssignedUserIds={alreadyAssignedUserIds}
          handleToggleUser={handleToggleUser}
          selectedUserIds={selectedUserIds}
          t={t}
          theme={theme}
          user={user}
        />
      ))}
    </div>
  )
}
