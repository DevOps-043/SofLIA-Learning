import { motion } from 'framer-motion'
import { BusinessLoadingBackground } from './LoadingBackground'
import { BusinessLoadingParticles } from './LoadingParticles'
import { BusinessLoadingProgress } from './LoadingProgress'
import { BusinessLoadingSpinner } from './LoadingSpinner'
import type { LoadingParticle } from './types'

export function BusinessLoadingState({ particles }: { particles: LoadingParticle[] }) {
  return (
    <main className="min-h-screen bg-carbon flex items-center justify-center relative overflow-hidden">
      <BusinessLoadingBackground />
      <motion.div
        className="relative z-10 flex flex-col items-center gap-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <BusinessLoadingSpinner />
        <div className="flex flex-col items-center gap-4">
          <motion.p
            className="text-white/90 text-lg sm:text-xl font-medium tracking-tight"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Cargando...
          </motion.p>
          <motion.div className="flex gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.4 }}>
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                className="w-2.5 h-2.5 rounded-full shadow-lg"
                style={{ backgroundColor: 'var(--color-primary, rgb(59, 130, 246))' }}
                animate={{ y: [0, -10, 0], opacity: [0.5, 1, 0.5], scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: index * 0.2 }}
              />
            ))}
          </motion.div>
        </div>
        <BusinessLoadingProgress />
      </motion.div>
      <BusinessLoadingParticles particles={particles} />
    </main>
  )
}
