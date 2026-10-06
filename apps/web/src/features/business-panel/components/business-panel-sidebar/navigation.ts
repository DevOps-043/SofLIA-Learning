import {
  BarChart3,
  ClipboardCheck,
  LayoutDashboard,
  Library,
  Network,
  Settings,
  Users,
  GraduationCap,
} from 'lucide-react'
import type { SidebarNavigationItem, SidebarTranslator } from './types'
import { LIVE_LEARNING_ENABLED } from '@/features/live/config'

export function buildBusinessPanelNavigation(
  t: SidebarTranslator,
  orgSlug: string
): SidebarNavigationItem[] {
  const basePath = `/${orgSlug}/business-panel`

  return [
    { id: 'tour-nav-dashboard', name: t('sidebar.dashboard'), href: `${basePath}/dashboard`, icon: LayoutDashboard },
    { id: 'tour-nav-users', name: t('sidebar.users'), href: `${basePath}/users`, icon: Users },
    { id: 'tour-nav-hierarchy', name: t('sidebar.hierarchy', 'Estructura'), href: `${basePath}/hierarchy`, icon: Network },
    { id: 'tour-nav-content', name: t('sidebar.content', 'Contenido'), href: `${basePath}/courses`, icon: Library },
    ...(LIVE_LEARNING_ENABLED ? [{ id: 'nav-instructors', name: t('sidebar.instructors', 'Instructores · In Live'), href: `/${orgSlug}/instructor`, icon: GraduationCap }] : []),
    { id: 'tour-nav-reports', name: t('sidebar.reports'), href: `${basePath}/reports`, icon: BarChart3 },
    { id: 'tour-nav-reviews', name: t('sidebar.reviews', 'Revisiones'), href: `${basePath}/reviews`, icon: ClipboardCheck },
    { id: 'tour-nav-settings', name: t('sidebar.settings'), href: `${basePath}/settings`, icon: Settings },
  ]
}
