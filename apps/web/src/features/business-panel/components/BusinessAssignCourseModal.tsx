'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Search,
  Check,
  Clock,
  Sparkles,
  UserCheck,
  AlertCircle,
  XCircle,
  Users,
} from 'lucide-react'
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext'
import { useThemeStore } from '@/core/stores/themeStore'
import { useTranslation } from 'react-i18next'
import {
  BusinessAssignCoursePreviewPanel,
  getBusinessAssignCourseDisplayName,
  getDateInputValue,
  toEndOfDayIso,
  type BusinessAssignCourseModalProps,
  type BusinessAssignCourseTheme,
  useBusinessAssignCourseModal,
} from './business-assign-course-modal'

export function BusinessAssignCourseModal({
  isOpen,
  onClose,
  courseId,
  courseTitle,
  orgSlug,
  onAssignComplete,
}: BusinessAssignCourseModalProps) {
  const { t } = useTranslation('business')
  const { styles } = useOrganizationStylesContext()
  const panelStyles = styles?.panel
  const { resolvedTheme } = useThemeStore()
  const isDark = resolvedTheme === 'dark'

  const theme: BusinessAssignCourseTheme = {
    primaryColor:
      panelStyles?.primary_button_color || (isDark ? '#8B5CF6' : '#6366F1'),
    accentColor: panelStyles?.accent_color || '#10B981',
    cardBackground: isDark ? panelStyles?.card_background || '#1E2329' : '#FFFFFF',
    textColor: isDark ? panelStyles?.text_color || '#FFFFFF' : '#0F172A',
    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    isDark,
  }

  const modal = useBusinessAssignCourseModal({
    isOpen,
    courseId,
    courseTitle,
    orgSlug,
    onAssignComplete,
    onClose,
    t,
  })

  if (!isOpen) {
    return null
  }

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 flex items-center justify-center p-4"
        style={{ zIndex: 99999 }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={modal.handleClose}
          className="absolute inset-0 backdrop-blur-md"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative rounded-2xl shadow-2xl overflow-hidden border w-full max-w-4xl max-h-[85vh] z-10"
          style={{
            backgroundColor: theme.cardBackground,
            borderColor: theme.borderColor,
          }}
        >
          <div className="flex flex-row h-full max-h-[85vh]">
            <BusinessAssignCoursePreviewPanel
              courseTitle={courseTitle}
              dueDate={modal.dueDate}
              selectedUsers={modal.selectedUsers}
              selectedUserCount={modal.selectedUserCount}
              availableUserCount={modal.availableUserCount}
              theme={theme}
              t={t}
            />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center xl:hidden"
                    style={{ backgroundColor: theme.primaryColor }}
                  >
                    <UserCheck className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2
                      className="text-base sm:text-lg font-bold"
                      style={{ color: theme.textColor }}
                    >
                      {t('assignCourse.selectRecipients')}
                    </h2>
                    <p
                      className="text-xs sm:text-sm xl:hidden line-clamp-1"
                      style={{ color: `${theme.textColor}60` }}
                    >
                      {courseTitle}
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={modal.handleClose}
                  disabled={modal.isAssigning}
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors hover:bg-white/5"
                >
                  <X className="w-5 h-5" style={{ color: `${theme.textColor}60` }} />
                </motion.button>
              </div>

              <div
                className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(255,255,255,0.1) transparent',
                }}
              >
                <AnimatePresence>
                  {modal.error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-4 rounded-xl flex items-center gap-3 border"
                      style={{
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        borderColor: 'rgba(239, 68, 68, 0.3)',
                      }}
                    >
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                      <span className="text-red-400 text-sm">{modal.error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="relative">
                  <Search
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
                    style={{ color: `${theme.textColor}40` }}
                  />
                  <input
                    type="text"
                    placeholder={t('assignCourse.search.users')}
                    value={modal.searchTerm}
                    onChange={(event) => modal.setSearchTerm(event.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-white/10 focus:outline-none focus:border-white/20 transition-colors"
                    style={{
                      backgroundColor: `${theme.cardBackground}80`,
                      color: theme.textColor,
                    }}
                  />
                </div>

                {modal.availableUserCount > 0 && (
                  <motion.button
                    onClick={modal.handleSelectAllUsers}
                    className="flex items-center gap-3 w-full p-4 rounded-xl border transition-all hover:bg-white/5"
                    style={{
                      borderColor: modal.allUsersSelected
                        ? theme.primaryColor
                        : 'rgba(255,255,255,0.1)',
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-colors"
                      style={{
                        backgroundColor: modal.allUsersSelected
                          ? theme.primaryColor
                          : 'transparent',
                        borderColor: modal.allUsersSelected
                          ? theme.primaryColor
                          : 'rgba(255,255,255,0.3)',
                      }}
                    >
                      {modal.allUsersSelected && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <span className="font-medium" style={{ color: theme.textColor }}>
                      {t('assignCourse.selectAll')} ({modal.availableUserCount}{' '}
                      {t('assignCourse.stats.available')})
                    </span>
                  </motion.button>
                )}

                <div className="space-y-2">
                  {modal.loadingUsers ? (
                    <div className="text-center py-12">
                      <div
                        className="w-10 h-10 border-3 rounded-full animate-spin mx-auto mb-4"
                        style={{
                          borderColor: `${theme.primaryColor}30`,
                          borderTopColor: theme.primaryColor,
                        }}
                      />
                      <p style={{ color: `${theme.textColor}50` }}>
                        {t('assignCourse.loading.users')}
                      </p>
                    </div>
                  ) : modal.availableUsers.length === 0 ? (
                    <div className="text-center py-12">
                      <Users
                        className="w-16 h-16 mx-auto mb-4"
                        style={{ color: `${theme.textColor}20` }}
                      />
                      <p style={{ color: `${theme.textColor}50` }}>
                        {t('assignCourse.empty.noUsers')}
                      </p>
                    </div>
                  ) : (
                    modal.availableUsers.map((user, index) => {
                      const isAlreadyAssigned = modal.alreadyAssignedUserIds.has(user.id)
                      const isSelected = modal.selectedUserIds.has(user.id)
                      const displayName = getBusinessAssignCourseDisplayName(user)

                      return (
                        <motion.button
                          key={user.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.02 }}
                          onClick={() => !isAlreadyAssigned && modal.handleToggleUser(user.id)}
                          disabled={isAlreadyAssigned}
                          className={`w-full p-4 rounded-xl border flex items-center gap-4 transition-all text-left ${
                            isAlreadyAssigned
                              ? 'opacity-50 cursor-not-allowed'
                              : 'hover:bg-white/5 cursor-pointer'
                          }`}
                          style={{
                            backgroundColor: isSelected
                              ? `${theme.primaryColor}15`
                              : 'transparent',
                            borderColor: isSelected
                              ? theme.primaryColor
                              : theme.borderColor,
                          }}
                        >
                          <div
                            className="w-6 h-6 rounded-lg flex items-center justify-center border-2 flex-shrink-0 transition-colors"
                            style={{
                              backgroundColor: isSelected
                                ? theme.primaryColor
                                : isAlreadyAssigned
                                  ? 'rgba(255,255,255,0.1)'
                                  : 'transparent',
                              borderColor: isSelected
                                ? theme.primaryColor
                                : isAlreadyAssigned
                                  ? 'rgba(255,255,255,0.2)'
                                  : 'rgba(255,255,255,0.3)',
                            }}
                          >
                            {isSelected && (
                              <Check className="w-4 h-4 !text-white" color="#FFFFFF" />
                            )}
                            {isAlreadyAssigned && (
                              <XCircle
                                className="w-4 h-4"
                                style={{ color: `${theme.textColor}40` }}
                              />
                            )}
                          </div>

                          {user.profile_picture_url ? (
                            <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
                              <img
                                src={user.profile_picture_url}
                                alt={displayName}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center !text-white font-bold flex-shrink-0"
                              style={{
                                backgroundColor: theme.primaryColor,
                                color: '#FFFFFF',
                              }}
                            >
                              {displayName[0].toUpperCase()}
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className="font-medium truncate"
                                style={{ color: theme.textColor }}
                              >
                                {displayName}
                              </span>
                              {isAlreadyAssigned && (
                                <span
                                  className="px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 bg-yellow-500/20 text-yellow-400"
                                  title="Asignación directa"
                                >
                                  {t('assignCourse.labels.alreadyAssigned')}
                                </span>
                              )}
                            </div>
                            <p
                              className="text-sm truncate"
                              style={{ color: `${theme.textColor}50` }}
                            >
                              {user.email}
                            </p>
                          </div>
                        </motion.button>
                      )
                    })
                  )}
                </div>
              </div>

              <div
                className="p-4 sm:p-6 border-t border-white/10 space-y-4"
                style={{
                  backgroundColor: theme.isDark ? 'rgba(0,0,0,0.2)' : '#F1F5F9',
                }}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label
                      className="text-sm font-medium flex items-center gap-2"
                      style={{ color: theme.textColor }}
                    >
                      <Clock className="w-4 h-4" style={{ color: theme.accentColor }} />
                      {t('assignCourse.labels.dueDate', 'Fecha de Vencimiento')}
                      <span
                        className="text-xs font-normal"
                        style={{ color: `${theme.textColor}50` }}
                      >
                        ({t('assignCourse.labels.optional', 'Opcional')})
                      </span>
                    </label>
                    {!modal.dueDate && (
                      <motion.button
                        type="button"
                        onClick={modal.handleSuggestLiaDate}
                        disabled={modal.isSuggesting}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
                        style={{
                          backgroundColor: `${theme.accentColor}20`,
                          color: theme.accentColor,
                          border: `1px solid ${theme.accentColor}40`,
                        }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {modal.isSuggesting ? (
                          <>
                            <div
                              className="w-3 h-3 border-2 rounded-full animate-spin"
                              style={{
                                borderColor: `${theme.accentColor}30`,
                                borderTopColor: theme.accentColor,
                              }}
                            />
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
                      value={getDateInputValue(modal.dueDate)}
                      onChange={(event) => {
                        if (!event.target.value) {
                          modal.setDueDate('')
                          modal.setSuggestionReason(null)
                          return
                        }

                        modal.setDueDate(toEndOfDayIso(event.target.value))
                        modal.setSuggestionReason(null)
                      }}
                      min={new Date().toISOString().split('T')[0]}
                      className="flex-1 px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 transition-all"
                      style={{
                        backgroundColor: `${theme.cardBackground}80`,
                        color: theme.textColor,
                        borderColor: modal.dueDate ? theme.accentColor : theme.borderColor,
                        boxShadow: modal.dueDate
                          ? `0 0 0 3px ${theme.accentColor}20`
                          : 'none',
                      }}
                    />
                    {modal.dueDate && (
                      <motion.button
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        type="button"
                        onClick={() => {
                          modal.setDueDate('')
                          modal.setSuggestionReason(null)
                        }}
                        className="p-2.5 rounded-xl hover:bg-white/10 transition-colors"
                        style={{ color: `${theme.textColor}60` }}
                      >
                        <X className="w-4 h-4" />
                      </motion.button>
                    )}
                  </div>

                  {modal.suggestionReason && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs flex items-center gap-1.5"
                      style={{ color: theme.accentColor }}
                    >
                      <Sparkles className="w-3 h-3" />
                      {modal.suggestionReason}
                    </motion.p>
                  )}
                </div>

                <button
                  onClick={modal.handleAssign}
                  disabled={modal.isAssigning || modal.selectedUserCount === 0}
                  className="w-full py-4 rounded-xl font-bold text-white transition-all transform active:scale-95 disabled:opacity-50 disabled:active:scale-100 shadow-lg hover:shadow-xl"
                  style={{
                    backgroundColor: theme.primaryColor,
                    boxShadow: `0 4px 15px ${theme.primaryColor}40`,
                  }}
                >
                  {modal.isAssigning ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{t('assignCourse.buttons.assigning')}</span>
                    </div>
                  ) : (
                    <span>
                      {t('assignCourse.buttons.confirmAssign')} ({modal.selectedUserCount})
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
