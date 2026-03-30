'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, BarChart3, TrendingUp, BookOpen, Award, Clock, FileText, Target, CheckCircle, PlayCircle, XCircle, Briefcase, Calendar, LogIn, MessageSquare, HelpCircle, Activity, Zap, Layers } from 'lucide-react'
import Image from 'next/image'
import { BusinessUser } from '../services/businessUsers.service'
import { useBusinessUserStatsModalLogic } from '../hooks/useBusinessUserStatsModalLogic'

interface BusinessUserStatsModalProps {
  user: BusinessUser | null
  isOpen: boolean
  onClose: () => void
}

export function BusinessUserStatsModal({ user, isOpen, onClose }: BusinessUserStatsModalProps) {
  const {
    t,
    isDark,
    stats,
    loading,
    error,
    activeTab,
    setActiveTab,
    modalBg,
    modalBorder,
    textColor,
    primaryColor,
    accentColor,
    secondaryColor,
    formatMonth,
    formatDate,
    formatRelativeTime,
    displayName,
    initials,
  } = useBusinessUserStatsModalLogic({ user, isOpen, onClose })

  if (!isOpen || !user) return null

  return (
    <AnimatePresence>
      {/* Container - transparent backdrop */}
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={{ zIndex: 99999 }}
      >
        {/* Backdrop - transparent, just for closing */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-5xl mx-4 max-h-[90vh] flex"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="rounded-2xl shadow-2xl overflow-hidden border w-full flex flex-col"
            style={{
              backgroundColor: modalBg,
              borderColor: modalBorder
            }}
          >
            {/* Two Column Layout */}
            <div className="flex min-h-[500px] max-h-[85vh]">

              {/* Left Side - User Profile */}
              <div
                className="w-64 lg:w-72 p-4 lg:p-6 flex flex-col border-r shrink-0 overflow-y-auto"
                style={{
                  background: isDark
                    ? `linear-gradient(135deg, ${primaryColor}20, ${primaryColor}10)`
                    : `linear-gradient(135deg, ${primaryColor}15, ${primaryColor}05)`,
                  borderColor: modalBorder,
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(128,128,128,0.2) transparent'
                }}
              >
                {/* User Avatar */}
                <div className="flex flex-col items-center mb-6">
                  {user.profile_picture_url ? (
                    <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 mb-4" style={{ borderColor: `${primaryColor}40` }}>
                      <Image
                        src={user.profile_picture_url}
                        alt={displayName}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>
                  ) : (
                    <div
                      className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold mb-4"
                      style={{
                        background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}DD)`,
                        color: '#ffffff'
                      }}
                    >
                      {initials}
                    </div>
                  )}
                  <h2 className="text-lg font-bold text-center" style={{ color: textColor }}>{displayName}</h2>
                  <p className="text-sm text-center mt-1" style={{ color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.6)' }}>{user.email}</p>

                  {/* Role Badge */}
                  <div
                    className="mt-3 px-3 py-1.5 rounded-full text-xs font-medium border"
                    style={{
                      backgroundColor: isDark ? `${primaryColor}30` : `${primaryColor}20`,
                      color: isDark ? '#FFFFFF' : primaryColor,
                      borderColor: isDark ? `${primaryColor}50` : `${primaryColor}30`
                    }}
                  >
                    {user.org_role === 'owner' ? t('users.roles.owner') :
                      user.org_role === 'admin' ? t('users.roles.admin') : t('users.roles.member')}
                  </div>
                </div>

                {/* User Info */}
                <div className="space-y-3 lg:space-y-4 flex-1">
                  <div
                    className="p-3 rounded-xl border"
                    style={{
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                      borderColor: modalBorder
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Briefcase className="w-4 h-4" style={{ color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }} />
                      <span className="text-xs" style={{ color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.6)' }}>{t('users.stats.labels.typeRole')}</span>
                    </div>
                    <p className="text-sm font-medium" style={{ color: textColor }}>{user.job_title || user.cargo_rol || 'N/A'}</p>
                  </div>

                  <div
                    className="p-3 rounded-xl border"
                    style={{
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                      borderColor: modalBorder
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-4 h-4" style={{ color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }} />
                      <span className="text-xs" style={{ color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.6)' }}>{t('users.stats.labels.lastConnection')}</span>
                    </div>
                    <p className="text-sm font-medium" style={{ color: textColor }}>
                      {user.last_login_at ? formatRelativeTime(user.last_login_at) : t('users.stats.time.never')}
                    </p>
                    {user.last_login_at && (
                      <p className="text-xs mt-0.5" style={{ color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.5)' }}>{formatDate(user.last_login_at)}</p>
                    )}
                  </div>

                  {user.joined_at && (
                    <div
                      className="p-3 rounded-xl border"
                      style={{
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                        borderColor: modalBorder
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <LogIn className="w-4 h-4" style={{ color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }} />
                        <span className="text-xs" style={{ color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.6)' }}>{t('users.stats.labels.joined')}</span>
                      </div>
                      <p className="text-sm font-medium" style={{ color: textColor }}>{formatDate(user.joined_at)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side - Stats Content */}
              <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Header with Tabs */}
                <div
                  className="flex items-center justify-between p-3 lg:p-4 border-b shrink-0"
                  style={{ borderColor: modalBorder }}
                >
                  <div className="flex gap-1">
                    {[
                      { id: 'overview', label: 'Resumen', icon: BarChart3 },
                      { id: 'courses', label: 'Cursos', icon: BookOpen },
                      { id: 'progress', label: 'Progreso', icon: TrendingUp },
                      { id: 'activity', label: 'Actividad', icon: Clock }
                    ].map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        onClick={() => setActiveTab(id as any)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === id
                          ? ''
                          : 'text-gray-500 dark:text-white/50 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
                          }`}
                        style={activeTab === id ? {
                          backgroundColor: isDark ? `${primaryColor}30` : `${primaryColor}20`,
                          color: isDark ? '#FFFFFF' : primaryColor,
                          border: `1px solid ${primaryColor}60`,
                          fontWeight: '600'
                        } : {}}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="hidden sm:inline">{label}</span>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400 dark:text-white/40" />
                  </button>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto p-3 lg:p-4" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div
                        className="w-8 h-8 border-3 rounded-full animate-spin"
                        style={{
                          borderColor: `${primaryColor}30`,
                          borderTopColor: primaryColor
                        }}
                      ></div>
                    </div>
                  ) : error ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-12"
                    >
                      <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                      <p className="font-body text-sm text-red-400">{error}</p>
                    </motion.div>
                  ) : stats ? (
                    <>
                      {/* Overview Tab */}
                      {activeTab === 'overview' && (
                        <div className="space-y-6">

                          {/* Main Stats - Hero Style */}
                          <div className="grid grid-cols-4 gap-4">
                            {[
                              {
                                icon: BookOpen,
                                label: t('users.stats.cards.courses'),
                                value: stats.total_courses,
                                iconColor: primaryColor
                              },
                              {
                                icon: CheckCircle,
                                label: t('users.stats.cards.completed'),
                                value: stats.completed_courses,
                                iconColor: accentColor
                              },
                              {
                                icon: Clock,
                                label: t('users.stats.cards.hours'),
                                value: stats.total_time_spent_hours,
                                iconColor: secondaryColor
                              },
                              {
                                icon: Award,
                                label: t('users.stats.cards.certificates'),
                                value: stats.certificates_count,
                                iconColor: primaryColor
                              }
                            ].map(({ icon: Icon, label, value, iconColor }, index) => (
                              <motion.div
                                key={label}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="relative overflow-hidden rounded-2xl p-4 group cursor-default border"
                                style={{
                                  background: isDark
                                    ? `linear-gradient(135deg, ${iconColor}20, ${iconColor}05)`
                                    : `linear-gradient(135deg, ${iconColor}15, ${iconColor}05)`,
                                  borderColor: isDark ? `${iconColor}40` : `${iconColor}30`
                                }}
                              >
                                {/* Glow effect */}
                                <div
                                  className="absolute -top-4 -right-4 w-16 h-16 rounded-full blur-2xl opacity-0 group-hover:opacity-60 transition-opacity duration-500"
                                  style={{ backgroundColor: iconColor }}
                                />

                                <div
                                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                                  style={{ backgroundColor: `${iconColor}20` }}
                                >
                                  <Icon className="w-5 h-5" style={{ color: iconColor }} />
                                </div>

                                <div className="text-3xl font-bold mb-1" style={{ color: textColor }}>
                                  {value !== undefined && value !== null ? value : '-'}
                                </div>
                                <div className="text-xs uppercase tracking-wider" style={{ color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.6)' }}>{label}</div>
                              </motion.div>
                            ))}
                          </div>

                          {/* Activity Grid - Modern Cards */}
                          {((stats.lia_conversations_total !== undefined && stats.lia_conversations_total !== null) ||
                            (stats.quiz_total !== undefined && stats.quiz_total !== null && stats.quiz_total > 0) ||
                            (stats.lia_activities_completed !== undefined && stats.lia_activities_completed !== null)) && (
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.4 }}
                            >
                              <h3 className="text-sm font-medium text-gray-600 dark:text-white/70 mb-3 flex items-center gap-2">
                                <Activity className="w-4 h-4" style={{ color: primaryColor }} />
                                {t('users.stats.platformActivity.title')}
                              </h3>
                              <div className="grid grid-cols-3 gap-3">
                                {stats.lia_conversations_total !== undefined && (
                                  <div
                                    className="relative overflow-hidden rounded-xl p-4 border"
                                    style={{
                                      background: isDark
                                        ? `linear-gradient(135deg, ${primaryColor}20, ${primaryColor}05)`
                                        : `linear-gradient(135deg, ${primaryColor}15, ${primaryColor}05)`,
                                      borderColor: isDark ? `${primaryColor}40` : `${primaryColor}30`
                                    }}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                                        style={{
                                          backgroundColor: `${primaryColor}20`
                                        }}
                                      >
                                        <MessageSquare className="w-6 h-6" style={{ color: primaryColor }} />
                                      </div>
                                      <div>
                                        <div className="text-2xl font-bold" style={{ color: textColor }}>{stats.lia_conversations_total}</div>
                                        <div className="text-xs" style={{ color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.6)' }}>{t('users.stats.platformActivity.liaQueries')}</div>
                                      </div>
                                    </div>
                                    {stats.lia_messages_total !== undefined && (
                                      <div className="mt-2 text-xs" style={{ color: primaryColor }}>{stats.lia_messages_total} {t('users.stats.platformActivity.messages')}</div>
                                    )}
                                  </div>
                                )}

                                {stats.quiz_total !== undefined && stats.quiz_total > 0 && (
                                  <div
                                    className="relative overflow-hidden rounded-xl p-4 border"
                                    style={{
                                      background: isDark
                                        ? `linear-gradient(135deg, ${accentColor}20, ${accentColor}05)`
                                        : `linear-gradient(135deg, ${accentColor}15, ${accentColor}05)`,
                                      borderColor: isDark ? `${accentColor}40` : `${accentColor}30`
                                    }}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                                        style={{
                                          backgroundColor: `${accentColor}20`
                                        }}
                                      >
                                        <HelpCircle className="w-6 h-6" style={{ color: accentColor }} />
                                      </div>
                                      <div>
                                        <div className="text-2xl font-bold" style={{ color: textColor }}>
                                          {stats.quiz_passed || 0}<span style={{ color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)' }}>/{stats.quiz_total}</span>
                                        </div>
                                        <div className="text-xs" style={{ color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.6)' }}>{t('users.stats.platformActivity.quizzesPassed')}</div>
                                      </div>
                                    </div>
                                    {stats.quiz_average_score !== undefined && (
                                      <div className="mt-2 text-xs" style={{ color: accentColor }}>{stats.quiz_average_score}% {t('users.stats.platformActivity.average')}</div>
                                    )}
                                  </div>
                                )}

                                {stats.lia_activities_completed !== undefined && (
                                  <div
                                    className="relative overflow-hidden rounded-xl p-4 border"
                                    style={{
                                      background: isDark
                                        ? 'linear-gradient(135deg, rgba(244, 63, 94, 0.1), transparent)'
                                        : '#E9ECEF',
                                      borderColor: isDark ? 'rgba(244, 63, 94, 0.2)' : '#6C757D'
                                    }}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                                        style={{
                                          backgroundColor: isDark ? 'rgba(244, 63, 94, 0.2)' : 'rgba(244, 63, 94, 0.15)'
                                        }}
                                      >
                                        <Zap className="w-6 h-6" style={{ color: isDark ? '#F43F5E' : '#E11D48' }} />
                                      </div>
                                      <div>
                                        <div className="text-2xl font-bold" style={{ color: isDark ? '#FFFFFF' : '#0A2540' }}>{stats.lia_activities_completed}</div>
                                        <div className="text-xs" style={{ color: isDark ? 'rgba(255, 255, 255, 0.5)' : '#6C757D' }}>{t('users.stats.platformActivity.liaActivities')}</div>
                                      </div>
                                    </div>
                                    {stats.lia_activities_total !== undefined && (
                                      <div className="mt-2 text-xs" style={{ color: isDark ? 'rgba(244, 63, 94, 0.8)' : '#E11D48' }}>de {stats.lia_activities_total} {t('users.stats.platformActivity.total')}</div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}

                          {/* Progress Section - Clean Design */}
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="rounded-2xl p-5 border"
                            style={{
                              background: isDark
                                ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.05), transparent)'
                                : '#E9ECEF',
                              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#6C757D'
                            }}
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h3 className="text-sm font-medium text-gray-600 dark:text-white/70">Progreso General</h3>
                                <p className="text-xs text-gray-400 dark:text-white/40 mt-0.5">Avance en todos los cursos asignados</p>
                              </div>
                              <div
                                className="text-3xl font-bold"
                                style={{ color: primaryColor }}
                              >
                                {stats.average_progress}%
                              </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="relative h-3 rounded-full overflow-hidden bg-gray-200 dark:bg-white/5 mb-5">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${stats.average_progress}%` }}
                                transition={{ duration: 1.2, delay: 0.6, ease: [0.23, 1, 0.32, 1] }}
                                className="absolute inset-y-0 left-0 rounded-full"
                                style={{
                                  background: `linear-gradient(90deg, ${primaryColor}, ${primaryColor}CC)`,
                                  boxShadow: `0 0 20px ${primaryColor}60`
                                }}
                              />
                            </div>

                            {/* Distribution */}
                            <div className="grid grid-cols-3 gap-4">
                              <div
                                className="text-center p-3 rounded-xl border"
                                style={{
                                  background: isDark ? 'rgba(16, 185, 129, 0.1)' : '#E9ECEF',
                                  borderColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#6C757D'
                                }}
                              >
                                <div
                                  className="inline-flex items-center justify-center w-10 h-10 rounded-xl mb-2"
                                  style={{
                                    backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.15)'
                                  }}
                                >
                                  <CheckCircle className="w-5 h-5" style={{ color: isDark ? '#10B981' : '#059669' }} />
                                </div>
                                <div className="text-2xl font-bold" style={{ color: isDark ? '#10B981' : '#059669' }}>{stats.completed_courses}</div>
                                <div className="text-xs" style={{ color: isDark ? 'rgba(255, 255, 255, 0.4)' : '#6C757D' }}>{t('users.stats.generalProgress.completed')}</div>
                              </div>
                              <div
                                className="text-center p-3 rounded-xl border"
                                style={{
                                  background: isDark ? 'rgba(59, 130, 246, 0.1)' : '#E9ECEF',
                                  borderColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#6C757D'
                                }}
                              >
                                <div
                                  className="inline-flex items-center justify-center w-10 h-10 rounded-xl mb-2"
                                  style={{
                                    backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)'
                                  }}
                                >
                                  <PlayCircle className="w-5 h-5" style={{ color: isDark ? '#3B82F6' : '#2563EB' }} />
                                </div>
                                <div className="text-2xl font-bold" style={{ color: isDark ? '#3B82F6' : '#2563EB' }}>{stats.in_progress_courses}</div>
                                <div className="text-xs" style={{ color: isDark ? 'rgba(255, 255, 255, 0.4)' : '#6C757D' }}>{t('users.stats.generalProgress.inProgress')}</div>
                              </div>
                              <div
                                className="text-center p-3 rounded-xl border"
                                style={{
                                  background: isDark ? 'rgba(255, 255, 255, 0.05)' : '#E9ECEF',
                                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#6C757D'
                                }}
                              >
                                <div
                                  className="inline-flex items-center justify-center w-10 h-10 rounded-xl mb-2"
                                  style={{
                                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(108, 117, 125, 0.15)'
                                  }}
                                >
                                  <XCircle className="w-5 h-5" style={{ color: isDark ? 'rgba(255, 255, 255, 0.4)' : '#6C757D' }} />
                                </div>
                                <div className="text-2xl font-bold" style={{ color: isDark ? 'rgba(255, 255, 255, 0.4)' : '#6C757D' }}>{stats.not_started_courses}</div>
                                <div className="text-xs" style={{ color: isDark ? 'rgba(255, 255, 255, 0.4)' : '#6C757D' }}>{t('users.stats.generalProgress.notStarted')}</div>
                              </div>
                            </div>
                          </motion.div>

                        </div>
                      )}

                      {/* Courses Tab - Card Grid Design */}
                      {activeTab === 'courses' && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="space-y-4"
                        >
                          {stats.courses_data.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                                <BookOpen className="w-8 h-8 text-white/30" />
                              </div>
                              <p className="text-white/50">{t('users.stats.coursesList.empty')}</p>
                            </div>
                          ) : (
                            stats.courses_data.map((course, index) => {
                              const timeData = stats.time_by_course.find(t => t.course_id === course.course_id)
                              const progressColor = course.status === 'completed' ? '#10B981' : course.progress > 0 ? '#3B82F6' : '#6B7280'

                                return (
                                <motion.div
                                  key={course.course_id}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                  className="group relative overflow-hidden rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 transition-all duration-300"
                                >
                                  {/* Course Header */}
                                  <div className="p-5">
                                    <div className="flex items-start justify-between gap-4 mb-4">
                                      <div className="flex-1 min-w-0">
                                        <h4 className="text-base font-semibold text-gray-900 dark:text-white truncate mb-1">
                                          {course.course_title}
                                        </h4>
                                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-white/50">
                                          {course.enrolled_at && (
                                            <span>{t('users.stats.coursesList.enrolled')}: {formatDate(course.enrolled_at)}</span>
                                          )}
                                          {course.has_certificate && (
                                            <span className="flex items-center gap-1 text-amber-500 dark:text-amber-400">
                                              <Award className="w-3 h-3" />
                                              {t('users.stats.coursesList.certificate')}
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      {/* Status Badge */}
                                      <div
                                        className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium"
                                        style={{
                                          backgroundColor: `${progressColor}20`,
                                          color: progressColor
                                        }}
                                      >
                                        {course.status === 'completed' ? `✓ ${t('users.stats.coursesList.completed')}` :
                                          course.progress > 0 ? t('users.stats.coursesList.inProgress') : t('users.stats.coursesList.notStarted')}
                                      </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mb-4">
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs text-gray-500 dark:text-white/50">{t('users.stats.coursesList.progress')}</span>
                                        <span className="text-sm font-bold" style={{ color: progressColor }}>{course.progress}%</span>
                                      </div>
                                      <div className="relative h-2 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
                                        <motion.div
                                          initial={{ width: 0 }}
                                          animate={{ width: `${course.progress}%` }}
                                          transition={{ duration: 0.8, delay: index * 0.1 }}
                                          className="absolute inset-y-0 left-0 rounded-full"
                                          style={{
                                            backgroundColor: progressColor,
                                            boxShadow: `0 0 10px ${progressColor}60`
                                          }}
                                        />
                                      </div>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-4 gap-3">
                                      {/* Time */}
                                      <div className="flex items-center gap-2 p-2 rounded-xl bg-gray-100 dark:bg-white/5">
                                        <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                                          <Clock className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                                        </div>
                                        <div>
                                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                            {course.time_spent_minutes ? `${Math.round((course.time_spent_minutes / 60) * 10) / 10}h` : timeData ? `${timeData.total_hours}h` : '0h'}
                                          </div>
                                          <div className="text-xs text-gray-500 dark:text-white/40">{t('users.stats.coursesList.time')}</div>
                                        </div>
                                      </div>

                                      {/* LIA */}
                                      <div className="flex items-center gap-2 p-2 rounded-xl bg-gray-100 dark:bg-white/5">
                                        <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                                          <MessageSquare className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                                        </div>
                                        <div>
                                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                            {course.lia_conversations_count || 0}
                                          </div>
                                          <div className="text-xs text-gray-500 dark:text-white/40">{t('users.stats.coursesList.lia')}</div>
                                        </div>
                                      </div>

                                      {/* Quiz */}
                                      <div className="flex items-center gap-2 p-2 rounded-xl bg-gray-100 dark:bg-white/5">
                                        <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                                          <HelpCircle className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                                        </div>
                                        <div>
                                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                            {course.quiz_passed || 0}/{course.quiz_total || 0}
                                          </div>
                                          <div className="text-xs text-gray-500 dark:text-white/40">{t('users.stats.coursesList.quiz')}</div>
                                        </div>
                                      </div>

                                      {/* Notes */}
                                      <div className="flex items-center gap-2 p-2 rounded-xl bg-gray-100 dark:bg-white/5">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                          <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        <div>
                                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                            {course.notes_count || 0}
                                          </div>
                                          <div className="text-xs text-gray-500 dark:text-white/40">{t('users.stats.coursesList.notes')}</div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              )
                            })
                          )}
                        </motion.div>
                      )}

                      {/* Progress Tab - Visual Timeline */}
                      {activeTab === 'progress' && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="space-y-5"
                        >
                          {stats.courses_data.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                              <div
                                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                                style={{
                                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F3F4F6'
                                }}
                              >
                                <TrendingUp className="w-8 h-8" style={{ color: isDark ? 'rgba(255, 255, 255, 0.4)' : '#9CA3AF' }} />
                              </div>
                              <p style={{ color: isDark ? 'rgba(255, 255, 255, 0.6)' : '#6B7280' }}>{t('users.stats.timeline.empty')}</p>
                            </div>
                          ) : (
                            stats.courses_data.map((course, index) => {
                              const progressColor = course.status === 'completed' ? '#10B981' : course.progress > 50 ? '#3B82F6' : course.progress > 0 ? '#F59E0B' : '#6B7280'

                              return (
                                <motion.div
                                  key={course.course_id}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.15 }}
                                  className="relative"
                                >
                                  {/* Timeline line */}
                                  {index < stats.courses_data.length - 1 && (
                                    <div
                                      className="absolute left-6 top-16 bottom-0 w-0.5"
                                      style={{
                                        background: isDark
                                          ? 'linear-gradient(to bottom, rgba(255, 255, 255, 0.3), transparent)'
                                          : 'linear-gradient(to bottom, rgba(0, 0, 0, 0.2), transparent)'
                                      }}
                                    />
                                  )}

                                  <div className="flex gap-4">
                                    {/* Progress Circle */}
                                    <div className="flex-shrink-0 relative">
                                      <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold border"
                                        style={{
                                          backgroundColor: isDark ? `${progressColor}30` : `${progressColor}20`,
                                          color: progressColor,
                                          borderColor: isDark ? `${progressColor}50` : `${progressColor}30`
                                        }}
                                      >
                                        {course.progress}%
                                      </div>
                                    </div>

                                    {/* Course Content */}
                                    <div className="flex-1 pb-6">
                                      <div
                                        className="rounded-2xl border p-4"
                                        style={{
                                          background: isDark
                                            ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03))'
                                            : '#E9ECEF',
                                          borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : '#6C757D'
                                        }}
                                      >
                                        {/* Header */}
                                        <div className="flex items-start justify-between mb-4">
                                          <div>
                                            <h4 className="text-base font-semibold mb-1" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>{course.course_title}</h4>
                                            <p className="text-xs" style={{ color: isDark ? 'rgba(255, 255, 255, 0.5)' : '#6B7280' }}>
                                              {course.status === 'completed'
                                                ? `${t('users.stats.coursesList.completed')} ${formatDate(course.completed_at)}`
                                                : course.progress > 0
                                                  ? t('users.stats.coursesList.inProgress')
                                                  : t('users.stats.coursesList.notStarted')
                                              }
                                            </p>
                                          </div>
                                          {course.status === 'completed' && (
                                            <div
                                              className="w-8 h-8 rounded-full flex items-center justify-center"
                                              style={{
                                                backgroundColor: isDark ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)'
                                              }}
                                            >
                                              <CheckCircle className="w-5 h-5" style={{ color: isDark ? '#10B981' : '#059669' }} />
                                            </div>
                                          )}
                                        </div>

                                        {/* Progress Bar */}
                                        <div
                                          className="relative h-3 rounded-full overflow-hidden mb-4"
                                          style={{
                                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)'
                                          }}
                                        >
                                          <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${course.progress}%` }}
                                            transition={{ duration: 1, delay: index * 0.15 }}
                                            className="absolute inset-y-0 left-0 rounded-full"
                                            style={{
                                              background: `linear-gradient(90deg, ${progressColor}, ${progressColor}CC)`,
                                              boxShadow: `0 0 15px ${progressColor}50`
                                            }}
                                          />
                                        </div>

                                        {/* Stats Row */}
                                        <div className="flex flex-wrap gap-4">
                                          {course.modules_total !== undefined && course.modules_total > 0 && (
                                            <div className="flex items-center gap-2">
                                              <Layers className="w-4 h-4" style={{ color: isDark ? '#60A5FA' : '#3B82F6' }} />
                                              <span className="text-sm" style={{ color: isDark ? 'rgba(255, 255, 255, 0.8)' : '#4B5563' }}>
                                                <span className="font-semibold" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>{course.modules_completed || 0}</span>
                                                /{course.modules_total} {t('users.stats.timeline.modules')}
                                              </span>
                                            </div>
                                          )}
                                          {course.lessons_total !== undefined && course.lessons_total > 0 && (
                                            <div className="flex items-center gap-2">
                                              <BookOpen className="w-4 h-4" style={{ color: isDark ? '#A78BFA' : '#8B5CF6' }} />
                                              <span className="text-sm" style={{ color: isDark ? 'rgba(255, 255, 255, 0.8)' : '#4B5563' }}>
                                                <span className="font-semibold" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>{course.lessons_completed || 0}</span>
                                                /{course.lessons_total} {t('users.stats.timeline.lessons')}
                                              </span>
                                            </div>
                                          )}
                                          {course.quiz_total !== undefined && course.quiz_total > 0 && (
                                            <div className="flex items-center gap-2">
                                              <HelpCircle className="w-4 h-4" style={{ color: isDark ? '#FBBF24' : '#F59E0B' }} />
                                              <span className="text-sm" style={{ color: isDark ? 'rgba(255, 255, 255, 0.8)' : '#4B5563' }}>
                                                <span className="font-semibold" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>{course.quiz_passed || 0}</span>
                                                /{course.quiz_total} {t('users.stats.timeline.quizzes')}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              )
                            })
                          )}
                        </motion.div>
                      )}

                      {/* Activity Tab - Dashboard Style */}
                      {activeTab === 'activity' && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="space-y-5"
                        >
                          {/* Activity Summary Cards */}
                          <div className="grid grid-cols-3 gap-4">
                            {/* Notes Card */}
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="relative overflow-hidden rounded-2xl p-5 border"
                              style={{
                                background: isDark
                                  ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(16, 185, 129, 0.1))'
                                  : '#E9ECEF',
                                borderColor: isDark ? 'rgba(16, 185, 129, 0.4)' : '#6C757D'
                              }}
                            >
                              <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-emerald-500/10 blur-2xl" />
                              <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                                style={{
                                  backgroundColor: isDark ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)'
                                }}
                              >
                                <FileText className="w-6 h-6" style={{ color: isDark ? '#10B981' : '#059669' }} />
                              </div>
                              <div className="text-3xl font-bold mb-1" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>{stats.notes_count}</div>
                              <div className="text-sm" style={{ color: isDark ? 'rgba(16, 185, 129, 0.9)' : '#059669' }}>{t('users.stats.activity.notesCreated')}</div>
                            </motion.div>

                            {/* Assignments Card */}
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.1 }}
                              className="relative overflow-hidden rounded-2xl p-5 border"
                              style={{
                                background: isDark
                                  ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(59, 130, 246, 0.1))'
                                  : '#E9ECEF',
                                borderColor: isDark ? 'rgba(59, 130, 246, 0.4)' : '#6C757D'
                              }}
                            >
                              <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-blue-500/10 blur-2xl" />
                              <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                                style={{
                                  backgroundColor: isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'
                                }}
                              >
                                <Target className="w-6 h-6" style={{ color: isDark ? '#3B82F6' : '#2563EB' }} />
                              </div>
                              <div className="text-3xl font-bold mb-1" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
                                {stats.completed_assignments}
                                <span style={{ color: isDark ? 'rgba(255, 255, 255, 0.6)' : '#9CA3AF' }}>/{stats.total_assignments}</span>
                              </div>
                              <div className="text-sm" style={{ color: isDark ? 'rgba(59, 130, 246, 0.9)' : '#2563EB' }}>{t('users.stats.activity.assignments')}</div>
                            </motion.div>

                            {/* Certificates Card */}
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.2 }}
                              className="relative overflow-hidden rounded-2xl p-5 border"
                              style={{
                                background: isDark
                                  ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(245, 158, 11, 0.1))'
                                  : '#E9ECEF',
                                borderColor: isDark ? 'rgba(245, 158, 11, 0.4)' : '#6C757D'
                              }}
                            >
                              <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-amber-500/10 blur-2xl" />
                              <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                                style={{
                                  backgroundColor: isDark ? 'rgba(245, 158, 11, 0.3)' : 'rgba(245, 158, 11, 0.2)'
                                }}
                              >
                                <Award className="w-6 h-6" style={{ color: isDark ? '#F59E0B' : '#D97706' }} />
                              </div>
                              <div className="text-3xl font-bold mb-1" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>{stats.certificates_count}</div>
                              <div className="text-sm" style={{ color: isDark ? 'rgba(245, 158, 11, 0.9)' : '#D97706' }}>{t('users.stats.activity.certificates')}</div>
                            </motion.div>
                          </div>

                          {/* Completion Timeline */}
                          {stats.completed_by_month.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.3 }}
                              className="rounded-2xl border p-5"
                              style={{
                                background: isDark
                                  ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03))'
                                  : '#E9ECEF',
                                borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : '#6C757D'
                              }}
                            >
                              <div className="flex items-center gap-2 mb-4">
                                <Calendar className="w-5 h-5" style={{ color: primaryColor }} />
                                <h3 className="text-sm font-medium text-gray-900 dark:text-white">{t('users.stats.activity.completionHistory')}</h3>
                              </div>

                              <div className="space-y-3">
                                {stats.completed_by_month.map((item, index) => {
                                  const maxCount = Math.max(...stats.completed_by_month.map(m => m.count), 1)
                                  const percentage = (item.count / maxCount) * 100

                                  return (
                                    <motion.div
                                      key={item.month}
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: 0.4 + index * 0.1 }}
                                      className="flex items-center gap-4"
                                    >
                                      <div
                                        className="w-20 text-xs flex-shrink-0"
                                        style={{ color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#6B7280' }}
                                      >
                                        {formatMonth(item.month)}
                                      </div>
                                      <div className="flex-1 relative h-8">
                                        <motion.div
                                          initial={{ width: 0 }}
                                          animate={{ width: `${percentage}%` }}
                                          transition={{ duration: 0.8, delay: 0.5 + index * 0.1 }}
                                          className="absolute inset-y-0 left-0 rounded-lg flex items-center justify-end px-3"
                                          style={{
                                            background: `linear-gradient(90deg, ${primaryColor}40, ${primaryColor}80)`,
                                            minWidth: '60px'
                                          }}
                                        >
                                          <span className="text-xs font-semibold text-gray-900 dark:text-white">
                                            {item.count} {t('users.stats.activity.courses')}
                                          </span>
                                        </motion.div>
                                      </div>
                                    </motion.div>
                                  )
                                })}
                              </div>
                            </motion.div>
                          )}

                          {/* Recent Activity Feed */}
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="rounded-2xl border p-5"
                            style={{
                              background: isDark
                                ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03))'
                                : '#E9ECEF',
                              borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : '#6C757D'
                            }}
                          >
                            <div className="flex items-center gap-2 mb-4">
                              <Activity className="w-5 h-5" style={{ color: primaryColor }} />
                              <h3 className="text-sm font-medium" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>Resumen de Actividad</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div
                                className="flex items-center gap-3 p-3 rounded-xl border"
                                style={{
                                  background: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E9ECEF',
                                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#6C757D'
                                }}
                              >
                                <Clock className="w-5 h-5" style={{ color: isDark ? 'rgba(255, 255, 255, 0.6)' : '#6C757D' }} />
                                <div>
                                  <div className="text-lg font-semibold" style={{ color: isDark ? '#FFFFFF' : '#0A2540' }}>{stats.total_time_spent_hours}h</div>
                                  <div className="text-xs" style={{ color: isDark ? 'rgba(255, 255, 255, 0.5)' : '#6C757D' }}>{t('users.stats.activity.studyTime')}</div>
                                </div>
                              </div>
                              <div
                                className="flex items-center gap-3 p-3 rounded-xl border"
                                style={{
                                  background: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E9ECEF',
                                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#6C757D'
                                }}
                              >
                                <BookOpen className="w-5 h-5" style={{ color: isDark ? 'rgba(255, 255, 255, 0.6)' : '#6C757D' }} />
                                <div>
                                  <div className="text-lg font-semibold" style={{ color: isDark ? '#FFFFFF' : '#0A2540' }}>{stats.completed_lessons}/{stats.total_lessons}</div>
                                  <div className="text-xs" style={{ color: isDark ? 'rgba(255, 255, 255, 0.5)' : '#6C757D' }}>{t('users.stats.activity.lessons')}</div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        </motion.div>
                      )}
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
