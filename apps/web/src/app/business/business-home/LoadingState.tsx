import { PremiumLoadingScreen } from '@/core/components/PremiumLoadingScreen/PremiumLoadingScreen'

export function BusinessLoadingState() {
  return (
    <PremiumLoadingScreen
      description="Preparando la experiencia empresarial de SofLIA."
      label="Cargando soluciones"
      palette={{
        accent: 'var(--color-accent)',
        background: 'var(--color-bg-dark)',
        border: 'rgb(255 255 255 / 0.1)',
        muted: 'rgb(255 255 255 / 0.58)',
        primary: 'var(--color-primary)',
        surface: 'var(--color-gray-800)',
        text: 'var(--color-bg-light)',
      }}
    />
  )
}
