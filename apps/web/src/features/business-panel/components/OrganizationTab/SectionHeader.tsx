import type { LucideIcon } from 'lucide-react'
import type { OrganizationTheme } from './types'

export function SectionHeader({
  description,
  icon: Icon,
  title,
  theme,
}: {
  description: string
  icon: LucideIcon
  title: string
  theme: OrganizationTheme
}) {
  return (
    <div className="flex items-center gap-3 mb-2">
      <div className="p-3 rounded-xl" style={{ backgroundColor: theme.actionSurface, color: theme.actionColor }}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <h3 className="text-lg font-bold" style={{ color: theme.textColor }}>{title}</h3>
        <p className="text-sm" style={{ color: theme.subtextColor }}>{description}</p>
      </div>
    </div>
  )
}
