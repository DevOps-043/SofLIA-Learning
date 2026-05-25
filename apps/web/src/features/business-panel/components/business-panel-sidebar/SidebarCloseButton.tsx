'use client'

import { X } from 'lucide-react'
import type { BusinessPanelTheme } from './types'

interface SidebarCloseButtonProps {
  onClose: () => void
  theme: BusinessPanelTheme
}

export function SidebarCloseButton({ onClose, theme }: SidebarCloseButtonProps) {
  return (
    <div className="relative flex-shrink-0 flex items-center justify-end px-4 pt-4 pb-2 lg:hidden">
      <button
        onClick={onClose}
        className="p-2 rounded-lg transition-colors"
        style={{ color: theme.textColor, opacity: 0.6 }}
        onMouseEnter={(event) => {
          event.currentTarget.style.opacity = '1'
          event.currentTarget.style.backgroundColor = theme.hoverBg
        }}
        onMouseLeave={(event) => {
          event.currentTarget.style.opacity = '0.6'
          event.currentTarget.style.backgroundColor = 'transparent'
        }}
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  )
}
