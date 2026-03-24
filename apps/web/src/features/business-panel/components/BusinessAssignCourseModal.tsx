'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Search,
  Check,
  Clock,
  MessageSquare,
  BookOpen,
  Sparkles,
  UserCheck,
  AlertCircle,
  XCircle,
  User,
  Users
} from 'lucide-react'
import { useBusinessUsers } from '../hooks/useBusinessUsers'
import Image from 'next/image'
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext'
import { useThemeStore } from '@/core/stores/themeStore'
import { useTranslation } from 'react-i18next'

interface BusinessAssignCourseModalProps {
  isOpen: boolean
  onClose: () => void
  courseId: string
  courseTitle: string
  orgSlug: string
  onAssignComplete: () => void
}

interface AssignedUserInfo {
  user_id: string
  source: 'direct'
}

export function BusinessAssignCourseModal({
  isOpen,
  onClose,
  courseId,
  courseTitle,
  orgSlug,
  onAssignComplete
}: BusinessAssignCourseModalProps) {
  const { t } = useTranslation('business')
  const { styles } = useOrganizationStylesContext()
  const panelStyles = styles?.panel
  const { users, isLoading: loadingUsers, syncOrgData: refetchUsers } = useBusinessUsers(orgSlug)

  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())
  const [dueDate, setDueDate] = useState<string>('')
  const [startDate, setStartDate] = useState<string>('')
  const [approach, setApproach] = useState<string | null>(null)
  const [customMessage, setCustomMessage] = useState<string>('')
  const [isAssigning, setIsAssigning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [alreadyAssignedUserIds, setAlreadyAssignedUserIds] = useState<Set<string>>(new Set())
  const [assignedUsersInfo, setAssignedUsersInfo] = useState<Map<string, AssignedUserInfo>>(new Map())
  const [showLiaModal, setShowLiaModal] = useState(false)
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [suggestionReason, setSuggestionReason] = useState<string | null>(null)

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
    }
  }, [isOpen])

  // Load already assigned users
  useEffect(() => {
    if (isOpen && courseId) {
      const fetchAssignedUsers = async () => {
        try {
          console.log('🔍 Fetching assigned users for course:', courseId)
          const response = await fetch(`/api/${orgSlug}/business/courses/${courseId}/assigned-users`, {
            credentials: 'include'
          })
          if (response.ok) {
            const data = await response.json()
            console.log('📊 Assigned users response:', data)
            if (data.success && data.user_ids) {
              console.log('✅ Setting alreadyAssignedUserIds:', data.user_ids)
              setAlreadyAssignedUserIds(new Set(data.user_ids))
              // Guardar info detallada sobre origen de asignación
              if (data.assigned_users) {
                const infoMap = new Map<string, AssignedUserInfo>()
                data.assigned_users.forEach((u: AssignedUserInfo) => {
                  infoMap.set(u.user_id, u)
                })
                setAssignedUsersInfo(infoMap)
                console.log('✅ Setting assignedUsersInfo:', data.assigned_users)
              }
            }
          } else {
            console.error('❌ Response not OK:', response.status, await response.text())
          }
        } catch (err) {
          console.error('Error fetching assigned users:', err)
        }
      }
      fetchAssignedUsers()
    }
  }, [isOpen, courseId])


  // Filter users
  const availableUsers = users.filter(user => {
    const displayName = user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username
    const matchesSearch = searchTerm === '' ||
      displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch && (user.org_status === 'active' || !user.org_status)
  })


  const toggleUser = (userId: string) => {
    if (alreadyAssignedUserIds.has(userId)) return
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

  const handleSelectAllUsers = () => {
    const availableUserIds = availableUsers
      .filter(u => !alreadyAssignedUserIds.has(u.id))
      .map(u => u.id)

    if (availableUserIds.length === 0) return

    const allSelected = availableUserIds.every(id => selectedUserIds.has(id))

    if (allSelected) {
      setSelectedUserIds(new Set())
    } else {
      setSelectedUserIds(new Set(availableUserIds))
    }
  }


  const handleAssign = async () => {
    if (selectedUserIds.size === 0) {
      setError(t('assignCourse.errors.selectUser'))
      return
    }

    setIsAssigning(true)
    setError(null)

    try {
      // Assign to individual users
      const response = await fetch(`/api/${orgSlug}/business/courses/${courseId}/assign`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_ids: Array.from(selectedUserIds),
          due_date: dueDate || null,
          start_date: startDate || null,
          approach: approach || null,
          message: customMessage.trim() || null
        })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || t('assignCourse.errors.assignFailed'))
      }

      setSelectedUserIds(new Set())
      setDueDate('')
      setCustomMessage('')
      onAssignComplete()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('assignCourse.errors.assignFailed'))
    } finally {
      setIsAssigning(false)
    }
  }

  const handleLiaSelection = (deadline: string, start: string, selectedApproach: string) => {
    setDueDate(deadline)
    setStartDate(start)
    setApproach(selectedApproach)
    setShowLiaModal(false)
  }

  const handleSuggestLiaDate = async () => {
    setIsSuggesting(true)
    setSuggestionReason(null)
    try {
      const today = new Date().toLocaleDateString('es-MX')

      const response = await fetch('/api/lia/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Actúa como un planificador de formación experto (LIA).
            Estoy asignando el curso "${courseTitle}" (ID: ${courseId}).
            Analiza la duración típica y complejidad de un curso con este título.
            Sugiere una fecha límite realista (deadline) contando desde hoy (${today}), asumiendo un ritmo de estudio profesional (2-3 horas semanales).
            
            IMPORTANTE: Tu respuesta debe ser EXCLUSIVAMENTE un objeto JSON válido con este formato exacto (sin bloques de código markdown):
            { "suggested_date": "YYYY-MM-DD", "reason": "breve explicación de 15 palabras máximo" }`
          }],
          stream: false
        })
      })

      const data = await response.json()
      const content = data.message?.content || ''

      // Intentar extraer JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/)

      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0])
          if (parsed.suggested_date) {
            // Asegurar formato ISO
            const dateObj = new Date(parsed.suggested_date)
            if (!isNaN(dateObj.getTime())) {
              setDueDate(dateObj.toISOString())
              setSuggestionReason(parsed.reason)
            }
          }
        } catch (e) {
          console.error('Error parseando JSON de LIA:', e)
        }
      }
    } catch (err) {
      console.error('Error obteniendo sugerencia de LIA:', err)
    } finally {
      setIsSuggesting(false)
    }
  }

  const handleClose = () => {
    setSelectedUserIds(new Set())
    setDueDate('')
    setStartDate('')
    setApproach(null)
    setCustomMessage('')
    setError(null)
    setSearchTerm('')
    setShowLiaModal(false)
    onClose()
  }

  if (!isOpen) return null

  const availableUserCount = availableUsers.filter(u => !alreadyAssignedUserIds.has(u.id)).length
  const selectedUserCount = Array.from(selectedUserIds).filter(id => !alreadyAssignedUserIds.has(id)).length
  const selectedUsers = users.filter(u => selectedUserIds.has(u.id))

  const currentSelectedCount = selectedUserCount
  const currentAvailableCount = availableUserCount

  return (
    <>
      <AnimatePresence>
        {!showLiaModal && (
          <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 99999 }}>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="absolute inset-0 backdrop-blur-md"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            />

            {/* Modal - Split Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="relative rounded-2xl shadow-2xl overflow-hidden border w-full max-w-4xl max-h-[85vh] z-10"
              style={{ backgroundColor: cardBackground, borderColor: borderColor }}
            >
              <div className="flex flex-row h-full max-h-[85vh]">

                {/* Left Panel - Preview (Solo en desktop) */}
                <div
                  className="w-80 flex-shrink-0 flex-col p-8 border-r hidden xl:flex"
                  style={{ backgroundColor: isDark ? `${primaryColor}15` : '#F8FAFC', borderColor: borderColor }}
                >
                  {/* Course Icon */}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="relative mb-6"
                  >
                    <div
                      className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto !text-white"
                      style={{
                        backgroundColor: primaryColor,
                        color: '#FFFFFF',
                        boxShadow: `0 8px 30px ${primaryColor}40`
                      }}
                    >
                      <BookOpen className="w-10 h-10 !text-white" color="#FFFFFF" />
                    </div>
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: accentColor }}
                    >
                      <Sparkles className="w-4 h-4 text-white" />
                    </motion.div>
                  </motion.div>

                  {/* Course Title */}
                  <div className="text-center mb-6">
                    <h3 className="font-bold text-lg mb-2" style={{ color: textColor }}>
                      {t('assignCourse.title')}
                    </h3>
                    <p className="text-sm line-clamp-2" style={{ color: `${textColor}70` }}>
                      {courseTitle}
                    </p>
                  </div>

                  {/* Mode Indicator */}
                  <div
                    className="p-3 rounded-xl border border-white/10 mb-6 text-center"
                    style={{ backgroundColor: `${cardBackground}80` }}
                  >
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <User className="w-4 h-4" style={{ color: primaryColor }} />
                      <span className="text-sm font-medium" style={{ color: textColor }}>
                        {t('assignCourse.modes.individual')}
                      </span>
                    </div>
                  </div>

                  {/* Selection Stats */}
                  <div className="space-y-4 mb-6">
                    <div
                      className="p-4 rounded-xl border border-white/10"
                      style={{ backgroundColor: `${cardBackground}80` }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm" style={{ color: `${textColor}70` }}>{t('assignCourse.stats.selected')}</span>
                        <span className="text-2xl font-bold" style={{ color: primaryColor }}>{currentSelectedCount}</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: `${primaryColor}20` }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: currentAvailableCount > 0 ? `${(currentSelectedCount / currentAvailableCount) * 100}%` : '0%' }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: primaryColor }}
                        />
                      </div>
                      <p className="text-xs mt-2" style={{ color: `${textColor}50` }}>
                        {t('assignCourse.stats.of')} {currentAvailableCount} {t('assignCourse.stats.available')}
                      </p>
                    </div>
                  </div>

                  {/* Selected Preview */}
                  {currentSelectedCount > 0 && (
                    <div className="flex-1 overflow-hidden">
                      <p className="text-xs font-medium mb-3" style={{ color: `${textColor}60` }}>
                        {t('assignCourse.stats.usersSelected')}
                      </p>
                      <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                        {selectedUsers.slice(0, 8).map((user, index) => {
                          const displayName = user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username
                          return (
                            <motion.div
                              key={user.id}
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: index * 0.05 }}
                              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold !text-white border-2 border-white/20"
                              style={{ backgroundColor: primaryColor, color: '#FFFFFF' }}
                              title={displayName}
                            >
                              {displayName[0].toUpperCase()}
                            </motion.div>
                          )
                        })}
                        {currentSelectedCount > 8 && (
                          <div
                            className="px-2 py-1 rounded-lg text-xs font-bold border"
                            style={{ backgroundColor: `${primaryColor}30`, color: primaryColor, borderColor: primaryColor }}
                          >
                            +{currentSelectedCount - 8}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Quick Info */}
                  <div className="mt-auto pt-6 space-y-3">
                    {dueDate && (
                      <div className="flex items-center gap-2 text-sm" style={{ color: `${textColor}70` }}>
                        <Clock className="w-4 h-4" style={{ color: accentColor }} />
                        <span>{t('assignCourse.labels.dueDate')}: {new Date(dueDate).toLocaleDateString('es-ES')}</span>
                      </div>
                    )}
                    {customMessage && (
                      <div className="flex items-center gap-2 text-sm" style={{ color: `${textColor}70` }}>
                        <MessageSquare className="w-4 h-4" style={{ color: accentColor }} />
                        <span>{t('assignCourse.labels.messageIncluded')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Panel - Form */}
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center xl:hidden"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <UserCheck className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-base sm:text-lg font-bold" style={{ color: textColor }}>
                          {t('assignCourse.selectRecipients')}
                        </h2>
                        <p className="text-xs sm:text-sm xl:hidden line-clamp-1" style={{ color: `${textColor}60` }}>
                          {courseTitle}
                        </p>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleClose}
                      disabled={isAssigning}
                      className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors hover:bg-white/5"
                    >
                      <X className="w-5 h-5" style={{ color: `${textColor}60` }} />
                    </motion.button>
                  </div>

                  {/* Content */}
                  <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
                    {/* Error */}
                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="p-4 rounded-xl flex items-center gap-3 border"
                          style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                        >
                          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                          <span className="text-red-400 text-sm">{error}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: `${textColor}40` }} />
                      <input
                        type="text"
                        placeholder={t('assignCourse.search.users')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-white/10 focus:outline-none focus:border-white/20 transition-colors"
                        style={{ backgroundColor: `${cardBackground}80`, color: textColor }}
                      />
                    </div>

                    <>
                      {/* Select All Users */}
                      {availableUserCount > 0 && (
                        <motion.button
                          onClick={handleSelectAllUsers}
                          className="flex items-center gap-3 w-full p-4 rounded-xl border transition-all hover:bg-white/5"
                          style={{ borderColor: selectedUserCount === availableUserCount ? primaryColor : 'rgba(255,255,255,0.1)' }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div
                            className="w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-colors"
                            style={{
                              backgroundColor: selectedUserCount === availableUserCount ? primaryColor : 'transparent',
                              borderColor: selectedUserCount === availableUserCount ? primaryColor : 'rgba(255,255,255,0.3)'
                            }}
                          >
                            {selectedUserCount === availableUserCount && <Check className="w-4 h-4 text-white" />}
                          </div>
                          <span className="font-medium" style={{ color: textColor }}>
                            {t('assignCourse.selectAll')} ({availableUserCount} {t('assignCourse.stats.available')})
                          </span>
                        </motion.button>
                      )}

                      {/* Users List */}
                      <div className="space-y-2">
                        {loadingUsers ? (
                          <div className="text-center py-12">
                            <div className="w-10 h-10 border-3 rounded-full animate-spin mx-auto mb-4"
                              style={{ borderColor: `${primaryColor}30`, borderTopColor: primaryColor }} />
                            <p style={{ color: `${textColor}50` }}>{t('assignCourse.loading.users')}</p>
                          </div>
                        ) : availableUsers.length === 0 ? (
                          <div className="text-center py-12">
                            <Users className="w-16 h-16 mx-auto mb-4" style={{ color: `${textColor}20` }} />
                            <p style={{ color: `${textColor}50` }}>{t('assignCourse.empty.noUsers')}</p>
                          </div>
                        ) : (
                          availableUsers.map((user, index) => {
                            const isAlreadyAssigned = alreadyAssignedUserIds.has(user.id)
                            const isSelected = selectedUserIds.has(user.id)
                            const displayName = user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username
                            const assignmentInfo = assignedUsersInfo.get(user.id)

                            return (
                              <motion.button
                                key={user.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.02 }}
                                onClick={() => !isAlreadyAssigned && toggleUser(user.id)}
                                disabled={isAlreadyAssigned}
                                className={`w-full p-4 rounded-xl border flex items-center gap-4 transition-all text-left ${isAlreadyAssigned ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/5 cursor-pointer'
                                  }`}
                                style={{
                                  backgroundColor: isSelected ? `${primaryColor}15` : 'transparent',
                                  borderColor: isSelected ? primaryColor : borderColor
                                }}
                              >
                                <div
                                  className="w-6 h-6 rounded-lg flex items-center justify-center border-2 flex-shrink-0 transition-colors"
                                  style={{
                                    backgroundColor: isSelected ? primaryColor : isAlreadyAssigned ? 'rgba(255,255,255,0.1)' : 'transparent',
                                    borderColor: isSelected ? primaryColor : isAlreadyAssigned ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.3)'
                                  }}
                                >
                                  {isSelected && <Check className="w-4 h-4 !text-white" color="#FFFFFF" />}
                                  {isAlreadyAssigned && <XCircle className="w-4 h-4" style={{ color: `${textColor}40` }} />}
                                </div>

                                {user.profile_picture_url ? (
                                  <div className="relative w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
                                    <Image src={user.profile_picture_url} alt={displayName} fill className="object-cover" />
                                  </div>
                                ) : (
                                  <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center !text-white font-bold flex-shrink-0"
                                    style={{ backgroundColor: primaryColor, color: '#FFFFFF' }}
                                  >
                                    {displayName[0].toUpperCase()}
                                  </div>
                                )}

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-medium truncate" style={{ color: textColor }}>{displayName}</span>
                                    {isAlreadyAssigned && (
                                      <span
                                        className="px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 bg-yellow-500/20 text-yellow-400"
                                        title='Asignación directa'
                                      >
                                        {t('assignCourse.labels.alreadyAssigned')}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm truncate" style={{ color: `${textColor}50` }}>{user.email}</p>
                                </div>
                              </motion.button>
                            )
                          })
                        )}
                      </div>
                    </>

                  </div>

                  {/* Footer */}
                  <div className="p-4 sm:p-6 border-t border-white/10 space-y-4" style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : '#F1F5F9' }}>

                    {/* Due Date Section - Optional */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium flex items-center gap-2" style={{ color: textColor }}>
                          <Clock className="w-4 h-4" style={{ color: accentColor }} />
                          {t('assignCourse.labels.dueDate', 'Fecha de Vencimiento')}
                          <span className="text-xs font-normal" style={{ color: `${textColor}50` }}>
                            ({t('assignCourse.labels.optional', 'Opcional')})
                          </span>
                        </label>
                        {!dueDate && (
                          <motion.button
                            type="button"
                            onClick={handleSuggestLiaDate}
                            disabled={isSuggesting}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
                            style={{
                              backgroundColor: `${accentColor}20`,
                              color: accentColor,
                              border: `1px solid ${accentColor}40`
                            }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {isSuggesting ? (
                              <>
                                <div className="w-3 h-3 border-2 rounded-full animate-spin" style={{ borderColor: `${accentColor}30`, borderTopColor: accentColor }} />
                                <span>{t('assignCourse.buttons.suggesting', 'Sugiriendo...')}</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3 h-3" />
                                <span>{t('assignCourse.buttons.suggestLia', 'Sugerir con LIA')}</span>
                              </>
                            )}
                          </motion.button>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          value={dueDate ? new Date(dueDate).toISOString().split('T')[0] : ''}
                          onChange={(e) => {
                            if (e.target.value) {
                              const selectedDate = new Date(e.target.value);
                              selectedDate.setHours(23, 59, 59, 999);
                              setDueDate(selectedDate.toISOString());
                              setSuggestionReason(null);
                            } else {
                              setDueDate('');
                              setSuggestionReason(null);
                            }
                          }}
                          min={new Date().toISOString().split('T')[0]}
                          className="flex-1 px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 transition-all"
                          style={{
                            backgroundColor: `${cardBackground}80`,
                            color: textColor,
                            borderColor: dueDate ? accentColor : borderColor,
                            boxShadow: dueDate ? `0 0 0 3px ${accentColor}20` : 'none'
                          }}
                        />
                        {dueDate && (
                          <motion.button
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            type="button"
                            onClick={() => {
                              setDueDate('');
                              setSuggestionReason(null);
                            }}
                            className="p-2.5 rounded-xl hover:bg-white/10 transition-colors"
                            style={{ color: `${textColor}60` }}
                          >
                            <X className="w-4 h-4" />
                          </motion.button>
                        )}
                      </div>

                      {/* Suggestion Reason */}
                      {suggestionReason && (
                        <motion.p
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-xs flex items-center gap-1.5"
                          style={{ color: accentColor }}
                        >
                          <Sparkles className="w-3 h-3" />
                          {suggestionReason}
                        </motion.p>
                      )}
                    </div>

                    <button
                      onClick={handleAssign}
                      disabled={isAssigning || selectedUserIds.size === 0}
                      className="w-full py-4 rounded-xl font-bold text-white transition-all transform active:scale-95 disabled:opacity-50 disabled:active:scale-100 shadow-lg hover:shadow-xl"
                      style={{
                        backgroundColor: primaryColor,
                        boxShadow: `0 4px 15px ${primaryColor}40`
                      }}
                    >
                      {isAssigning ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>{t('assignCourse.buttons.assigning')}</span>
                        </div>
                      ) : (
                        <span>
                          {t('assignCourse.buttons.confirmAssign')} ({selectedUserIds.size})
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
