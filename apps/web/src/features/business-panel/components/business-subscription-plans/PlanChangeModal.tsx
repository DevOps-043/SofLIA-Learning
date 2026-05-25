'use client'

import { motion } from 'framer-motion'
import { AlertCircle, ArrowRight, Info, Loader2, X } from 'lucide-react'
import type { BusinessPlansChangeInfo, BusinessPlansTheme } from './business-subscription-plans.types'
import { PlanChangeBillingDetails } from './PlanChangeBillingDetails'
import { PlanChangeSummary } from './PlanChangeSummary'

type PlanChangeModalProps = {
  changeError: string | null
  changeInfo: BusinessPlansChangeInfo
  dangerSurface: string
  handleCancelChange: () => void
  handleConfirmChange: () => void
  isChangingPlan: boolean
  modalShadow: string
  primarySurface: string
  theme: BusinessPlansTheme
}

export function PlanChangeModal(props: PlanChangeModalProps) {
  const { changeError, changeInfo, dangerSurface, handleCancelChange, handleConfirmChange, isChangingPlan, modalShadow, primarySurface, theme } = props

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={handleCancelChange} className="absolute inset-0 backdrop-blur-sm" style={{ backgroundColor: theme.overlayBg }} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: 'spring', duration: 0.3 }} className="relative z-10 w-full max-w-lg rounded-xl border" style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor, boxShadow: modalShadow }}>
        <div className="flex items-center justify-between border-b p-5" style={{ backgroundColor: theme.cardBg, borderColor: theme.dividerColor }}>
          <h2 className="flex items-center gap-2.5 text-xl font-bold" style={{ color: theme.textColor }}><span className="rounded-lg p-1.5" style={{ backgroundColor: primarySurface }}><Info className="h-4 w-4" style={{ color: theme.primaryColor }} /></span>Confirmar cambio de plan</h2>
          <button type="button" onClick={handleCancelChange} disabled={isChangingPlan} className="rounded-lg p-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-50" style={{ backgroundColor: 'transparent' }}><X className="h-4 w-4" style={{ color: theme.subtextColor }} /></button>
        </div>
        <div className="space-y-4 p-5" style={{ backgroundColor: theme.cardBg }}>
          <div className="space-y-3"><PlanChangeSummary changeInfo={changeInfo} theme={theme} /><PlanChangeBillingDetails changeInfo={changeInfo} theme={theme} /></div>
          <div className="rounded-lg border p-3" style={{ backgroundColor: primarySurface, borderColor: theme.primaryColor }}><p className="flex items-start gap-2 text-xs" style={{ color: theme.primaryColor }}><Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" /><span>El cambio de plan sera efectivo inmediatamente. Tu proxima facturacion reflejara el nuevo plan seleccionado.</span></p></div>
          {changeError ? <div className="rounded-lg border p-3" style={{ backgroundColor: dangerSurface, borderColor: theme.dangerColor }}><p className="flex items-start gap-2 text-xs" style={{ color: theme.dangerColor }}><AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" /><span>{changeError}</span></p></div> : null}
        </div>
        <div className="flex items-center justify-end gap-2.5 border-t p-5" style={{ backgroundColor: theme.cardBg, borderColor: theme.dividerColor }}>
          <button type="button" onClick={handleCancelChange} disabled={isChangingPlan} className="rounded-md px-4 py-2 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50" style={{ backgroundColor: theme.hoverBg, color: theme.subtextColor }}>Cancelar</button>
          <button type="button" onClick={handleConfirmChange} disabled={isChangingPlan} className="flex items-center gap-2 rounded-md px-5 py-2 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50" style={{ backgroundColor: theme.primaryColor, color: theme.onPrimaryColor }}>{isChangingPlan ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Cambiando...</> : <>Confirmar cambio<ArrowRight className="h-3.5 w-3.5" /></>}</button>
        </div>
      </motion.div>
    </div>
  )
}
