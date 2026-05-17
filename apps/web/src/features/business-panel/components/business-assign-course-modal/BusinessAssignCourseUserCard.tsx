import { motion } from 'framer-motion';
import { Check, UserCheck, X } from 'lucide-react';
import type { BusinessUser } from '../../services/businessUsers.service';
import { getBusinessAssignCourseDisplayName } from './service';
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
      className={`group relative p-4 rounded-[1.8rem] text-left transition-all border flex items-center gap-4 ${isSelected || isPendingRemoval ? 'scale-[1.02] shadow-xl' : !isLockedAssigned ? 'hover:border-white/20' : ''}`}
      style={{
        backgroundColor: isPendingRemoval ? `${theme.dangerColor}12` : isSelected ? `${theme.primaryColor}15` : theme.inputBg,
        borderColor: isPendingRemoval ? theme.dangerColor : isSelected ? theme.primaryColor : theme.borderColor,
        cursor: isLockedAssigned ? 'not-allowed' : 'pointer',
        opacity: isLockedAssigned ? 0.45 : 1,
      }}
    >
      <UserAvatar displayName={displayName} isPendingRemoval={isPendingRemoval} isSelected={isSelected} theme={theme} user={user} />
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-bold truncate" style={{ color: isPendingRemoval ? theme.dangerColor : theme.textColor }}>{displayName}</h4>
        <p className="text-[10px] font-medium opacity-40 truncate">{user.email}</p>
      </div>
      <UserAssignmentBadge isAlreadyAssigned={isAlreadyAssigned} isDirect={isDirect} isPendingRemoval={isPendingRemoval} sourceLabel={sourceLabel} theme={theme} />
    </motion.button>
  );
}

function UserAvatar({ displayName, isPendingRemoval, isSelected, theme, user }: { displayName: string; isPendingRemoval: boolean; isSelected: boolean; theme: BusinessAssignCourseTheme; user: BusinessUser }) {
  return (
    <div className="relative shrink-0">
      {user.profile_picture_url ? (
        <div className="w-12 h-12 rounded-2xl overflow-hidden border border-white/5"><img src={user.profile_picture_url} alt={displayName} className="w-full h-full object-cover" /></div>
      ) : (
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black" style={{ backgroundColor: isPendingRemoval ? theme.dangerColor : theme.primaryColor, color: theme.onPrimaryColor }}>{displayName[0].toUpperCase()}</div>
      )}
      {isSelected && <div className="absolute -top-1 -right-1 w-5 h-5 rounded-lg flex items-center justify-center shadow-lg" style={{ backgroundColor: theme.primaryColor }}><Check className="w-3 h-3" style={{ color: theme.onPrimaryColor }} strokeWidth={4} /></div>}
      {isPendingRemoval && <div className="absolute -top-1 -right-1 w-5 h-5 rounded-lg flex items-center justify-center shadow-lg" style={{ backgroundColor: theme.dangerColor }}><X className="w-3 h-3 text-white" strokeWidth={3} /></div>}
    </div>
  );
}

function UserAssignmentBadge({ isAlreadyAssigned, isDirect, isPendingRemoval, sourceLabel, theme }: { isAlreadyAssigned: boolean; isDirect: boolean; isPendingRemoval: boolean; sourceLabel: string | null; theme: BusinessAssignCourseTheme }) {
  if (isPendingRemoval) return <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-lg" style={{ backgroundColor: `${theme.dangerColor}18` }}><X className="w-3 h-3" style={{ color: theme.dangerColor }} /><span className="text-[8px] font-bold uppercase tracking-widest" style={{ color: theme.dangerColor }}>Quitar</span></div>;
  if (!isAlreadyAssigned) return null;
  return <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ backgroundColor: isDirect ? `${theme.dangerColor}10` : `${theme.accentColor}15` }}><UserCheck className="w-3 h-3" style={{ color: isDirect ? theme.dangerColor : theme.accentColor }} /><span className="text-[8px] font-bold uppercase tracking-widest max-w-[120px] truncate" style={{ color: isDirect ? theme.dangerColor : theme.accentColor }}>{isDirect ? 'Click para quitar' : sourceLabel ?? 'Asignado'}</span></div>;
}

function getSourceLabel(sourceInfo?: AssignedUserSourceInfo) {
  if (sourceInfo?.source === 'learning_path') return `Ruta: ${sourceInfo.learning_path_title ?? 'Ruta de aprendizaje'}`;
  if (sourceInfo?.source === 'team') return `Equipo: ${sourceInfo.team_name ?? 'Equipo'}`;
  return null;
}
