
import { logger as techDebtLogger } from '@/lib/utils/logger'
import { useState, useEffect } from 'react'
import { Search, X, UserPlus, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams } from 'next/navigation'
import { HierarchyService } from '../../services/hierarchy.service'
import type { UserWithHierarchy } from '../../types/hierarchy.types'

interface MemberAssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  nodeId: string
  nodeName: string
  onSuccess: () => void
  initialRole?: 'member' | 'leader'
}

export function MemberAssignmentModal({
  isOpen,
  onClose,
  nodeId,
  nodeName,
  onSuccess,
  initialRole
}: MemberAssignmentModalProps) {
  const { t } = useTranslation('business')
  const { t: tc } = useTranslation('common')
  const params = useParams()
  const orgSlug = params?.orgSlug as string
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [users, setUsers] = useState<UserWithHierarchy['user'][]>([])
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [role, setRole] = useState<'member' | 'leader'>(initialRole || 'member')
  const [error, setError] = useState<string | null>(null)

  // Fetch users when search query changes
  useEffect(() => {
    if (!isOpen) {
      setUsers([]);
      setSearchQuery('');
      setSelectedUser(null);
      setError(null);
      setRole(initialRole || 'member');
      return;
    }

    const fetchUsers = async () => {
      setSearching(true)
      try {
        const results = await HierarchyService.getAvailableUsersForNode(nodeId, searchQuery, role === 'leader', orgSlug)
        setUsers(results)
      } catch (err) {
        techDebtLogger.error(err)
        setError(t('hierarchy.memberModal.errorSearch'))
      } finally {
        setSearching(false)
      }
    }

    const timeoutId = setTimeout(() => {
      fetchUsers();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, nodeId, isOpen, role])

  const handleAssign = async () => {
    if (!selectedUser) return

    setLoading(true)
    setError(null)
    try {
      const result = await HierarchyService.assignUserToNode(nodeId, selectedUser, role, false, orgSlug)

      if (result.success) {
        onSuccess()
        onClose()
      } else {
        setError(result.error || t('hierarchy.memberModal.errorAssign'))
      }
    } catch (err) {
      techDebtLogger.error(err)
      setError(t('hierarchy.errorConnection'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-carbon-800 rounded-2xl shadow-2xl w-full max-w-[500px] pointer-events-auto border border-gray-200 dark:border-white/10 overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {t('hierarchy.memberModal.title', { name: nodeName })}
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 -mr-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4 overflow-y-auto">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder={t('hierarchy.memberModal.placeholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white placeholder-gray-500"
                  />
                </div>

                {/* Role Selector */}
                <div className="flex bg-gray-50 dark:bg-gray-700 p-1 rounded-lg border border-gray-100 dark:border-white/5">
                  <button
                    onClick={() => setRole('member')}
                    className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${role === 'member'
                      ? 'bg-white dark:bg-carbon-800 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                      }`}
                  >
                    {t('hierarchy.memberModal.roles.member')}
                  </button>
                  <button
                    onClick={() => setRole('leader')}
                    className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${role === 'leader'
                      ? 'bg-white dark:bg-carbon-800 text-purple-600 dark:text-purple-400 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                      }`}
                  >
                    {t('hierarchy.memberModal.roles.leader')}
                  </button>
                </div>

                {/* Users List */}
                <div className="flex-1 min-h-[200px] max-h-[300px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {searching ? (
                    <div className="flex justify-center py-8 text-gray-400">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : users.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                      {searchQuery ? t('hierarchy.memberModal.emptySearch') : t('hierarchy.memberModal.startTyping')}
                    </div>
                  ) : (
                    users.map(user => (
                      <div
                        key={user?.id || 'unknown'}
                        onClick={() => user?.id && setSelectedUser(user.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${user?.id && selectedUser === user.id
                          ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-500/10'
                          : 'border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/20 hover:bg-gray-50 dark:hover:bg-white/5'
                          } `}
                      >
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0 overflow-hidden">
                          {user?.profile_picture_url ? (
                            <img src={user.profile_picture_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold">
                              {(user?.first_name?.[0] || user?.username?.[0] || '?').toUpperCase()}
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 dark:text-white truncate">
                            {user?.first_name} {user?.last_name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {user?.email}
                          </div>
                        </div>

                        {/* Selection Indicator */}
                        {user?.id && selectedUser === user.id && (
                          <div className="text-blue-500">
                            <CheckCircle className="w-5 h-5 fill-current" />
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 text-sm flex items-center gap-2 border border-red-100 dark:border-red-900/30">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-100 dark:border-white/5 flex justify-end gap-3 bg-gray-50/50 dark:bg-carbon-800">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                >
                  {tc('actions.cancel')}
                </button>
                <button
                  onClick={handleAssign}
                  disabled={!selectedUser || loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-blue-500/20"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {t('hierarchy.memberModal.submit')}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

