'use client'

import { useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AppWindow,
  BarChart3,
  BookOpen,
  Building2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FileText,
  Flag,
  GraduationCap,
  LayoutDashboard,
  MessageSquareText,
  Newspaper,
  PlaySquare,
  Route,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
  X,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useAdminTheme } from '../hooks/useAdminTheme'

interface AdminSidebarProps {
  isOpen: boolean
  onClose: () => void
  activeSection: string
  onSectionChange: (section: string) => void
  isCollapsed: boolean
  onToggleCollapse: () => void
}

const navigation = [
  { section: 'dashboard', labelKey: 'navigation.dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { section: 'companies', labelKey: 'navigation.companies', href: '/admin/companies', icon: Building2 },
  { section: 'users', labelKey: 'navigation.users', href: '/admin/users', icon: Users },
  { section: 'workshops', labelKey: 'navigation.workshops', href: '/admin/workshops', icon: BookOpen },
  { section: 'learning-paths', labelKey: 'navigation.learningPaths', href: '/admin/learning-paths', icon: Route },
  { section: 'access-requests', labelKey: 'navigation.accessRequests', href: '/admin/access-requests', icon: UserCheck },
  { section: 'communities', labelKey: 'navigation.communities', href: '/admin/communities', icon: MessageSquareText },
  { section: 'apps', labelKey: 'navigation.apps', href: '/admin/apps', icon: AppWindow },
  { section: 'prompts', labelKey: 'navigation.prompts', href: '/admin/prompts', icon: Sparkles },
  { section: 'news', labelKey: 'navigation.news', href: '/admin/news', icon: Newspaper },
  { section: 'reels', labelKey: 'navigation.reels', href: '/admin/reels', icon: PlaySquare },
  { section: 'skills', labelKey: 'navigation.skills', href: '/admin/skills', icon: GraduationCap },
  { section: 'reviews', labelKey: 'navigation.reviews', href: '/admin/courses/pending', icon: ClipboardCheck },
  { section: 'reports', labelKey: 'navigation.reports', href: '/admin/reportes', icon: FileText },
  { section: 'statistics', labelKey: 'navigation.statistics', href: '/admin/statistics', icon: BarChart3 },
  { section: 'moderation-ai', labelKey: 'navigation.moderation', href: '/admin/moderation-ai', icon: ShieldCheck },
  { section: 'lia-analytics', labelKey: 'navigation.liaAnalytics', href: '/admin/lia-analytics', icon: ShieldCheck },
  { section: 'user-stats', labelKey: 'navigation.userStats', href: '/admin/user-stats', icon: Flag },
]

export function AdminSidebar({
  isOpen,
  onClose,
  onSectionChange,
  isCollapsed,
  onToggleCollapse,
}: AdminSidebarProps) {
  const { t } = useTranslation('admin')
  const pathname = usePathname()
  const theme = useAdminTheme()
  const width = isCollapsed ? 80 : 280

  const navItems = useMemo(
    () =>
      navigation.map((item) => ({
        ...item,
        label: t(item.labelKey),
      })),
    [t],
  )

  return (
    <>
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-40 backdrop-blur-sm lg:hidden"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={onClose}
            style={{ backgroundColor: theme.overlay }}
          />
        ) : null}
      </AnimatePresence>

      <motion.aside
        animate={{ width }}
        className={`fixed inset-y-0 left-0 z-50 flex flex-col overflow-hidden border-r transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        initial={false}
        style={{
          backgroundColor: theme.surface,
          borderColor: theme.border,
        }}
        transition={{ width: { duration: 0.25, ease: 'easeInOut' } }}
      >
        <div className="flex h-20 shrink-0 items-center border-b px-4" style={{ borderColor: theme.border }}>
          <div className={isCollapsed ? 'flex w-full justify-center' : 'flex min-w-0 flex-1 items-center gap-3'}>
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border"
              style={{ backgroundColor: theme.surfaceSubtle, borderColor: theme.border }}
            >
              <Image src="/Logo.png" alt="SofLIA" width={28} height={28} className="object-contain" />
            </div>
            {!isCollapsed ? (
              <div className="min-w-0">
                <p className="truncate text-base font-bold" style={{ color: theme.text }}>
                  SofLIA
                </p>
                <p className="truncate text-[10px] font-semibold uppercase tracking-wider" style={{ color: theme.textMuted }}>
                  {t('navigation.superadmin')}
                </p>
              </div>
            ) : null}
          </div>

          {!isCollapsed ? (
            <button
              type="button"
              className="rounded-xl p-2 lg:hidden"
              onClick={onClose}
              style={{ color: theme.textMuted }}
              aria-label={t('navigation.close')}
            >
              <X className="h-5 w-5" />
            </button>
          ) : null}
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-4 scrollbar-thin">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
              const Icon = item.icon

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => {
                      onSectionChange(item.section)
                      onClose()
                    }}
                    className={`group flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold transition ${
                      isCollapsed ? 'justify-center' : 'gap-3'
                    }`}
                    style={{
                      backgroundColor: isActive ? theme.action : 'transparent',
                      color: isActive ? theme.onAction : theme.textMuted,
                    }}
                    title={isCollapsed ? item.label : undefined}
                    onMouseEnter={(event) => {
                      if (!isActive) {
                        event.currentTarget.style.backgroundColor = theme.hover
                        event.currentTarget.style.color = theme.text
                      }
                    }}
                    onMouseLeave={(event) => {
                      if (!isActive) {
                        event.currentTarget.style.backgroundColor = 'transparent'
                        event.currentTarget.style.color = theme.textMuted
                      }
                    }}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {!isCollapsed ? <span className="truncate">{item.label}</span> : null}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="border-t p-2" style={{ borderColor: theme.border }}>
          <button
            type="button"
            onClick={onToggleCollapse}
            className={`flex h-11 w-full items-center rounded-xl px-3 text-sm font-semibold transition ${
              isCollapsed ? 'justify-center' : 'justify-between'
            }`}
            style={{ color: theme.textMuted }}
            onMouseEnter={(event) => {
              event.currentTarget.style.backgroundColor = theme.hover
              event.currentTarget.style.color = theme.text
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.backgroundColor = 'transparent'
              event.currentTarget.style.color = theme.textMuted
            }}
            aria-label={t('navigation.toggle')}
          >
            {!isCollapsed ? <span>{t('navigation.collapse')}</span> : null}
            {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
        </div>
      </motion.aside>
    </>
  )
}
