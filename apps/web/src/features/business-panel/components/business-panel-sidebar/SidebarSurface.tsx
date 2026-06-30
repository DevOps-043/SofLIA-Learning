'use client'

import { forwardRef, type CSSProperties, type MouseEventHandler, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import type { BusinessPanelTheme } from './types'

interface SidebarSurfaceProps {
  children: ReactNode
  onDoubleClick: MouseEventHandler<HTMLElement>
  onHoverEnd: () => void
  onHoverStart: () => void
  sidebarStyle: CSSProperties
  sidebarWidth: number
  theme: BusinessPanelTheme
  xPosition: number | string
}

export const SidebarSurface = forwardRef<HTMLDivElement, SidebarSurfaceProps>(
  function SidebarSurface(
    {
      children,
      onDoubleClick,
      onHoverEnd,
      onHoverStart,
      sidebarStyle,
      sidebarWidth,
      theme,
      xPosition,
    },
    ref
  ) {
    return (
      <motion.div
        ref={ref}
        id="business-panel-sidebar-root"
        initial={false}
        animate={{ width: sidebarWidth, x: xPosition }}
        transition={{ width: { duration: 0.3, ease: 'easeInOut' }, x: { duration: 0.3, ease: [0.32, 0.72, 0, 1] } }}
        className="fixed inset-y-0 left-0 z-[110] h-full flex flex-col shadow-2xl overflow-hidden lg:translate-x-0 lg:relative lg:z-0 lg:shadow-none"
        style={{ ...sidebarStyle, backdropFilter: 'blur(20px)', borderRight: `1px solid ${theme.borderColor}` }}
        onHoverStart={onHoverStart}
        onHoverEnd={onHoverEnd}
        onDoubleClick={onDoubleClick}
      >
        <div className="absolute inset-0 pointer-events-none opacity-20" style={{ background: `radial-gradient(circle at 100% 0%, color-mix(in srgb, ${theme.primaryColor} 25.1%, transparent) 0%, transparent 20%), radial-gradient(circle at 0% 100%, color-mix(in srgb, ${theme.accentColor} 25.1%, transparent) 0%, transparent 20%)` }} />
        {children}
      </motion.div>
    )
  }
)
