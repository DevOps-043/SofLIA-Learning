import { motion } from 'framer-motion'

export function BusinessLoadingBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute -top-1/2 -left-1/4 w-[800px] h-[800px] rounded-full blur-3xl opacity-10"
        style={{ background: 'radial-gradient(circle, var(--color-primary, rgb(59, 130, 246)), transparent)' }}
        animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-1/2 -right-1/4 w-[800px] h-[800px] rounded-full blur-3xl opacity-10"
        style={{ background: 'radial-gradient(circle, var(--color-secondary, rgb(139, 92, 246)), transparent)' }}
        animate={{ x: [0, -100, 0], y: [0, -50, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(var(--color-primary, rgba(59, 130, 246, 0.1)) 1px, transparent 1px),
            linear-gradient(90deg, var(--color-primary, rgba(59, 130, 246, 0.1)) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />
    </div>
  )
}
