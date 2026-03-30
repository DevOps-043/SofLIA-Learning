'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
    Users,
    BookOpen,
    CheckCircle,
    Clock,
    TrendingUp,
    Award,
    BarChart3,
    Target,
    XCircle,
    UserCheck,
    MoreHorizontal,
    X,
    Calendar,
    Zap,
    UsersRound,
    Trophy
} from 'lucide-react'
import { EngagementAnalytics } from './EngagementAnalytics'
import Image from 'next/image'
import { useBusinessAnalyticsLogic, useUserDetailModalLogic } from '../hooks/useBusinessAnalyticsLogic'

// ============================================
// COMPONENTE PRINCIPAL - SOLO KPIs
// ============================================
export function BusinessAnalytics() {
    const {
        t,
        data,
        isLoading,
        error,
        refetch,
        activeTab,
        setActiveTab,
        selectedUser,
        setSelectedUser,
        cardBg,
        cardBorder,
        textColor,
        accentColor,
        secondaryColor,
    } = useBusinessAnalyticsLogic()

    // Loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center">
                    <div
                        className="w-16 h-16 border-4 rounded-full animate-spin mx-auto mb-4"
                        style={{ borderColor: `${accentColor}30`, borderTopColor: accentColor }}
                    />
                    <p className="opacity-70" style={{ color: textColor }}>{t('analytics.loading')}</p>
                </div>
            </div>
        )
    }

    // Error state
    if (error) {
        return (
            <div className="text-center py-20">
                <XCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
                <p className="text-lg mb-4 text-red-400">{error}</p>
                <button
                    onClick={refetch}
                    className="px-6 py-2 rounded-xl transition-all"
                    style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                >
                    {t('analytics.retry')}
                </button>
            </div>
        )
    }

    if (!data) {
        return (
            <div className="text-center py-20">
                <p className="opacity-70" style={{ color: textColor }}>{t('analytics.noData')}</p>
            </div>
        )
    }



    return (
        <div className="w-full space-y-8 text-gray-900 dark:text-slate-50" style={{ ...(textColor ? { color: textColor } : {}) }}>
            {/* Hero Header - Redesigned */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-3xl p-8 shadow-xl"
                style={{
                    backgroundColor: '#0A2540',
                    color: '#FFFFFF',
                }}
            >
                {/* Background Image Layer */}
                <div className="absolute inset-0 z-0">
                    <Image
                        src="/images/teams-header.png"
                        alt="Analytics Header"
                        fill
                        className="object-cover"
                        style={{ opacity: 0.5 }}
                        priority
                    />
                </div>

                {/* Blue Gradient Overlay - Crucial for the 'Blue' look while keeping image visible */}
                <div
                    className="absolute inset-0 bg-gradient-to-r from-[#0A2540]/90 via-[#0A2540]/50 to-transparent z-0 pointer-events-none"
                />

                {/* Decorative Particles/Grid - Subtle */}
                <div
                    className="absolute inset-0 opacity-10 z-0 pointer-events-none"
                    style={{
                        backgroundImage: 'radial-gradient(white 1px, transparent 1px)',
                        backgroundSize: '30px 30px'
                    }}
                />

                {/* Content Layer */}
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-inner">
                            <BarChart3 className="w-5 h-5" style={{ color: '#FFFFFF' }} />
                        </div>
                        <span
                            className="text-sm font-bold tracking-widest uppercase drop-shadow-sm"
                            style={{ color: 'rgba(219, 234, 254, 0.9)' }}
                        >
                            {t('analytics.center')}
                        </span>
                    </div>

                    <h1
                        className="text-3xl md:text-4xl font-bold mb-3 tracking-tight drop-shadow-md"
                        style={{ color: '#FFFFFF' }}
                    >
                        {t('analytics.headerTitle')}
                    </h1>

                    <p
                        className="text-base max-w-2xl leading-relaxed drop-shadow-sm"
                        style={{ color: '#EFF6FF' }}
                    >
                        {t('analytics.headerSubtitle')}
                    </p>
                </div>
            </motion.div>

            {/* Tabs Navigation */}
            <div className="flex flex-wrap gap-2 mb-6">
                <TabButton
                    isActive={activeTab === 'overview'}
                    onClick={() => setActiveTab('overview')}
                    label={t('analytics.tabs.overview')}
                    icon={Target}
                    accentColor={accentColor}
                    textColor={textColor}
                />
                <TabButton
                    isActive={activeTab === 'users'}
                    onClick={() => setActiveTab('users')}
                    label={t('analytics.tabs.users')}
                    icon={UserCheck}
                    accentColor={accentColor}
                    textColor={textColor}
                />
                <TabButton
                    isActive={activeTab === 'engagement'}
                    onClick={() => setActiveTab('engagement')}
                    label={t('analytics.tabs.engagement')}
                    icon={Users}
                    accentColor={accentColor}
                    textColor={textColor}
                />
                <TabButton
                    isActive={activeTab === 'teams'}
                    onClick={() => setActiveTab('teams')}
                    label={t('analytics.tabs.teams')}
                    icon={UsersRound}
                    accentColor={accentColor}
                    textColor={textColor}
                />
            </div>

            {/* Content Content Switcher */}
            <div className="min-h-[500px]">
                {activeTab === 'overview' && (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-8"
                    >
                        {/* KPI Cards Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <KPICard
                                icon={Users}
                                label={t('analytics.kpis.totalUsers')}
                                value={data.general_metrics.total_users}
                                color={accentColor}
                                cardBg={cardBg}
                                cardBorder={cardBorder}
                            />
                            <KPICard
                                icon={BookOpen}
                                label={t('analytics.kpis.assignedCourses')}
                                value={data.general_metrics.total_courses_assigned}
                                color="#8b5cf6"
                                cardBg={cardBg}
                                cardBorder={cardBorder}
                            />
                            <KPICard
                                icon={CheckCircle}
                                label={t('analytics.kpis.completed')}
                                value={data.general_metrics.completed_courses}
                                color="#10b981"
                                cardBg={cardBg}
                                cardBorder={cardBorder}
                            />
                            <KPICard
                                icon={TrendingUp}
                                label={t('analytics.kpis.avgProgress')}
                                value={`${data.general_metrics.average_progress}%`}
                                color="#f59e0b"
                                cardBg={cardBg}
                                cardBorder={cardBorder}
                            />
                        </div>

                        {/* Secondary Metrics Row */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <SmallMetricCard
                                icon={Clock}
                                label={t('analytics.kpis.totalTime')}
                                value={`${data.general_metrics.total_time_hours}h`}
                                color={accentColor}
                                cardBg={cardBg}
                                cardBorder={cardBorder}
                            />
                            <SmallMetricCard
                                icon={Award}
                                label={t('analytics.kpis.certificates')}
                                value={data.general_metrics.total_certificates}
                                color="#8b5cf6"
                                cardBg={cardBg}
                                cardBorder={cardBorder}
                            />
                            <SmallMetricCard
                                icon={UserCheck}
                                label={t('analytics.kpis.activeUsers')}
                                value={data.general_metrics.active_users}
                                color="#10b981"
                                cardBg={cardBg}
                                cardBorder={cardBorder}
                            />
                            <SmallMetricCard
                                icon={Target}
                                label={t('analytics.kpis.retentionRate')}
                                value={`${data.general_metrics.retention_rate}%`}
                                color="#f59e0b"
                                cardBg={cardBg}
                                cardBorder={cardBorder}
                            />
                        </div>
                    </motion.div>
                )}

                {activeTab === 'users' && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="rounded-3xl border overflow-hidden backdrop-blur-sm bg-white dark:bg-[#0F1419] border-gray-200 dark:border-slate-700/30"
                    >
                        <div className="p-6 border-b border-gray-200 dark:border-slate-700/30">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('analytics.usersTable.title')}</h3>
                            <p className="text-sm opacity-60">{t('analytics.usersTable.subtitle')}</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
                                        <th className="p-4 font-medium">{t('analytics.usersTable.columns.user')}</th>
                                        <th className="p-4 font-medium">{t('analytics.usersTable.columns.role')}</th>
                                        <th className="p-4 font-medium">{t('analytics.usersTable.columns.progress')}</th>
                                        <th className="p-4 font-medium text-center">{t('analytics.usersTable.columns.courses')}</th>
                                        <th className="p-4 font-medium">{t('analytics.usersTable.columns.time')}</th>
                                        <th className="p-4 font-medium">{t('analytics.usersTable.columns.lastActivity')}</th>
                                        <th className="p-4 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                                    {data.user_analytics && data.user_analytics.length > 0 ? (
                                        data.user_analytics.map((user: any) => {
                                            // Obtener el nombre del usuario con múltiples fallbacks
                                            const displayName = user.name ||
                                                user.display_name ||
                                                (user.first_name && user.last_name ? `${user.first_name} ${user.last_name}`.trim() : null) ||
                                                user.first_name ||
                                                user.username ||
                                                user.email?.split('@')[0] ||
                                                t('analytics.usersTable.noName')
                                            const initials = displayName && displayName !== t('analytics.usersTable.noName')
                                                ? displayName.charAt(0).toUpperCase()
                                                : user.email?.charAt(0).toUpperCase() || '?'

                                            return (
                                                <tr key={user.user_id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-3">
                                                            {user.profile_picture_url ? (
                                                                <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 shadow-lg shrink-0 border-gray-200 dark:border-gray-700">
                                                                    <Image
                                                                        src={user.profile_picture_url}
                                                                        alt={displayName}
                                                                        fill
                                                                        className="object-cover"
                                                                        sizes="40px"
                                                                        onError={(e) => {
                                                                            // Si la imagen falla, mostrar iniciales
                                                                            const target = e.target as HTMLImageElement
                                                                            target.style.display = 'none'
                                                                            const parent = target.parentElement
                                                                            if (parent) {
                                                                                parent.innerHTML = `<div class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg">${initials}</div>`
                                                                            }
                                                                        }}
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg">
                                                                    {initials}
                                                                </div>
                                                            )}
                                                            <div>
                                                                <p className="font-semibold text-sm text-gray-900 dark:text-white">{displayName}</p>
                                                                <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 min-w-[150px]">
                                                        <span className={`
                                                inline-block px-3 py-1.5 rounded-lg text-xs font-medium border whitespace-normal break-words max-w-full
                                                ${user.role?.toLowerCase().includes('admin') ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' :
                                                                user.role?.toLowerCase().includes('instructor') ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' :
                                                                    'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'}
                                            `}>
                                                            {user.role || t('analytics.usersTable.student')}
                                                        </span>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden max-w-[100px]">
                                                                <div
                                                                    className="h-full rounded-full transition-all duration-500"
                                                                    style={{
                                                                        width: `${user.average_progress}%`,
                                                                        backgroundColor: user.average_progress >= 75 ? '#10b981' : user.average_progress >= 40 ? '#f59e0b' : '#ef4444'
                                                                    }}
                                                                />
                                                            </div>
                                                            <span className="text-xs font-mono text-gray-700 dark:text-gray-300">{user.average_progress}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <div className="inline-flex items-center gap-1 text-sm bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-lg border border-gray-200 dark:border-white/5">
                                                            <span className="text-green-600 dark:text-green-400 font-bold">{user.courses_completed}</span>
                                                            <span className="text-gray-400 opacity-60">/</span>
                                                            <span className="text-gray-700 dark:text-gray-300 font-medium">{user.courses_assigned}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="inline-flex items-center gap-1 text-sm bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-lg border border-gray-200 dark:border-white/5">
                                                            <Clock className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                                                            <span className="text-sm font-mono font-medium text-gray-700 dark:text-gray-300">{Math.round(user.total_time_minutes / 60 * 10) / 10}h</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-sm">
                                                        <div className="inline-flex items-center text-sm bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-lg border border-gray-200 dark:border-white/5 text-gray-700 dark:text-gray-300 font-medium">
                                                            {user.last_active ? new Date(user.last_active).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : t('analytics.usersTable.never')}
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <button
                                                            onClick={() => setSelectedUser(user)}
                                                            className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                                        >
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={7} className="p-8 text-center opacity-50">
                                                {t('analytics.usersTable.noUsers')}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'engagement' && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        <EngagementAnalytics data={data} />
                    </motion.div>
                )}

                {activeTab === 'teams' && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                    >
                        {/* Teams KPIs */}
                        <div className="grid grid-cols-4 gap-4">
                            <div className="p-5 rounded-2xl border bg-white dark:bg-[#0F1419] border-gray-200 dark:border-slate-700/30">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 rounded-lg" style={{ backgroundColor: `${accentColor}20` }}>
                                        <UsersRound className="w-5 h-5" style={{ color: accentColor }} />
                                    </div>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">Total Equipos</span>
                                </div>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white">{data?.teams?.total_teams || 0}</p>
                            </div>
                            <div className="p-5 rounded-2xl border bg-white dark:bg-[#0F1419] border-gray-200 dark:border-slate-700/30">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 rounded-lg bg-emerald-500/20">
                                        <Trophy className="w-5 h-5 text-emerald-400" />
                                    </div>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">Mejor Progreso</span>
                                </div>
                                <p className="text-3xl font-bold text-emerald-500">
                                    {data?.teams?.ranking?.[0]?.stats?.average_progress || 0}%
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{data?.teams?.ranking?.[0]?.name || '-'}</p>
                            </div>
                            <div className="p-5 rounded-2xl border bg-white dark:bg-[#0F1419] border-gray-200 dark:border-slate-700/30">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 rounded-lg bg-blue-500/20">
                                        <Users className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">Total Miembros</span>
                                </div>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                    {data?.teams?.teams?.reduce((sum: number, t: any) => sum + (t.member_count || 0), 0) || 0}
                                </p>
                            </div>
                            <div className="p-5 rounded-2xl border bg-white dark:bg-[#0F1419] border-gray-200 dark:border-slate-700/30">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 rounded-lg bg-purple-500/20">
                                        <Zap className="w-5 h-5 text-purple-400" />
                                    </div>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">Total SofLIA Chats</span>
                                </div>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                    {data?.teams?.teams?.reduce((sum: number, t: any) => sum + (t.stats?.lia_conversations || 0), 0) || 0}
                                </p>
                            </div>
                        </div>

                        {/* Progress Chart (Bar visualization) */}
                        <div className="p-6 rounded-2xl border bg-white dark:bg-[#0F1419] border-gray-200 dark:border-slate-700/30">
                            <h3 className="font-semibold mb-6 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5" style={{ color: accentColor }} />
                                {t('analytics.teams.progressComparison')}
                            </h3>

                            {data?.teams?.ranking?.length > 0 ? (
                                <div className="space-y-4">
                                    {data.teams.ranking.map((team: any, idx: number) => {
                                        const maxProgress = Math.max(...data.teams.ranking.map((t: any) => t.stats.average_progress));
                                        const barWidth = maxProgress > 0 ? (team.stats.average_progress / maxProgress) * 100 : 0;

                                        return (
                                            <div key={team.team_id} className="flex items-center gap-4">
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                                                    style={{
                                                        backgroundColor: idx === 0 ? '#fbbf24' : idx === 1 ? '#94a3b8' : idx === 2 ? '#cd7f32' : 'rgba(255,255,255,0.1)',
                                                        color: idx < 3 ? '#000' : '#fff'
                                                    }}
                                                >
                                                    {idx + 1}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="font-medium text-sm text-gray-900 dark:text-white">{team.name}</span>
                                                        <span className="text-sm text-gray-500 dark:text-gray-400">{team.member_count} {t('analytics.teams.members')}</span>
                                                    </div>
                                                    <div className="relative h-6 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                                                        <motion.div
                                                            className="h-full rounded-full"
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${barWidth}%` }}
                                                            transition={{ duration: 0.8, delay: idx * 0.1 }}
                                                            style={{
                                                                background: `linear-gradient(90deg, ${accentColor}, ${secondaryColor})`
                                                            }}
                                                        />
                                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-900 dark:text-white">
                                                            {team.stats.average_progress}%
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-12 opacity-50">
                                    <UsersRound className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                    <p>{t('analytics.teams.noTeams')}</p>
                                </div>
                            )}
                        </div>

                        {/* Team Cards Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            {data?.teams?.teams?.map((team: any) => (
                                <div key={team.team_id} className="p-5 rounded-2xl border bg-white dark:bg-[#0F1419] border-gray-200 dark:border-slate-700/30">
                                    <div className="flex items-start gap-4">
                                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                                            {team.image_url ? (
                                                <img src={team.image_url} alt={team.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <UsersRound className="w-7 h-7 text-white" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-lg">{team.name}</h4>
                                            <p className="text-sm opacity-50 line-clamp-1">{team.description || t('analytics.teams.noDescription')}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-3 mt-4">
                                        <div className="text-center p-3 rounded-lg bg-gray-100 dark:bg-white/5">
                                            <p className="text-xl font-bold" style={{ color: accentColor }}>{team.member_count}</p>
                                            <p className="text-xs opacity-50">Miembros</p>
                                        </div>
                                        <div className="text-center p-3 rounded-lg bg-gray-100 dark:bg-white/5">
                                            <p className="text-xl font-bold text-emerald-400">{team.stats?.average_progress || 0}%</p>
                                            <p className="text-xs opacity-50">Progreso</p>
                                        </div>
                                        <div className="text-center p-3 rounded-lg bg-gray-100 dark:bg-white/5">
                                            <p className="text-xl font-bold text-blue-400">{team.stats?.total_time_hours || 0}h</p>
                                            <p className="text-xs opacity-50">Tiempo</p>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/10">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500 dark:text-gray-400">{t('analytics.teams.coursesCompleted')}</span>
                                            <span className="font-medium text-gray-900 dark:text-white">{team.stats?.courses_completed || 0} / {team.stats?.total_enrollments || 0}</span>
                                        </div>
                                        <div className="h-2 bg-gray-200 dark:bg-white/10 rounded-full mt-2 overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                                                style={{
                                                    width: `${team.stats?.total_enrollments > 0 ? (team.stats.courses_completed / team.stats.total_enrollments * 100) : 0}%`
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>

            <AnimatePresence>
                {selectedUser && (
                    <UserDetailModal
                        user={selectedUser}
                        onClose={() => setSelectedUser(null)}
                        theme={{ cardBg, cardBorder, accentColor, textColor }}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}

function UserDetailModal({ user, onClose, theme }: any) {
    const {
        t,
        subTab,
        setSubTab,
        displayName,
        initials,
        getHeatmapColor,
        maxHour,
    } = useUserDetailModalLogic(user)

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="relative flex flex-col w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl border shadow-2xl bg-white dark:bg-[#0f172a] border-gray-200 dark:border-slate-700 text-gray-900 dark:text-slate-50"
                style={{
                    ...(theme.cardBorder ? { borderColor: theme.cardBorder } : {}),
                }}
            >
                {/* Header */}
                <div className="relative shrink-0 bg-gray-100 dark:bg-gray-800 p-6 pb-4">
                    {/* Gradiente de colores azul y morado */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 pointer-events-none" />
                    <div className="relative z-10">
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 z-10 p-2 transition-colors rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                        >
                            <X className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                        </button>

                        <div className="flex items-start gap-5">
                            {user.profile_picture_url ? (
                                <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-4 shadow-xl shrink-0" style={{ borderColor: theme.cardBg }}>
                                    <Image
                                        src={user.profile_picture_url}
                                        alt={user.name || t('analytics.usersTable.userDefault')}
                                        fill
                                        className="object-cover"
                                        sizes="80px"
                                    />
                                </div>
                            ) : (
                                <div className="w-20 h-20 text-3xl font-bold text-white border-4 rounded-2xl shadow-xl flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 shrink-0" style={{ borderColor: theme.cardBg }}>
                                    {initials}
                                </div>
                            )}
                            <div className="flex-1 pt-1">
                                <h2 className="text-2xl font-bold mb-1 text-gray-900 dark:text-white">{displayName}</h2>
                                <div className="flex items-center gap-3 text-sm flex-wrap">
                                    <span className="text-gray-600 dark:text-gray-300">{user.email}</span>
                                    <span className="w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-500" />
                                    <span className="capitalize text-gray-600 dark:text-gray-300">{user.role || t('analytics.usersTable.userDefault')}</span>
                                </div>
                            </div>
                        </div>

                        {/* Key Stats Badges */}
                        <div className="flex gap-3 mt-4">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/60 dark:bg-black/30 backdrop-blur-sm border border-gray-200 dark:border-white/10 shadow-sm">
                                <Zap className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                                <div>
                                    <p className="text-[10px] uppercase font-bold tracking-wider opacity-60 text-gray-700 dark:text-white">{t('analytics.userDetail.streak')}</p>
                                    <p className="font-bold text-sm leading-none text-gray-900 dark:text-white">{user.stats?.current_streak || 0} {t('analytics.userDetail.days')}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/60 dark:bg-black/30 backdrop-blur-sm border border-gray-200 dark:border-white/10 shadow-sm">
                                <Target className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                                <div>
                                    <p className="text-[10px] uppercase font-bold tracking-wider opacity-60 text-gray-700 dark:text-white">{t('analytics.userDetail.adherence')}</p>
                                    <p className="font-bold text-sm leading-none text-gray-900 dark:text-white">{user.stats?.planner?.adherence || 0}%</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/60 dark:bg-black/30 backdrop-blur-sm border border-gray-200 dark:border-white/10 shadow-sm">
                                <Clock className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                                <div>
                                    <p className="text-[10px] uppercase font-bold tracking-wider opacity-60 text-gray-700 dark:text-white">{t('analytics.userDetail.totalTime')}</p>
                                    <p className="font-bold text-sm leading-none text-gray-900 dark:text-white">{Math.round((user.total_time_minutes || 0) / 60)}h</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs & Content */}
                <div className="flex-1 p-6 overflow-y-auto">

                    {/* Sub-Tabs Navigation */}
                    <div className="flex gap-6 mb-8 border-b" style={{ borderColor: theme.cardBorder }}>
                        {['activity', 'planner', 'courses'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setSubTab(tab as any)}
                                className={`pb-4 text-sm font-medium transition-all relative ${subTab === tab ? 'text-blue-500 dark:text-blue-400 opacity-100' : 'text-gray-500 dark:text-gray-400 opacity-60 hover:opacity-100'}`}
                            >
                                <span className="capitalize">{tab === 'activity' ? t('analytics.userDetail.tabs.activity') : tab === 'planner' ? t('analytics.userDetail.tabs.planner') : t('analytics.userDetail.tabs.courses')}</span>
                                {subTab === tab && (
                                    <motion.div layoutId="modalTab" className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-blue-500" />
                                )}
                            </button>
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        {subTab === 'activity' && (
                            <motion.div
                                key="activity"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-6"
                            >
                                {/* Heatmap Section */}
                                <div className="p-6 rounded-2xl border bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10" style={{ ...(theme.cardBorder ? { borderColor: theme.cardBorder } : {}) }}>
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="flex items-center gap-2 text-lg font-semibold">
                                            <Calendar className="w-5 h-5 text-blue-400" />
                                            {t('analytics.userDetail.history')}
                                            <span className="ml-2 text-xs font-normal opacity-50">{t('analytics.userDetail.last6Months')}</span>
                                        </h3>
                                    </div>

                                    <div className="flex gap-2">
                                        {/* Day labels */}
                                        <div className="flex flex-col justify-between h-[88px] gap-1 pt-6 text-[9px] font-mono leading-3 opacity-40">
                                            <span>Pos</span>
                                            <span>Lun</span>
                                            <span>Mié</span>
                                            <span>Vie</span>
                                        </div>

                                        <div className="flex-1 pb-2 overflow-x-auto">
                                            <div className="flex gap-1 min-w-max">
                                                {(() => {
                                                    const weeksToDisplay = 26;
                                                    const today = new Date();
                                                    const startDate = new Date(today);
                                                    startDate.setDate(today.getDate() - (weeksToDisplay * 7));
                                                    startDate.setDate(startDate.getDate() - startDate.getDay());

                                                    const weeks = [];
                                                    let currentDate = new Date(startDate);

                                                    for (let w = 0; w < weeksToDisplay; w++) {
                                                        const days = [];
                                                        for (let d = 0; d < 7; d++) {
                                                            const dateStr = currentDate.toISOString().split('T')[0];
                                                            const activity = user.stats?.activity_calendar?.find((a: any) => a.date === dateStr);
                                                            const level = activity ? activity.level : 0;
                                                            const count = activity ? activity.count : 0;
                                                            const isFuture = currentDate > today;

                                                            days.push(
                                                                <div
                                                                    key={d}
                                                                    className={`w-3 h-3 rounded-sm text-[0px] ${isFuture ? 'invisible' : getHeatmapColor(level)}`}
                                                                    title={`${currentDate.toLocaleDateString()}: ${count} minutos`}
                                                                />
                                                            );
                                                            currentDate.setDate(currentDate.getDate() + 1);
                                                        }
                                                        weeks.push(<div key={w} className="flex flex-col gap-1">{days}</div>);
                                                    }
                                                    return weeks;
                                                })()}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-2 mt-4 text-xs opacity-40">
                                        <span>{t('analytics.userDetail.less')}</span>
                                        <div className="w-3 h-3 rounded-sm bg-gray-200 dark:bg-white/5" />
                                        <div className="w-3 h-3 rounded-sm bg-emerald-500/20" />
                                        <div className="w-3 h-3 rounded-sm bg-emerald-500/60" />
                                        <div className="w-3 h-3 rounded-sm bg-emerald-500" />
                                        <span>{t('analytics.userDetail.more')}</span>
                                    </div>
                                </div>

                                {/* Preferred Time Section */}
                                <div className="p-6 rounded-2xl border bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10" style={{ ...(theme.cardBorder ? { borderColor: theme.cardBorder } : {}) }}>
                                    <h3 className="flex items-center gap-2 mb-4 text-lg font-semibold">
                                        <Clock className="w-5 h-5 text-purple-400" />
                                        Horarios de Estudio Preferidos
                                    </h3>
                                    <div className="flex items-end h-32 gap-1">
                                        {user.stats?.hourly_distribution?.map((count: number, hour: number) => (
                                            <div key={hour} className="flex flex-col items-center flex-1 gap-1 group">
                                                <div
                                                    className="relative w-full rounded-t-sm bg-purple-500/30 hover:bg-purple-500 transition-colors"
                                                    style={{ height: `${maxHour > 0 ? (count / maxHour) * 100 : 0}%`, minHeight: '4px' }}
                                                >
                                                    <div className="absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                                                        {count} sesiones
                                                    </div>
                                                </div>
                                                <span className="text-[9px] opacity-30">{hour}h</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {subTab === 'planner' && (
                            <motion.div
                                key="planner"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="grid grid-cols-2 gap-4"
                            >
                                <div className="p-6 rounded-2xl border bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 flex flex-col items-center justify-center text-center" style={{ ...(theme.cardBorder ? { borderColor: theme.cardBorder } : {}) }}>
                                    <div className="w-32 h-32 rounded-full border-8 border-white/5 flex items-center justify-center relative mb-4">
                                        <svg className="absolute inset-0 w-full h-full -rotate-90">
                                            <circle
                                                cx="64" cy="64" r="56"
                                                fill="none" strokeWidth="8" stroke={theme.accentColor}
                                                strokeDasharray="351"
                                                strokeDashoffset={351 - (351 * (user.stats?.planner?.adherence || 0)) / 100}
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                        <div>
                                            <span className="text-3xl font-bold">{user.stats?.planner?.adherence || 0}%</span>
                                        </div>
                                    </div>
                                    <p className="font-medium">Tasa de Adherencia</p>
                                    <p className="text-xs opacity-50">Sesiones completadas vs planificadas</p>
                                </div>
                                <div className="p-6 rounded-2xl border bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10" style={{ ...(theme.cardBorder ? { borderColor: theme.cardBorder } : {}) }}>
                                    <h3 className="font-semibold mb-4">Resumen de Sesiones</h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="opacity-70">Total Planificadas</span>
                                            <span className="font-bold text-lg">{user.stats?.planner?.total_sessions ?? 0}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="opacity-70">Completadas</span>
                                            <span className="font-bold text-lg text-emerald-400">{user.stats?.planner?.completed ?? 0}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="opacity-70">Pendientes</span>
                                            <span className="font-bold text-lg text-amber-400">{user.stats?.planner?.pending ?? 0}</span>
                                        </div>
                                        <div className="pt-3 mt-3 border-t border-white/10">
                                            <div className="flex justify-between items-center">
                                                <span className="opacity-70">Tasa de Cumplimiento</span>
                                                <span className="font-bold text-lg text-blue-400">{user.stats?.planner?.adherence ?? 0}%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {subTab === 'courses' && (
                            <motion.div
                                key="courses"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-6"
                            >
                                {/* Stats Grid */}
                                <div className="grid grid-cols-4 gap-3">
                                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                                        <p className="text-3xl font-bold text-blue-400">{Math.round((user.stats?.courses?.total_lesson_time_minutes || 0) / 60)}h</p>
                                        <p className="text-xs opacity-50 mt-1">Tiempo Total</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                                        <p className="text-3xl font-bold text-emerald-400">{user.stats?.courses?.lessons_completed || 0}</p>
                                        <p className="text-xs opacity-50 mt-1">Lecciones</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                                        <p className="text-3xl font-bold text-purple-400">{user.stats?.courses?.quizzes_passed || 0}/{user.stats?.courses?.quizzes_completed || 0}</p>
                                        <p className="text-xs opacity-50 mt-1">Quizzes Aprobados</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                                        <p className="text-3xl font-bold text-amber-400">{user.stats?.courses?.notes_count || 0}</p>
                                        <p className="text-xs opacity-50 mt-1">Notas Creadas</p>
                                    </div>
                                </div>

                                {/* Courses Breakdown */}
                                <div className="p-5 rounded-2xl border bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10" style={{ ...(theme.cardBorder ? { borderColor: theme.cardBorder } : {}) }}>
                                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                                        <BookOpen className="w-5 h-5 text-blue-400" />
                                        Desglose por Curso
                                    </h3>

                                    {user.stats?.courses?.breakdown?.length > 0 ? (
                                        <div className="space-y-4">
                                            {user.stats.courses.breakdown.map((course: any, idx: number) => (
                                                <div key={idx} className="p-3 rounded-lg bg-black/20">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="font-medium text-sm truncate flex-1 mr-4">{course.course_title}</span>
                                                        <span className={`text-xs px-2 py-0.5 rounded-full ${course.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                                                            course.status === 'active' ? 'bg-blue-500/20 text-blue-400' :
                                                                'bg-gray-500/20 text-gray-400'
                                                            }`}>
                                                            {course.status === 'completed' ? 'Completado' :
                                                                course.status === 'active' ? 'En Progreso' : 'Inscrito'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all"
                                                                style={{ width: `${course.progress || 0}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-sm font-bold w-12 text-right">{Math.round(course.progress || 0)}%</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 opacity-50">
                                            <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                            <p className="text-sm">No hay cursos inscritos</p>
                                        </div>
                                    )}
                                </div>

                                {/* LIA Interaction Stats */}
                                <div className="p-5 rounded-2xl border bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10" style={{ ...(theme.cardBorder ? { borderColor: theme.cardBorder } : {}) }}>
                                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                                        <Zap className="w-5 h-5 text-purple-400" />
                                        Interacciones con LIA
                                    </h3>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-3 rounded-lg bg-black/20 text-center">
                                            <p className="text-2xl font-bold text-purple-400">{user.stats?.lia?.total_conversations || 0}</p>
                                            <p className="text-xs opacity-50">Conversaciones</p>
                                        </div>
                                        <div className="p-3 rounded-lg bg-black/20 text-center">
                                            <p className="text-2xl font-bold text-blue-400">{user.stats?.lia?.total_messages || 0}</p>
                                            <p className="text-xs opacity-50">Mensajes Totales</p>
                                        </div>
                                        <div className="p-3 rounded-lg bg-black/20 text-center">
                                            <p className="text-2xl font-bold text-amber-400">{user.stats?.lia?.user_messages || 0}</p>
                                            <p className="text-xs opacity-50">Preguntas del Usuario</p>
                                        </div>
                                        <div className="p-3 rounded-lg bg-black/20 text-center">
                                            <p className="text-2xl font-bold text-emerald-400">{user.stats?.lia?.assistant_responses || 0}</p>
                                            <p className="text-xs opacity-50">Respuestas de LIA</p>
                                        </div>
                                    </div>

                                    {(user.stats?.lia?.contexts?.ai_chat > 0 || user.stats?.lia?.contexts?.course > 0) && (
                                        <div className="mt-4 pt-4 border-t border-white/10">
                                            <p className="text-xs opacity-50 mb-2">Contextos de uso:</p>
                                            <div className="flex gap-2">
                                                {user.stats?.lia?.contexts?.ai_chat > 0 && (
                                                    <span className="px-2 py-1 text-xs rounded-full bg-purple-500/20 text-purple-400">
                                                        Chat General: {user.stats.lia.contexts.ai_chat}
                                                    </span>
                                                )}
                                                {user.stats?.lia?.contexts?.course > 0 && (
                                                    <span className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-400">
                                                        En Cursos: {user.stats.lia.contexts.course}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    )
}

function TabButton({ isActive, onClick, label, icon: Icon, accentColor, textColor }: any) {
    return (
        <button
            onClick={onClick}
            className={`
                relative px-6 py-3 rounded-xl flex items-center gap-2 transition-all duration-300 overflow-hidden
                ${isActive
                    ? 'font-semibold shadow-lg bg-[#0A2540] !text-white'
                    : 'text-gray-500 dark:text-gray-400 hover:text-[#0A2540] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'}
            `}
        >
            {isActive && (
                <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute inset-0 bg-white/10"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
            )}
            <Icon className="w-4 h-4 relative z-10" />
            <span className="relative z-10">{label}</span>
        </button>
    )
}

// ============================================
// KPI CARD
// ============================================
function KPICard({
    icon: Icon,
    label,
    value,
    color,
    cardBg,
    cardBorder
}: {
    icon: any
    label: string
    value: string | number
    color: string
    cardBg: string
    cardBorder: string
}) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -4 }}
            className="relative p-5 rounded-2xl border overflow-hidden bg-white dark:bg-[#1E293B]/80 border-gray-200 dark:border-slate-700/30"
        >
            <div
                className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 blur-2xl"
                style={{ backgroundColor: color }}
            />

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${color}20` }}>
                        <Icon className="w-5 h-5" style={{ color }} />
                    </div>
                </div>
                <p className="text-3xl font-bold mb-1">{typeof value === 'number' ? value.toLocaleString() : value}</p>
                <p className="text-sm opacity-60">{label}</p>
            </div>
        </motion.div>
    )
}

// ============================================
// SMALL METRIC CARD
// ============================================
function SmallMetricCard({
    icon: Icon,
    label,
    value,
    color,
    cardBg,
    cardBorder
}: {
    icon: any
    label: string
    value: string | number
    color: string
    cardBg: string
    cardBorder: string
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2 }}
            className="flex items-center gap-4 p-4 rounded-2xl border bg-white dark:bg-[#1E293B]/80 border-gray-200 dark:border-slate-700/30"
        >
            <div className="p-2 rounded-xl" style={{ backgroundColor: `${color}15` }}>
                <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <div>
                <p className="text-xl font-bold">{typeof value === 'number' ? value.toLocaleString() : value}</p>
                <p className="text-xs opacity-60">{label}</p>
            </div>
        </motion.div>
    )
}
