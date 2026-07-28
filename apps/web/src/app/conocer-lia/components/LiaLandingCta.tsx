import Link from 'next/link';
import { motion } from 'framer-motion';
import { useMotionSafe } from '../../../lib/utils/motion';

export function LiaLandingCta() {
  const { disableHeavy } = useMotionSafe();
  return (
    <section className="py-32 relative bg-gradient-to-br from-primary via-primary to-accent">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8 }}
        >
          <motion.h2
            className="text-4xl lg:text-6xl font-bold mb-6 text-white"
            style={{ fontFamily: 'var(--font-system-ui)', fontWeight: 900 }}
            animate={disableHeavy ? {} : { scale: [1, 1.02, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            ¿Listo para comenzar con LIA?
          </motion.h2>
          <p
            className="text-xl lg:text-2xl mb-12 text-white/90"
            style={{ fontFamily: 'var(--font-system-ui)', fontWeight: 400 }}
          >
            Únete a miles de estudiantes que ya están transformando su aprendizaje con inteligencia artificial
          </p>
          <Link href="/auth">
            <motion.button
              className="px-12 py-5 bg-white text-primary rounded-xl font-bold text-lg shadow-2xl"
              style={{ fontFamily: 'var(--font-system-ui)', fontWeight: 700 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              Comienza con LIA
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
