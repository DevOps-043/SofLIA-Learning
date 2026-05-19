import { motion } from 'framer-motion'
import { AlertCircle, CheckCircle } from 'lucide-react'
import type { OrganizationTheme } from './types'

export function OrganizationAlerts({
  saveError,
  saveSuccess,
  theme,
}: {
  saveError: string | null
  saveSuccess: string | null
  theme: OrganizationTheme
}) {
  return (
    <>
      {saveSuccess ? (
        <AlertMessage color={theme.successColor} icon={CheckCircle} message={saveSuccess} theme={theme} />
      ) : null}
      {saveError ? (
        <AlertMessage color={theme.dangerColor} icon={AlertCircle} message={saveError} theme={theme} />
      ) : null}
    </>
  )
}

function AlertMessage({
  color,
  icon: Icon,
  message,
}: {
  color: string
  icon: typeof AlertCircle
  message: string
  theme: OrganizationTheme
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="rounded-2xl p-5 flex items-center gap-4 border"
      style={{ backgroundColor: `color-mix(in srgb, ${color} 7.8%, transparent)`, borderColor: `color-mix(in srgb, ${color} 20%, transparent)` }}
    >
      <Icon className="w-6 h-6" style={{ color }} />
      <p className="font-medium" style={{ color }}>{message}</p>
    </motion.div>
  )
}
