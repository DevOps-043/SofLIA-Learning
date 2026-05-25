'use client'

import type { BusinessPlansChangeInfo, BusinessPlansTheme } from './business-subscription-plans.types'

type PlanChangeBillingDetailsProps = { changeInfo: BusinessPlansChangeInfo; theme: BusinessPlansTheme }

export function PlanChangeBillingDetails({ changeInfo, theme }: PlanChangeBillingDetailsProps) {
  return (
    <div className="space-y-2 rounded-lg border p-3" style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor }}>
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: theme.subtextColor }}>Ciclo de facturacion:</span>
        <span className="text-xs font-medium capitalize" style={{ color: theme.textColor }}>{changeInfo.newBillingCycle}</span>
      </div>
      {changeInfo.priceDifference !== 0 ? (
        <div className="flex items-center justify-between border-t pt-2" style={{ borderColor: theme.dividerColor }}>
          <span className="text-xs" style={{ color: theme.subtextColor }}>{changeInfo.priceDifference > 0 ? 'Aumento' : 'Disminucion'} de precio:</span>
          <span className="text-xs font-semibold" style={{ color: changeInfo.priceDifference > 0 ? theme.dangerColor : theme.successColor }}>
            {changeInfo.priceDifference > 0 ? '+' : ''}${Math.abs(changeInfo.priceDifference).toLocaleString('es-MX')}/{changeInfo.newBillingCycle === 'yearly' ? 'ano' : 'mes'}
          </span>
        </div>
      ) : null}
    </div>
  )
}
