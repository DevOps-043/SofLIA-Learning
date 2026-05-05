'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Search,
  Check,
  UserPlus,
  UserMinus,
  Users,
  Crown,
  User,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { useBusinessUsers } from '../../hooks/useBusinessUsers'
import Image from 'next/image'
import { useOrganizationStylesContext } from '../../contexts/OrganizationStylesContext'
import { useThemeStore } from '@/core/stores/themeStore'
import { HierarchyService } from '../../services/hierarchy.service'
import { UserWithHierarchy } from '../../types/hierarchy.types'

interface TeamMembersModalProps {
  isOpen: boolean
  onClose: () => void
  teamId: string
  teamName: string
  currentMembers: UserWithHierarchy[]
  onMembersUpdated: () => void
}

export function TeamMembersModal({
  isOpen,
  onClose,
  teamId,
  teamName,
  currentMembers,
  onMembersUpdated
}: TeamMembersModalProps) {
  const { orgSlug } = useParams<{ orgSlug: string }>()
  const { styles } = useOrganizationStylesContext()
  const panelStyles = styles?.panel
  const { users, isLoading: loadingUsers, syncOrgData: refetchUsers } = useBusinessUsers(orgSlug)

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())
  const [isAssigning, setIsAssigning] = useState(false)
  const [isRemoving, setIsRemoving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Theme colors
  const { resolvedTheme } = useThemeStore()
  const isDark = resolvedTheme === 'dark'

  const primaryColor = panelStyles?.primary_button_color || (isDark ? '#8B5CF6' : '#6366F1')
  const accentColor = panelStyles?.accent_color || '#10B981'
  const cardBackground = isDark ? (panelStyles?.card_background || '#1E2329') : '#FFFFFF'
  const textColor = isDark ? (panelStyles?.text_color || '#FFFFFF') : '#0F172A'
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'

  // Refresh data when modal opens
  useEffect(() => {
    if (isOpen) {
      refetchUsers()
      setSearchTerm('')
      setSelectedUserIds(new Set())
      setError(null)
      setSuccess(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  // Get current member IDs (using user_id from UserWithHierarchy)
  const currentMemberIds = new Set(currentMembers.map(m => m.user_id || m.user?.id))

  // Filter available users (not already in team and active)
  const availableUsers = users.filter(user => {
    const displayName = user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username
    const matchesSearch = searchTerm === '' ||
      displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const isNotInTeam = !currentMemberIds.has(user.id)
    const isActive = user.org_status === 'active' || !user.org_status
    const isNotOwner = user.role !== 'owner'
    
    return matchesSearch && isNotInTeam && isActive && isNotOwner
  })

  const toggleUser = (userId: string) => {
    setSelectedUserIds(prev => {
      const next = new Set(prev)
      if (next.has(userId)) {
        next.delete(userId)
      } else {
        next.add(userId)
      }
      return next
    })
  }

  const handleSelectAll = () => {
    const availableUserIds = availableUsers.map(u => u.id)
    if (availableUserIds.length === 0) return

    const allSelected = availableUserIds.every(id => selectedUserIds.has(id))
    if (allSelected) {
      setSelectedUserIds(new Set())
    } else {
      setSelectedUserIds(new Set(availableUserIds))
    }
  }

  const handleAddMembers = async () => {
    if (selectedUserIds.size === 0) {
      setError('Selecciona al menos un usuario para agregar')
      return
    }

    setIsAssigning(true)
    setError(null)
    setSuccess(null)

    try {
      const promises = Array.from(selectedUserIds).map(userId =>
        HierarchyService.assignUserToTeam({
          user_id: userId,
          team_id: teamId,
          role: 'member'
        }, orgSlug)
      )

      const results = await Promise.all(promises)
      const failed = results.filter(r => !r.success)

      if (failed.length > 0) {
        setError(`Error al agregar ${failed.length} usuario(s): ${failed[0].error}`)
      } else {
        setSuccess(`${selectedUserIds.size} usuario(s) agregado(s) exitosamente`)
        setSelectedUserIds(new Set())
        onMembersUpdated()
        refetchUsers()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al agregar miembros')
    } finally {
      setIsAssigning(false)
    }
  }

  const handleRemoveMember = async (userId: string) => {
    setIsRemoving(userId)
    setError(null)
    setSuccess(null)

    try {
      const result = await HierarchyService.removeUserFromTeam(userId, orgSlug)
      if (result.success) {
        setSuccess('Miembro removido exitosamente')
        onMembersUpdated()
        refetchUsers()
      } else {
        setError(result.error || 'Error al remover miembro')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al remover miembro')
    } finally {
      setIsRemoving(null)
    }
  }

  const handleChangeRole = async (userId: string, newRole: 'team_leader' | 'member') => {
    setError(null)
    setSuccess(null)

    try {
      const result = await HierarchyService.assignUserToTeam({
        user_id: userId,
        team_id: teamId,
        role: newRole
      }, orgSlug)

      if (result.success) {
        setSuccess(`Rol actualizado exitosamente`)
        onMembersUpdated()
      } else {
        setError(result.error || 'Error al actualizar rol')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar rol')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-[#1E2329] rounded-2xl border border-gray-200 dark:border-white/10 w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl"
        style={{ backgroundColor: cardBackground }}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Gestionar Miembros
              </h2>
              <p className="text-sm text-gray-600 dark:text-white/50">{teamName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-white/40 hover:text-gray-600 dark:hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Current Members */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Miembros Actuales ({currentMembers.length})
              </h3>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {currentMembers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-white/40">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No hay miembros en este equipo</p>
                  </div>
                ) : (
                  currentMembers.map((member) => (
                    <div
                      key={member.id}
                      className="p-3 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="relative w-10 h-10 flex-shrink-0">
                          {member.user?.profile_picture_url ? (
                            <Image
                              src={member.user.profile_picture_url}
                              alt=""
                              fill
                              className="rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                              {member.user?.display_name?.charAt(0) || member.user?.email.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900 dark:text-white truncate">
                              {member.user?.display_name || member.user?.email}
                            </p>
                            {member.role === 'team_leader' && (
                              <Crown className="w-4 h-4 text-amber-500 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-white/50 truncate">
                            {member.user?.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <select
                          value={member.role || 'member'}
                          onChange={(e) => handleChangeRole(member.user_id, e.target.value as 'team_leader' | 'member')}
                          className="text-xs px-2 py-1 rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white"
                          disabled={isRemoving === member.user_id}
                        >
                          <option value="member">Miembro</option>
                          <option value="team_leader">Líder</option>
                        </select>
                        <button
                          onClick={() => handleRemoveMember(member.user_id)}
                          disabled={isRemoving === member.user_id}
                          className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50"
                          title="Remover del equipo"
                        >
                          {isRemoving === member.user_id ? (
                            <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
                          ) : (
                            <UserMinus className="w-4 h-4 text-red-500" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Add Members */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Agregar Miembros
              </h3>

              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar usuarios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Select All */}
              {availableUsers.length > 0 && (
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-3"
                >
                  {availableUsers.every(u => selectedUserIds.has(u.id)) ? 'Deseleccionar todos' : 'Seleccionar todos'}
                </button>
              )}

              {/* Users List */}
              <div className="space-y-2 max-h-[400px] overflow-y-auto mb-4">
                {loadingUsers ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-6 h-6 mx-auto animate-spin text-gray-400" />
                  </div>
                ) : availableUsers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-white/40">
                    <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No hay usuarios disponibles</p>
                  </div>
                ) : (
                  availableUsers.map((user) => {
                    const displayName = user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username
                    const isSelected = selectedUserIds.has(user.id)
                    
                    return (
                      <div
                        key={user.id}
                        onClick={() => toggleUser(user.id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10'
                            : 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 flex-shrink-0">
                            {user.profile_picture_url ? (
                              <Image
                                src={user.profile_picture_url}
                                alt=""
                                fill
                                className="rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white font-bold text-sm">
                                {displayName.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white truncate">
                              {displayName}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-white/50 truncate">
                              {user.email}
                            </p>
                          </div>
                          {isSelected && (
                            <Check className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Add Button */}
              <button
                onClick={handleAddMembers}
                disabled={selectedUserIds.size === 0 || isAssigning}
                className="w-full py-2 px-4 rounded-lg text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{
                  background: selectedUserIds.size > 0 && !isAssigning
                    ? `linear-gradient(135deg, ${primaryColor}, ${accentColor})`
                    : '#9CA3AF',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
                }}
              >
                {isAssigning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Agregando...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Agregar {selectedUserIds.size > 0 ? `(${selectedUserIds.size})` : ''}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Messages */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center gap-2"
              >
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <p className="text-sm text-emerald-800 dark:text-emerald-300">{success}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl text-white font-medium shadow-lg cursor-pointer hover:shadow-xl hover:translate-y-[-1px] transition-all drop-shadow-md"
            style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`, textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)' }}
          >
            Cerrar
          </button>
        </div>
      </motion.div>
    </div>
  )
}

