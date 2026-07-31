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
        className="fixed inset-y-0 left-0 z-[110] flex h-full flex-col overflow-hidden shadow-2xl lg:relative lg:inset-auto lg:z-0 lg:mb-3 lg:ml-3 lg:mt-[5.75rem] lg:h-[calc(100%_-_6.5rem)] lg:translate-x-0 lg:rounded-[1.35rem] lg:shadow-[0_20px_54px_-40px_rgba(2,12,23,0.5)]"
        style={{
          ...sidebarStyle,
          backdropFilter: 'blur(20px)',
          border: `1px solid ${theme.borderColor}`,
          boxShadow: `0 20px 54px -40px color-mix(in srgb, ${theme.primaryColor} 34%, transparent), inset 0 1px 0 color-mix(in srgb, var(--color-bg-light) 4%, transparent)`,
        }}
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
