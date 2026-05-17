'use client'

import { motion } from 'framer-motion'
import type {
  BusinessPanelTheme,
  SetHoveredState,
  SidebarNavigationItem as SidebarNavigationItemData,
} from './types'

interface SidebarNavigationProps {
  isCollapsed: boolean
  isHovered: boolean
  isMobile: boolean
  isPinned: boolean
  navigation: SidebarNavigationItemData[]
  onClose: () => void
  onSectionChange: (section: string) => void
  pathname: string | null
  setIsHovered: SetHoveredState
  shouldExpand: boolean
  theme: BusinessPanelTheme
}

export function SidebarNavigation(props: SidebarNavigationProps) {
  return (
    <nav id="tour-sidebar-nav" className="flex-1 overflow-y-auto overflow-x-hidden py-6 px-3 custom-scrollbar relative">
      <ul className="space-y-1.5">
        {props.navigation.map(item => (
          <SidebarNavigationLink key={item.name} item={item} {...props} />
        ))}
      </ul>
    </nav>
  )
}

function SidebarNavigationLink({
  item,
  isCollapsed,
  isHovered,
  isMobile,
  isPinned,
  onClose,
  onSectionChange,
  pathname,
  setIsHovered,
  shouldExpand,
  theme,
}: SidebarNavigationProps & { item: SidebarNavigationItemData }) {
  const Icon = item.icon
  const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
  const expanded = !isCollapsed || shouldExpand || isMobile

  return (
    <li>
      <a
        id={item.id}
        href={item.href}
        onClick={() => {
          if (isMobile) onClose()
          onSectionChange(item.href.split('/').pop() || '')
          if (!isMobile && isCollapsed && !isPinned && isHovered) setIsHovered(false)
        }}
        className={`group relative flex items-center px-3 py-3 rounded-xl transition-all duration-300 ease-out ${!expanded ? 'justify-center' : 'justify-start gap-3'}`}
        style={{
          backgroundColor: isActive ? theme.primaryColor : 'transparent',
          boxShadow: isActive ? `0 4px 20px -5px ${theme.primaryColor}60` : 'none',
          color: isActive ? theme.onPrimaryColor : theme.textColor,
          opacity: isActive ? 1 : 0.78,
        }}
        onMouseEnter={(event) => {
          if (!isActive) {
            event.currentTarget.style.backgroundColor = theme.hoverBg
            event.currentTarget.style.opacity = '1'
          }
        }}
        onMouseLeave={(event) => {
          if (!isActive) {
            event.currentTarget.style.backgroundColor = 'transparent'
            event.currentTarget.style.opacity = '0.78'
          }
        }}
        title={!expanded ? item.name : undefined}
      >
        <Icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
        {expanded ? <NavigationLabel name={item.name} /> : null}
        {!expanded && isActive ? <div className="absolute inset-0 rounded-xl blur-md -z-10 opacity-60" style={{ background: theme.primaryColor }} /> : null}
      </a>
    </li>
  )
}

function NavigationLabel({ name }: { name: string }) {
  return (
    <motion.span
      initial={{ opacity: 0, width: 0 }}
      animate={{ opacity: 1, width: 'auto' }}
      exit={{ opacity: 0, width: 0 }}
      transition={{ duration: 0.2 }}
      className="text-sm font-medium whitespace-nowrap overflow-hidden"
    >
      {name}
    </motion.span>
  )
}
