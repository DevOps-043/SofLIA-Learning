'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useBusinessAnalytics } from './useBusinessAnalytics'
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext'

export type ActiveTab = 'overview' | 'engagement' | 'users' | 'teams'

export function useBusinessAnalyticsLogic() {
    const { t } = useTranslation('business')
    const { data, isLoading, error, refetch } = useBusinessAnalytics()
    const { styles } = useOrganizationStylesContext()
    const panelStyles = styles?.panel

    const [activeTab, setActiveTab] = useState<ActiveTab>('overview')
    const [selectedUser, setSelectedUser] = useState<any>(null)

    const cardBg = panelStyles?.card_background
    const cardBorder = panelStyles?.border_color
    const textColor = panelStyles?.text_color
    const accentColor = panelStyles?.accent_color || '#00D4B3'
    const secondaryColor = panelStyles?.secondary_button_color || '#8b5cf6'

    return {
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
    }
}

export function useUserDetailModalLogic(user: any) {
    const { t } = useTranslation('business')
    const [subTab, setSubTab] = useState<'activity' | 'planner' | 'courses'>('activity')

    const displayName =
        user.name ||
        user.display_name ||
        (user.first_name && user.last_name ? `${user.first_name} ${user.last_name}`.trim() : null) ||
        user.first_name ||
        user.username ||
        user.email?.split('@')[0] ||
        t('analytics.usersTable.noName')

    const initials =
        displayName && displayName !== t('analytics.usersTable.noName')
            ? displayName.charAt(0).toUpperCase()
            : user.email?.charAt(0).toUpperCase() || '?'

    const getHeatmapColor = (level: number) => {
        if (!level) return 'bg-gray-200 dark:bg-white/5'
        if (level === 1) return 'bg-emerald-500/20'
        if (level === 2) return 'bg-emerald-500/40'
        if (level === 3) return 'bg-emerald-500/60'
        return 'bg-emerald-500'
    }

    const maxHour = user.stats?.hourly_distribution
        ? Math.max(...user.stats.hourly_distribution)
        : 1

    return {
        t,
        subTab,
        setSubTab,
        displayName,
        initials,
        getHeatmapColor,
        maxHour,
    }
}
