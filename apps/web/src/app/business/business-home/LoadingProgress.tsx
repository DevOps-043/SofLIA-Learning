import { motion } from 'framer-motion'

export function BusinessLoadingProgress() {
  return (
    <motion.div
      className="w-64 sm:w-80 h-1.5 rounded-full overflow-hidden backdrop-blur-sm"
      style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.2)' }}
      initial={{ opacity: 0, scaleX: 0 }}
      animate={{ opacity: 1, scaleX: 1 }}
      transition={{ duration: 0.5, delay: 0.6 }}
    >
      <motion.div
        className="h-full rounded-full relative"
        style={{ background: 'linear-gradient(90deg, var(--color-primary, rgb(59, 130, 246)), var(--color-secondary, rgb(139, 92, 246)))' }}
        initial={{ width: '0%' }}
        animate={{ width: '100%' }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <motion.div
          className="h-full w-1/3 rounded-full absolute top-0"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.7), transparent)' }}
          animate={{ x: ['-100%', '400%'] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        />
      </motion.div>
    </motion.div>
  )
}
