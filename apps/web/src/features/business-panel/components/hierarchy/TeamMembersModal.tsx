'use client'

import { motion } from 'framer-motion'
import { AvailableUsersList } from './TeamMembersModal/AvailableUsersList'
import { CurrentMembersList } from './TeamMembersModal/CurrentMembersList'
import { TeamMembersHeader } from './TeamMembersModal/Header'
import { TeamMembersMessages } from './TeamMembersModal/Messages'
import type { TeamMembersModalProps } from './TeamMembersModal/types'
import { useTeamMembersModalLogic } from './TeamMembersModal/useTeamMembersModalLogic'

export function TeamMembersModal(props: TeamMembersModalProps) {
  const { currentMembers, isOpen, onClose, onMembersUpdated, teamId, teamName } = props
  const logic = useTeamMembersModalLogic({ currentMembers, isOpen, onMembersUpdated, teamId })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-[#1E2329] rounded-2xl border border-gray-200 dark:border-white/10 w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl"
        style={{ backgroundColor: logic.theme.cardBackground }}
      >
        <TeamMembersHeader onClose={onClose} teamName={teamName} />
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CurrentMembersList
              currentMembers={currentMembers}
              isRemoving={logic.isRemoving}
              onChangeRole={logic.handleChangeRole}
              onRemoveMember={logic.handleRemoveMember}
            />
            <AvailableUsersList
              availableUsers={logic.availableUsers}
              isAssigning={logic.isAssigning}
              loadingUsers={logic.loadingUsers}
              onAddMembers={logic.handleAddMembers}
              onSelectAll={logic.handleSelectAll}
              onToggleUser={logic.toggleUser}
              searchTerm={logic.searchTerm}
              selectedUserIds={logic.selectedUserIds}
              setSearchTerm={logic.setSearchTerm}
              theme={logic.theme}
            />
          </div>
          <TeamMembersMessages error={logic.error} success={logic.success} />
        </div>
        <div className="p-6 border-t border-gray-200 dark:border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl text-white font-medium shadow-lg cursor-pointer hover:shadow-xl hover:translate-y-[-1px] transition-all drop-shadow-md"
            style={{ background: `linear-gradient(135deg, ${logic.theme.primaryColor}, ${logic.theme.accentColor})`, textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)' }}
          >
            Cerrar
          </button>
        </div>
      </motion.div>
    </div>
  )
}
