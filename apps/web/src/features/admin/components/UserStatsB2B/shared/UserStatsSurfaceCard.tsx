'use client'

import type { ReactNode } from 'react'
import { useAdminPanelTheme } from '../../../hooks/useAdminPanelTheme'

interface UserStatsSurfaceCardProps {
  children: ReactNode
  className?: string
}

export function UserStatsSurfaceCard({
  children,
  className = '',
}: UserStatsSurfaceCardProps) {
  const theme = useAdminPanelTheme()

  return (
    <div
      className={`rounded-[24px] border p-5 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.35)] ${className}`}
      style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}
    >
      {children}
    </div>
  )
}
