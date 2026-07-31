import { motion } from 'framer-motion';
import { Check, UserCheck, X } from 'lucide-react';
import type { BusinessUser } from '../../services/businessUsers.service';
import { getBusinessAssignCourseDisplayName } from './service';
import modalStyles from '../ContentModal.module.css';
import type { AssignedUserSourceInfo, BusinessAssignCourseModalState, BusinessAssignCourseTheme } from './view-types';

interface BusinessAssignCourseUserCardProps {
  index: number;
  modal: BusinessAssignCourseModalState;
  theme: BusinessAssignCourseTheme;
  user: BusinessUser;
}

export function BusinessAssignCourseUserCard({ index, modal, theme, user }: BusinessAssignCourseUserCardProps) {
  const sourceInfo = modal.assignedUserSources.get(user.id);
  const isAlreadyAssigned = modal.alreadyAssignedUserIds.has(user.id);
  const isDirect = sourceInfo?.source === 'direct';
  const isLockedAssigned = isAlreadyAssigned && !isDirect;
  const isSelected = modal.selectedUserIds.has(user.id);
  const isPendingRemoval = modal.pendingRemovalIds.has(user.id);
  const displayName = getBusinessAssignCourseDisplayName(user);
  const sourceLabel = getSourceLabel(sourceInfo);

  const handleClick = () => {
    if (isLockedAssigned) return;
    if (isDirect) modal.handleToggleRemoval(user.id);
    else modal.handleToggleUser(user.id);
  };

  return (
    <motion.button
      key={user.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
      onClick={handleClick}
      disabled={isLockedAssigned}
      title={isLockedAssigned && sourceLabel ? `No se puede remover aquí: ${sourceLabel}` : undefined}
      className={`${modalStyles.userCard} ${isSelected || isPendingRemoval ? modalStyles.userCardSelected : ''}`}
      style={{
        borderColor: isPendingRemoval ? theme.dangerColor : isSelected ? theme.primaryColor : theme.borderColor,
        cursor: isLockedAssigned ? 'not-allowed' : 'pointer',
        opacity: isLockedAssigned ? 0.45 : 1,
      }}
    >
      <UserAvatar displayName={displayName} isPendingRemoval={isPendingRemoval} isSelected={isSelected} theme={theme} user={user} />
      <div className={modalStyles.userIdentity}>
        <strong style={{ color: isPendingRemoval ? theme.dangerColor : undefined }}>{displayName}</strong>
        <span>{user.email}</span>
      </div>
      <UserAssignmentBadge isAlreadyAssigned={isAlreadyAssigned} isDirect={isDirect} isPendingRemoval={isPendingRemoval} sourceLabel={sourceLabel} theme={theme} />
    </motion.button>
  );
}

function UserAvatar({ displayName, isPendingRemoval, isSelected, theme, user }: { displayName: string; isPendingRemoval: boolean; isSelected: boolean; theme: BusinessAssignCourseTheme; user: BusinessUser }) {
  return (
    <div className={modalStyles.userAvatarWrap}>
      {user.profile_picture_url ? (
        <div className={modalStyles.userAvatar}><img src={user.profile_picture_url} alt={displayName} /></div>
      ) : (
        <div className={modalStyles.userAvatar} style={isPendingRemoval ? { backgroundColor: theme.dangerColor, color: theme.onPrimaryColor } : undefined}>{displayName[0].toUpperCase()}</div>
      )}
      {isSelected && <div className={modalStyles.checkMark}><Check aria-hidden="true" /></div>}
      {isPendingRemoval && <div className={modalStyles.checkMark} style={{ backgroundColor: theme.dangerColor }}><X aria-hidden="true" /></div>}
    </div>
  );
}

function UserAssignmentBadge({ isAlreadyAssigned, isDirect, isPendingRemoval, sourceLabel, theme }: { isAlreadyAssigned: boolean; isDirect: boolean; isPendingRemoval: boolean; sourceLabel: string | null; theme: BusinessAssignCourseTheme }) {
  if (isPendingRemoval) return <span className={modalStyles.badge} style={{ color: theme.dangerColor }}>Quitar</span>;
  if (!isAlreadyAssigned) return null;
  return <span className={modalStyles.badge} style={{ color: isDirect ? theme.dangerColor : theme.accentColor }}><UserCheck aria-hidden="true" className="mr-1 inline h-3 w-3" />{isDirect ? 'Click para quitar' : sourceLabel ?? 'Asignado'}</span>;
}

function getSourceLabel(sourceInfo?: AssignedUserSourceInfo) {
  if (sourceInfo?.source === 'learning_path') return `Ruta: ${sourceInfo.learning_path_title ?? 'Ruta de aprendizaje'}`;
  if (sourceInfo?.source === 'team') return `Equipo: ${sourceInfo.team_name ?? 'Equipo'}`;
  return null;
}
