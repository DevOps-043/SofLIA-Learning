'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useBusinessAnalytics } from './useBusinessAnalytics'
import { useBusinessPanelTheme } from './useBusinessPanelTheme'
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
    const panelTheme = useBusinessPanelTheme()

    const [activeTab, setActiveTab] = useState<ActiveTab>('overview')
    const [selectedUser, setSelectedUser] = useState<BusinessAnalyticsUser | null>(null)

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
        panelTheme,
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
