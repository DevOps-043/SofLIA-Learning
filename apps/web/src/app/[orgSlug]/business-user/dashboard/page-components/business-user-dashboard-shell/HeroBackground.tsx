import Image from 'next/image'

import type { BusinessUserDashboardColors } from '../../types'

interface HeroBackgroundProps {
  disableHeavyEffects: boolean
  orgColors: BusinessUserDashboardColors
}

export function HeroBackground({ disableHeavyEffects, orgColors }: HeroBackgroundProps) {
  return (
    <div
      className="absolute inset-0 z-0 overflow-hidden"
      style={{
        backgroundColor:
          orgColors.primary !== 'var(--color-bg-light)'
            ? orgColors.primary
            : 'var(--color-primary)',
      }}
    >
      <Image
        src="/images/teams-header.webp"
        alt="Learning Panel Background"
        fill
        className={`object-cover ${disableHeavyEffects ? 'opacity-35' : 'opacity-50'}`}
        priority
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-black/60 via-black/20 to-transparent pointer-events-none" />
      {!disableHeavyEffects ? (
        <>
          <div
            className="absolute inset-0 opacity-[0.1]"
            style={{
              backgroundImage: `
                linear-gradient(rgb(255 255 255 / 10%) 1px, transparent 1px),
                linear-gradient(90deg, rgb(255 255 255 / 10%) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px',
            }}
          />
          <div
            className="absolute -right-20 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full blur-[120px]"
            style={{ backgroundColor: `${orgColors.accent}20` }}
          />
          <div
            className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full blur-[100px]"
            style={{ backgroundColor: `${orgColors.primary}15` }}
          />
        </>
      ) : null}
    </div>
  )
}
