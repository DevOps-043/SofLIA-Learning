import Image from 'next/image'
import { Crown, Loader2, UserMinus, Users } from 'lucide-react'
import type { UserWithHierarchy } from '../../../types/hierarchy.types'
import styles from '../HierarchyExperience.module.css'

interface CurrentMembersListProps {
  currentMembers: UserWithHierarchy[]
  isRemoving: string | null
  onChangeRole: (userId: string, role: 'team_leader' | 'member') => void
  onRemoveMember: (userId: string) => void
}

export function CurrentMembersList({
  currentMembers,
  isRemoving,
  onChangeRole,
  onRemoveMember,
}: CurrentMembersListProps) {
  return (
    <section className={styles.membersManagerColumn}>
      <div className={styles.membersManagerHeading}>
        <div>
          <p className={styles.sectionKicker}>Equipo actual</p>
          <h3 className={styles.membersManagerTitle}>Miembros</h3>
        </div>
        <span className={styles.countBadge}>{currentMembers.length}</span>
      </div>

      <div className={styles.membersManagerList}>
        {currentMembers.length === 0 ? (
          <div className={styles.compactEmptyState}>
            <span className={styles.stateIcon}><Users aria-hidden="true" /></span>
            <strong>Aún no hay miembros</strong>
            <span>Agrega personas desde la lista disponible.</span>
          </div>
        ) : currentMembers.map((member) => {
          const isBusy = isRemoving === member.user_id
          const displayName = member.user?.display_name || member.user?.email || 'Miembro'
          return (
            <article key={member.id} className={styles.managerMemberRow}>
              <span className={styles.memberAvatar}>
                {member.user?.profile_picture_url ? (
                  <Image src={member.user.profile_picture_url} alt="" fill className={styles.memberAvatarImage} sizes="38px" />
                ) : (
                  displayName.charAt(0).toUpperCase()
                )}
              </span>
              <span className={styles.resultCopy}>
                <strong>{displayName}</strong>
                <span>{member.user?.email}</span>
              </span>
              <span className={styles.memberActions}>
                <span className={styles.roleToggle} aria-label={`Rol de ${displayName}`}>
                  <button
                    type="button"
                    data-active={(member.role || 'member') === 'member'}
                    onClick={() => onChangeRole(member.user_id, 'member')}
                    disabled={isBusy}
                  >
                    Miembro
                  </button>
                  <button
                    type="button"
                    data-active={member.role === 'team_leader'}
                    onClick={() => onChangeRole(member.user_id, 'team_leader')}
                    disabled={isBusy}
                    title="Líder"
                  >
                    <Crown aria-hidden="true" />
                  </button>
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveMember(member.user_id)}
                  disabled={isBusy}
                  className={styles.dangerIconButton}
                  aria-label={`Quitar a ${displayName}`}
                >
                  {isBusy ? <Loader2 className={styles.spin} aria-hidden="true" /> : <UserMinus aria-hidden="true" />}
                </button>
              </span>
            </article>
          )
        })}
      </div>
    </section>
  )
}
