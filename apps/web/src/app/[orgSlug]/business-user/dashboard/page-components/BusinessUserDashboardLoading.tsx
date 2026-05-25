import { GraduationCap } from 'lucide-react'
import type { BusinessUserDashboardColors } from '../types'

interface BusinessUserDashboardLoadingProps {
  orgColors: BusinessUserDashboardColors
  title: string
  subtitle: string
}

export function BusinessUserDashboardLoading({
  orgColors,
  title,
  subtitle,
}: BusinessUserDashboardLoadingProps) {
  return (
    <main
      className="min-h-screen flex items-center justify-center"
      style={{ background: orgColors.sidebarBg }}
    >
      <div className="flex flex-col items-center gap-8">
        <div className="relative">
          <div
            className="w-20 h-20 rounded-full"
            style={{
              background: `linear-gradient(135deg, color-mix(in srgb, ${orgColors.primary} 8.2%, transparent), color-mix(in srgb, ${orgColors.accent} 8.2%, transparent))`,
              border: `2px solid color-mix(in srgb, ${orgColors.accent} 31.4%, transparent)`,
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <GraduationCap className="w-8 h-8" style={{ color: orgColors.accent }} />
          </div>
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold" style={{ color: orgColors.text }}>
            {title}
          </p>
          <p className="text-sm mt-2" style={{ color: orgColors.textSecondary }}>
            {subtitle}
          </p>
        </div>
      </div>
    </main>
  )
}
