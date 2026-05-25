'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { BusinessPanelTheme, SidebarTranslator } from './types'

interface SidebarCollapseButtonProps {
  isCollapsed: boolean
  isMobile: boolean
  onToggleCollapse: () => void
  shouldExpand: boolean
  t: SidebarTranslator
  theme: BusinessPanelTheme
}

export function SidebarCollapseButton({
  isCollapsed,
  isMobile,
  onToggleCollapse,
  shouldExpand,
  t,
  theme,
}: SidebarCollapseButtonProps) {
  return (
    <div className="mt-auto px-4 pb-4 pt-2">
      {!isMobile ? (
        <div className={`flex ${!isCollapsed || shouldExpand ? 'justify-end' : 'justify-center'} mb-4`}>
          <button
            onClick={onToggleCollapse}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95"
            style={{ backgroundColor: theme.inputBg, border: `1px solid ${theme.borderColor}`, color: theme.textColor, opacity: 0.7 }}
            onMouseEnter={(event) => {
              event.currentTarget.style.backgroundColor = theme.hoverBg
              event.currentTarget.style.borderColor = theme.dividerColor
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.backgroundColor = theme.inputBg
              event.currentTarget.style.borderColor = theme.borderColor
            }}
            title={isCollapsed ? t('sidebar.pinMenu') : t('sidebar.collapseMenu')}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      ) : null}
    </div>
  )
}
