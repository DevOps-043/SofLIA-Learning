'use client'

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { Crown, Mail, Phone, X } from 'lucide-react'
import type { BusinessPlansTheme } from './business-subscription-plans.types'

type EnterpriseContactModalProps = { modalShadow: string; primarySurface: string; setSelectedPlan: (plan: string | null) => void; theme: BusinessPlansTheme; warningSurface: string }

export function EnterpriseContactModal({ modalShadow, primarySurface, setSelectedPlan, theme, warningSurface }: EnterpriseContactModalProps) {
  const closeModal = () => setSelectedPlan(null)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeModal} className="absolute inset-0 backdrop-blur-sm" style={{ backgroundColor: theme.overlayBg }} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: 'spring', duration: 0.3 }} className="relative z-10 w-full max-w-lg rounded-xl border" style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor, boxShadow: modalShadow }}>
        <div className="flex items-center justify-between border-b p-5" style={{ backgroundColor: theme.cardBg, borderColor: theme.dividerColor }}>
          <h2 className="flex items-center gap-2.5 text-xl font-bold" style={{ color: theme.textColor }}><span className="rounded-lg p-1.5" style={{ backgroundColor: warningSurface }}><Crown className="h-4 w-4" style={{ color: theme.warningColor }} /></span>Plan Enterprise</h2>
          <button type="button" onClick={closeModal} className="rounded-lg p-1.5 transition-colors" style={{ backgroundColor: 'transparent' }}><X className="h-4 w-4" style={{ color: theme.subtextColor }} /></button>
        </div>
        <div className="space-y-3 p-5" style={{ backgroundColor: theme.cardBg }}>
          <p className="text-sm" style={{ color: theme.subtextColor }}>El plan Enterprise es personalizado para grandes organizaciones. Contacta con nuestro equipo de ventas para conocer mas detalles y obtener una cotizacion personalizada.</p>
          <div className="space-y-2"><EnterpriseContactLink href="mailto:ventas@aprendeyaplica.com" icon={<Mail className="h-4 w-4" style={{ color: theme.primaryColor }} />} label="Email" value="ventas@aprendeyaplica.com" primarySurface={primarySurface} theme={theme} /><EnterpriseContactLink href="tel:+525555555555" icon={<Phone className="h-4 w-4" style={{ color: theme.primaryColor }} />} label="Telefono" value="+52 55 5555 5555" primarySurface={primarySurface} theme={theme} /></div>
        </div>
        <div className="flex items-center justify-end gap-2.5 border-t p-5" style={{ backgroundColor: theme.cardBg, borderColor: theme.dividerColor }}><button type="button" onClick={closeModal} className="rounded-md px-4 py-2 text-xs font-medium transition-colors" style={{ backgroundColor: theme.hoverBg, color: theme.subtextColor }}>Cerrar</button></div>
      </motion.div>
    </div>
  )
}

function EnterpriseContactLink({ href, icon, label, primarySurface, theme, value }: { href: string; icon: ReactNode; label: string; primarySurface: string; theme: BusinessPlansTheme; value: string }) {
  return <a href={href} className="flex items-center gap-3 rounded-lg border p-3 transition-colors" style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor }}><span className="rounded-lg p-1.5" style={{ backgroundColor: primarySurface }}>{icon}</span><span><p className="text-xs font-medium" style={{ color: theme.textColor }}>{label}</p><p className="text-xs" style={{ color: theme.subtextColor }}>{value}</p></span></a>
}
