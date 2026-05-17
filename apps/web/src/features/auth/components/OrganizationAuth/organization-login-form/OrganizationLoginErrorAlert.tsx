import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle } from 'lucide-react'

import type { OrganizationLoginRedirectInfo } from './service'

export function OrganizationLoginErrorAlert(props: {
  error: string | null
  formatRedirectCountdownMessage: (message: string, countdown: number) => string
  redirectInfo: OrganizationLoginRedirectInfo | null
}) {
  return (
    <AnimatePresence>
      {props.error && (
        <motion.div
          className="relative overflow-hidden rounded-xl backdrop-blur-sm border p-4"
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.3 }}
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            borderColor: 'rgba(239, 68, 68, 0.4)',
          }}
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0 space-y-2">
              <p className="text-sm text-red-300 font-medium leading-snug">
                {props.error}
              </p>
              {props.redirectInfo && <RedirectCountdown {...props} />}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function RedirectCountdown(props: {
  formatRedirectCountdownMessage: (message: string, countdown: number) => string
  redirectInfo: OrganizationLoginRedirectInfo | null
}) {
  if (!props.redirectInfo) return null

  return (
    <div className="flex items-center gap-2 pt-2 border-t border-red-500/20">
      <motion.div className="w-3 h-3 rounded-full border-2 border-red-400/60 border-t-red-400" animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }} />
      <p className="text-xs text-red-300/80 flex-1">
        {props.formatRedirectCountdownMessage(
          props.redirectInfo.message,
          props.redirectInfo.countdown,
        )}
      </p>
      {props.redirectInfo.countdown > 0 && (
        <motion.span key={props.redirectInfo.countdown} className="inline-flex items-center justify-center min-w-[1.75rem] h-6 px-1.5 rounded-md text-xs font-semibold text-red-200" style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.3)' }} initial={{ scale: 1.2 }} animate={{ scale: 1 }} transition={{ duration: 0.2 }}>
          {props.redirectInfo.countdown}
        </motion.span>
      )}
    </div>
  )
}
