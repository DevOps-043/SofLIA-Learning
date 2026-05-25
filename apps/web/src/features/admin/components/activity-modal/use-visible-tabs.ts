import { useEffect, useMemo } from 'react'

import { tabs } from './defaults'
import type { ActivityType, TabKey } from './types'

export function useVisibleTabs(
  activityType: ActivityType,
  activeTab: TabKey,
  setActiveTab: (tab: TabKey) => void,
) {
  const supportsInteractiveConfig =
    activityType !== 'quiz' && activityType !== 'ai_chat' && activityType !== 'reading'
  const visibleTabs = useMemo(
    () =>
      supportsInteractiveConfig
        ? tabs
        : tabs.filter((tab) => tab.id === 'basic' || tab.id === 'content'),
    [supportsInteractiveConfig],
  )

  useEffect(() => {
    if (!visibleTabs.some((tab) => tab.id === activeTab)) setActiveTab('basic')
  }, [activeTab, setActiveTab, visibleTabs])

  return { supportsInteractiveConfig, visibleTabs }
}
