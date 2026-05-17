import type { BusinessUserDashboardColors } from '../../types'

interface HeroDecorationsProps {
  orgColors: BusinessUserDashboardColors
}

export function HeroDecorations({ orgColors }: HeroDecorationsProps) {
  return (
    <>
      <div
        className="absolute right-12 top-6 z-10 h-2 w-2 rounded-full"
        style={{ backgroundColor: orgColors.accent }}
      />
      <div
        className="absolute bottom-8 right-24 z-10 h-1.5 w-1.5 rounded-full opacity-60"
        style={{ backgroundColor: orgColors.primary }}
      />
      <div
        className="absolute right-16 top-1/2 z-10 h-1 w-1 rounded-full opacity-40"
        style={{ backgroundColor: orgColors.primary }}
      />
      <div
        className="absolute bottom-12 right-32 h-3 w-3 rounded-full"
        style={{ backgroundColor: `${orgColors.primary}40` }}
      />
    </>
  )
}

export function HeroBorderOverlay({ orgColors }: HeroDecorationsProps) {
  return (
    <div
      className="absolute inset-0 rounded-xl md:rounded-2xl pointer-events-none"
      style={{
        background: `linear-gradient(135deg, ${orgColors.primary}50, transparent, ${orgColors.primary}30)`,
        padding: '1px',
        mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        maskComposite: 'exclude',
        WebkitMaskComposite: 'xor',
      }}
    />
  )
}
