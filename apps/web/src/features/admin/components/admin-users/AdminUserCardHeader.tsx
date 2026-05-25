'use client'

import { AtSign } from 'lucide-react'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'
import { AdminUserAvatar } from './AdminUserAvatar'

interface AdminUserCardHeaderProps {
  displayName: string
  username: string
  imageUrl: string | null | undefined
}

export function AdminUserCardHeader({
  displayName,
  username,
  imageUrl,
}: AdminUserCardHeaderProps) {
  const theme = useAdminPanelTheme()
  return (
    <>
      <div className="relative h-[92px] border-b" style={{ borderColor: theme.borderColor, background: `linear-gradient(135deg, ${theme.inputBg}, ${theme.hoverBg})` }}>
        <div className="absolute inset-0 opacity-60" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, ${theme.primaryColor} 1px, transparent 0)`, backgroundSize: '28px 28px' }} />
        <div className="absolute left-6 top-12">
          <AdminUserAvatar displayName={displayName} imageUrl={imageUrl ?? null} size="lg" accentColor={theme.primaryColor} borderColor={theme.cardBg} />
        </div>
      </div>
      <div className="mb-5 min-w-0">
        <h3 className="truncate text-base font-extrabold leading-tight" style={{ color: theme.textColor }} title={displayName}>{displayName}</h3>
        <div className="mt-1 flex min-w-0 items-center gap-1.5 text-xs font-medium" style={{ color: theme.subtextColor }}>
          <AtSign className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate" title={username}>{username}</span>
        </div>
      </div>
    </>
  )
}
