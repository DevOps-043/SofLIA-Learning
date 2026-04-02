'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useBusinessAnalytics } from './useBusinessAnalytics'
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext'
import type { BusinessAnalyticsUser } from '../types/analytics.types'
import {
    getBusinessAnalyticsHeatmapColor,
    getBusinessAnalyticsMaxHour,
    getBusinessAnalyticsUserDisplayName,
    getBusinessAnalyticsUserInitials,
} from '../services/business-analytics-display.service'

export type ActiveTab = 'overview' | 'engagement' | 'users' | 'teams'
export type UserDetailSubTab = 'activity' | 'planner' | 'courses'

export function useBusinessAnalyticsLogic() {
    const { t } = useTranslation('business')
    const { data, isLoading, error, refetch } = useBusinessAnalytics()
    const { styles } = useOrganizationStylesContext()
    const panelStyles = styles?.panel

    const [activeTab, setActiveTab] = useState<ActiveTab>('overview')
    const [selectedUser, setSelectedUser] = useState<BusinessAnalyticsUser | null>(null)

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

export function useUserDetailModalLogic(user: BusinessAnalyticsUser) {
    const { t } = useTranslation('business')
    const [subTab, setSubTab] = useState<UserDetailSubTab>('activity')

    const noNameLabel = t('analytics.usersTable.noName')
    const displayName = getBusinessAnalyticsUserDisplayName(user, noNameLabel)
    const initials = getBusinessAnalyticsUserInitials(user, noNameLabel)
    const maxHour = getBusinessAnalyticsMaxHour(user.stats?.hourly_distribution)

    return {
        t,
        subTab,
        setSubTab,
        displayName,
        initials,
        getHeatmapColor: getBusinessAnalyticsHeatmapColor,
        maxHour,
    }
}
