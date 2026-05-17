import { motion } from 'framer-motion'
import { AlertCircle, CheckCircle } from 'lucide-react'
import type { OrganizationTabTheme } from './types'

export function OrganizationStatusAlerts({ saveError, saveSuccess, theme }: {
  saveError: string | null
  saveSuccess: string | null
  theme: OrganizationTabTheme
}) {
  return (
    <>
      {saveSuccess ? <AlertMessage icon={<CheckCircle className="w-6 h-6" style={{ color: theme.successColor }} />} text={saveSuccess} color={theme.successColor} /> : null}
      {saveError ? <AlertMessage icon={<AlertCircle className="w-6 h-6" style={{ color: theme.dangerColor }} />} text={saveError} color={theme.dangerColor} /> : null}
    </>
  )
}

function AlertMessage({ color, icon, text }: { color: string; icon: React.ReactNode; text: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: -20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="rounded-2xl p-5 flex items-center gap-4 border" style={{ backgroundColor: color + '14', borderColor: color + '33' }}>
      {icon}
      <p className="font-medium" style={{ color }}>{text}</p>
    </motion.div>
  )
}
