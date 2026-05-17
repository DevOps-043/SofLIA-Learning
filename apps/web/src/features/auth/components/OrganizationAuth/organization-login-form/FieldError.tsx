import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle } from 'lucide-react'

export function FieldError({ message }: { message?: string }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.p
          className="text-xs text-red-400 flex items-center gap-1.5 px-1 mt-1"
          initial={{ opacity: 0, y: -3 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          <span>{message}</span>
        </motion.p>
      )}
    </AnimatePresence>
  )
}
