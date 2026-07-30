import { PremiumLoadingScreen } from '@/core/components/PremiumLoadingScreen/PremiumLoadingScreen'

export function AdminLoadingSpinner() {
  return (
    <PremiumLoadingScreen
      description="Preparando las herramientas de administración."
      label="Cargando panel"
    />
  )
}
