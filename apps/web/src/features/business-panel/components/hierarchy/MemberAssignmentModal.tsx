'use client'

import { logger as techDebtLogger } from '@/lib/utils/logger'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, Check, Loader2, Search, UserPlus, X } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { HierarchyService } from '../../services/hierarchy.service'
import type { UserWithHierarchy } from '../../types/hierarchy.types'
import styles from './HierarchyExperience.module.css'
import { useHierarchyDialog } from './useHierarchyDialog'

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
  initialRole,
}: MemberAssignmentModalProps) {
  const { t } = useTranslation('business')
  const { t: tc } = useTranslation('common')
  const params = useParams()
  const orgSlug = params?.orgSlug as string
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [users, setUsers] = useState<UserWithHierarchy['user'][]>([])
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())
  const [role, setRole] = useState<'member' | 'leader'>(initialRole || 'member')
  const [error, setError] = useState<string | null>(null)
  const dialogRef = useHierarchyDialog({ isOpen, onClose, preventClose: loading })

  useEffect(() => {
    if (!isOpen) {
      setUsers([])
      setSearchQuery('')
      setSelectedUserIds(new Set())
      setError(null)
      setRole(initialRole || 'member')
      return
    }

    let isCurrent = true
    const timeoutId = window.setTimeout(async () => {
      setSearching(true)
      setError(null)
      try {
        const results = await HierarchyService.getAvailableUsersForNode(
          nodeId,
          searchQuery.trim(),
          role === 'leader',
          orgSlug,
        )
        if (isCurrent) setUsers(results)
      } catch (searchError) {
        techDebtLogger.error(searchError)
        if (isCurrent) setError(t('hierarchy.memberModal.errorSearch'))
      } finally {
        if (isCurrent) setSearching(false)
      }
    }, 350)

    return () => {
      isCurrent = false
      window.clearTimeout(timeoutId)
    }
  }, [initialRole, isOpen, nodeId, orgSlug, role, searchQuery, t])

  const handleRoleChange = (nextRole: 'member' | 'leader') => {
    setRole(nextRole)
    setSelectedUserIds(new Set())
  }

  const toggleUser = (userId: string) => {
    setSelectedUserIds(current => {
      if (role === 'leader') {
        return current.has(userId) ? new Set() : new Set([userId])
      }

      const next = new Set(current)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })
  }

  const availableUserIds = users.flatMap(user => user?.id ? [user.id] : [])
  const areAllVisibleUsersSelected = availableUserIds.length > 0
    && availableUserIds.every(userId => selectedUserIds.has(userId))

  const toggleAllVisibleUsers = () => {
    if (role !== 'member') return

    setSelectedUserIds(current => {
      const next = new Set(current)
      if (areAllVisibleUsersSelected) availableUserIds.forEach(userId => next.delete(userId))
      else availableUserIds.forEach(userId => next.add(userId))
      return next
    })
  }

  const handleAssign = async () => {
    if (selectedUserIds.size === 0 || loading) return

    setLoading(true)
    setError(null)
    try {
      const userIds = Array.from(selectedUserIds)
      const results = await Promise.all(
        userIds.map(async userId => ({
          userId,
          result: await HierarchyService.assignUserToNode(nodeId, userId, role, false, orgSlug),
        })),
      )
      const failedAssignments = results.filter(({ result }) => !result.success)
      const successfulUserIds = new Set(
        results.filter(({ result }) => result.success).map(({ userId }) => userId),
      )

      if (successfulUserIds.size > 0) onSuccess()

      if (failedAssignments.length > 0) {
        setSelectedUserIds(new Set(failedAssignments.map(({ userId }) => userId)))
        setUsers(currentUsers => currentUsers.filter(user => user?.id && !successfulUserIds.has(user.id)))
        setError(t('hierarchy.memberModal.partialError', {
          count: failedAssignments.length,
          defaultValue: 'No se pudieron asignar {{count}} usuarios. Intenta nuevamente.',
        }))
        return
      }

      onClose()
    } catch (assignError) {
      techDebtLogger.error(assignError)
      setError(t('hierarchy.errorConnection'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={event => {
            if (event.target === event.currentTarget && !loading) onClose()
          }}
        >
          <motion.div
            ref={dialogRef}
            className={styles.dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="member-assignment-title"
            initial={{ opacity: 0, scale: 0.975, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.975, y: 18 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            <header className={styles.dialogHeader}>
              <div className={styles.dialogIcon}><UserPlus aria-hidden="true" /></div>
              <div className={styles.dialogHeading}>
                <p className={styles.dialogKicker}>{t('hierarchy.members')}</p>
                <h2 id="member-assignment-title" className={styles.dialogTitle}>
                  {t('hierarchy.memberModal.title', { name: nodeName })}
                </h2>
              </div>
              <button type="button" onClick={onClose} disabled={loading} className={styles.iconButton} aria-label={tc('actions.close')}>
                <X aria-hidden="true" />
              </button>
            </header>

            <div className={styles.dialogBody}>
              <div className={styles.formStack}>
                <label className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}>{t('hierarchy.memberModal.placeholder')}</span>
                  <span className={styles.searchField}>
                    <Search aria-hidden="true" />
                    <input
                      autoFocus
                      type="search"
                      value={searchQuery}
                      onChange={event => setSearchQuery(event.target.value)}
                      placeholder={t('hierarchy.memberModal.placeholder')}
                      className={styles.input}
                    />
                  </span>
                </label>

                <div className={styles.segmented} role="group" aria-label={t('hierarchy.roles.title')}>
                  <button
                    type="button"
                    aria-pressed={role === 'member'}
                    onClick={() => handleRoleChange('member')}
                    className={`${styles.segment} ${role === 'member' ? styles.segmentActive : ''}`}
                  >
                    {t('hierarchy.memberModal.roles.member')}
                  </button>
                  <button
                    type="button"
                    aria-pressed={role === 'leader'}
                    onClick={() => handleRoleChange('leader')}
                    className={`${styles.segment} ${role === 'leader' ? styles.segmentActive : ''}`}
                  >
                    {t('hierarchy.memberModal.roles.leader')}
                  </button>
                </div>

                <div className={styles.selectionSummary} aria-live="polite">
                  <span>
                    {t('hierarchy.memberModal.selectedCount', {
                      count: selectedUserIds.size,
                      defaultValue: '{{count}} seleccionados',
                    })}
                  </span>
                  {role === 'member' && users.length > 0 ? (
                    <button type="button" onClick={toggleAllVisibleUsers}>
                      {areAllVisibleUsersSelected
                        ? t('hierarchy.memberModal.clearSelection', { defaultValue: 'Deseleccionar todos' })
                        : t('hierarchy.memberModal.selectAll', { defaultValue: 'Seleccionar todos' })}
                    </button>
                  ) : null}
                </div>

                <div className={styles.resultList} aria-live="polite">
                  {searching ? (
                    [0, 1, 2].map(item => <div key={item} className={styles.skeletonRow} />)
                  ) : users.length === 0 ? (
                    <div className={styles.compactEmpty}>
                      <UserPlus aria-hidden="true" />
                      <p className={styles.stateDescription}>
                        {searchQuery ? t('hierarchy.memberModal.emptySearch') : t('hierarchy.memberModal.startTyping')}
                      </p>
                    </div>
                  ) : (
                    users.map(user => user?.id ? (
                      <button
                        key={user.id}
                        type="button"
                        aria-pressed={selectedUserIds.has(user.id)}
                        data-selected={selectedUserIds.has(user.id)}
                        onClick={() => toggleUser(user.id)}
                        className={styles.resultRow}
                      >
                        <span className={styles.memberAvatar}>
                          {user.profile_picture_url ? (
                            <img src={user.profile_picture_url} alt="" />
                          ) : (
                            (user.first_name?.[0] || user.username?.[0] || '?').toUpperCase()
                          )}
                        </span>
                        <span>
                          <span className={styles.memberName}>{user.first_name} {user.last_name}</span>
                          <span className={styles.memberEmail}>{user.email}</span>
                        </span>
                        <span className={styles.resultCheck} data-selected={selectedUserIds.has(user.id)} aria-hidden="true">
                          <Check />
                        </span>
                      </button>
                    ) : null)
                  )}
                </div>

                {error ? (
                  <div className={`${styles.alert} ${styles.alertError}`} role="alert">
                    <AlertCircle aria-hidden="true" />
                    <p className={styles.alertCopy}>{error}</p>
                  </div>
                ) : null}
              </div>
            </div>

            <footer className={styles.dialogFooter}>
              <button type="button" onClick={onClose} disabled={loading} className={styles.secondaryButton}>
                {tc('actions.cancel')}
              </button>
              <button type="button" onClick={() => void handleAssign()} disabled={selectedUserIds.size === 0 || loading} className={styles.primaryButton}>
                {loading ? <Loader2 className="animate-spin" aria-hidden="true" /> : <UserPlus aria-hidden="true" />}
                {selectedUserIds.size > 1
                  ? t('hierarchy.memberModal.submitMany', {
                    count: selectedUserIds.size,
                    defaultValue: 'Asignar {{count}} usuarios',
                  })
                  : t('hierarchy.memberModal.submit')}
              </button>
            </footer>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
