'use client'

import { PaintBrushIcon } from '@heroicons/react/24/outline'
import { Card, colors } from '../shared'

export function CustomizationPanelStylesCard() {
  return (
    <Card title="Estilos del Panel" description="Personaliza el aspecto del panel de administración" icon={PaintBrushIcon} iconColor={colors.grayMedium}>
      <div className="py-8 text-center">
        <PaintBrushIcon className="mx-auto mb-4 h-16 w-16" style={{ color: colors.grayMedium }} />
        <p className="mb-2 text-lg font-medium text-white">Próximamente</p>
        <p className="text-sm" style={{ color: colors.grayMedium }}>
          Configuración avanzada de estilos (panel_styles, login_styles, user_dashboard_styles)
        </p>
      </div>
    </Card>
  )
}
