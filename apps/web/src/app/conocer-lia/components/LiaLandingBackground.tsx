import { motion } from 'framer-motion';
import { useMotionSafe } from '../../../lib/utils/motion';

export function LiaLandingBackground() {
  const { disableHeavy } = useMotionSafe();

  return (
    <div className="fixed inset-0 pointer-events-none z-0" style={{ overflow: 'visible', clipPath: 'none' }}>
      <div
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(var(--color-primary) 1px, transparent 1px), linear-gradient(90deg, var(--color-primary) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />

      {!disableHeavy && (
        <>
          <motion.div
            className="absolute -top-[400px] -left-[400px] w-[1000px] h-[1000px] bg-accent/10 dark:bg-accent/20 rounded-full blur-3xl"
            animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3], x: [0, 100, 0], y: [0, 100, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute -bottom-[400px] -right-[400px] w-[1000px] h-[1000px] bg-primary/10 dark:bg-primary/20 rounded-full blur-3xl"
            animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0.5, 0.2], x: [0, -100, 0], y: [0, -100, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          />
          <motion.div
            className="absolute top-1/2 -left-[200px] w-[600px] h-[600px] bg-accent/5 dark:bg-accent/10 rounded-full blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2], x: [0, 50, 0] }}
            transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          />
          <motion.div
            className="absolute top-1/2 -right-[200px] w-[600px] h-[600px] bg-primary/5 dark:bg-primary/10 rounded-full blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2], x: [0, -50, 0] }}
            transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
          />
        </>
      )}
    </div>
  );
}
