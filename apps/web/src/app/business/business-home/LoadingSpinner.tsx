import { motion } from 'framer-motion'

export function BusinessLoadingSpinner() {
  return (
    <div className="relative w-32 h-32 sm:w-40 sm:h-40">
      <motion.div
        className="absolute inset-0 rounded-full border-[3px] border-transparent"
        style={{
          borderTopColor: 'var(--color-primary, rgb(59, 130, 246))',
          borderRightColor: 'var(--color-secondary, rgb(139, 92, 246))',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute inset-2 sm:inset-3 rounded-full border-[3px] border-transparent"
        style={{
          borderBottomColor: 'var(--color-primary, rgb(59, 130, 246))',
          borderLeftColor: 'var(--color-secondary, rgb(139, 92, 246))',
        }}
        animate={{ rotate: -360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute inset-4 sm:inset-6 rounded-full"
        style={{ background: 'linear-gradient(135deg, var(--color-primary, rgb(59, 130, 246)), var(--color-secondary, rgb(139, 92, 246)))' }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-white shadow-lg"
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        />
      </motion.div>
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ background: 'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.3) 50%, transparent 70%)' }}
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  )
}
