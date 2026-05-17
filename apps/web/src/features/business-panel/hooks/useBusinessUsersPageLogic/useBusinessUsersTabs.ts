import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import type { BusinessUsersResource, BusinessUsersTab } from './types'

const VALID_TABS: BusinessUsersTab[] = ['users', 'invitations', 'links', 'requests']

export function useBusinessUsersTabs() {
  const { orgSlug } = useParams<{ orgSlug: string }>()
  const searchParams = useSearchParams()
  const initialTab = searchParams.get('tab') as BusinessUsersTab | null
  const [activeTab, setActiveTab] = useState<BusinessUsersTab>(initialTab || 'users')
  const activeResource: BusinessUsersResource =
    activeTab === 'invitations' || activeTab === 'links' ? activeTab : 'users'

  useEffect(() => {
    if (initialTab && VALID_TABS.includes(initialTab)) setActiveTab(initialTab)
  }, [initialTab])

  useEffect(() => {
    const handleTabChange = (event: Event) => {
      const customEvent = event as CustomEvent<BusinessUsersTab>
      if (!customEvent.detail || !VALID_TABS.includes(customEvent.detail)) return
      setActiveTab(customEvent.detail)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    window.addEventListener('change-user-tab', handleTabChange)
    return () => window.removeEventListener('change-user-tab', handleTabChange)
  }, [])

  return { orgSlug, activeTab, setActiveTab, activeResource }
}
