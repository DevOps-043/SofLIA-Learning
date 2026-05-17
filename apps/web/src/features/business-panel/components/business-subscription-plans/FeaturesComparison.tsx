'use client'

import { Check, TrendingUp, X } from 'lucide-react'
import type { BusinessPlansLogic, BusinessPlansTheme } from './business-subscription-plans.types'

type FeaturesComparisonProps = {
  featuresByCategory: BusinessPlansLogic['featuresByCategory']
  theme: BusinessPlansTheme
}

const planColumns = ['team', 'business', 'enterprise'] as const

export function FeaturesComparison({ featuresByCategory, theme }: FeaturesComparisonProps) {
  return (
    <div className="mt-8">
      <h2 className="mb-4 text-center text-xl font-bold" style={{ color: theme.textColor }}>Comparacion detallada de caracteristicas</h2>
      <div className="space-y-4">
        {Object.entries(featuresByCategory).map(([category, features]) => (
          <div key={category} className="overflow-hidden rounded-xl border shadow-sm" style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}>
            <div className="border-b px-4 py-3" style={{ backgroundColor: theme.inputBg, borderColor: theme.dividerColor }}>
              <h3 className="flex items-center gap-2 text-base font-bold" style={{ color: theme.textColor }}><TrendingUp className="h-4 w-4" style={{ color: theme.primaryColor }} />{category}</h3>
            </div>
            <div className="overflow-x-auto"><table className="w-full"><thead className="border-b" style={{ backgroundColor: theme.hoverBg, borderColor: theme.dividerColor }}><tr><th className="w-1/2 px-4 py-3 text-left text-xs font-semibold" style={{ color: theme.textColor }}>Caracteristica</th>{planColumns.map((plan) => <th key={plan} className="px-4 py-3 text-center text-xs font-semibold capitalize" style={{ color: theme.textColor }}>{plan}</th>)}</tr></thead>
              <tbody className="divide-y" style={{ borderColor: theme.dividerColor }}>
                {features.map((feature, idx) => (
                  <tr key={idx} className="transition-colors" onMouseEnter={(event) => { event.currentTarget.style.backgroundColor = theme.hoverBg }} onMouseLeave={(event) => { event.currentTarget.style.backgroundColor = 'transparent' }}>
                    <td className="px-4 py-3"><div><p className="text-xs font-medium" style={{ color: theme.textColor }}>{feature.name}</p><p className="mt-0.5 text-xs" style={{ color: theme.subtextColor }}>{feature.description}</p></div></td>
                    {planColumns.map((plan) => <td key={plan} className="px-4 py-3 text-center">{feature[plan] ? <Check className="mx-auto h-5 w-5" style={{ color: theme.successColor }} /> : <X className="mx-auto h-5 w-5" style={{ color: theme.mutedTextColor }} />}</td>)}
                  </tr>
                ))}
              </tbody></table></div>
          </div>
        ))}
      </div>
    </div>
  )
}
