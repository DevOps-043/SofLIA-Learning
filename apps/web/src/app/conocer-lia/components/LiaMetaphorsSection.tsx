import { motion } from 'framer-motion';
import type { RefObject } from 'react';
import { liaMetaphors } from '../content';

interface LiaMetaphorsSectionProps {
  sectionRef: RefObject<HTMLElement | null>;
}

export function LiaMetaphorsSection({ sectionRef }: LiaMetaphorsSectionProps) {
  return (
    <section ref={sectionRef} className="py-32 relative bg-white dark:bg-carbon-900">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8 }}
        >
          <h2
            className="text-4xl lg:text-6xl font-bold mb-6 text-primary dark:text-white"
            style={{ fontFamily: 'var(--font-system-ui)', fontWeight: 900 }}
          >
            SofLIA: Tu <span className="text-accent">Sabiduría Aumentada</span>
          </h2>
          <p
            className="text-xl lg:text-2xl max-w-3xl mx-auto text-gray-500 dark:text-white/80"
            style={{ fontFamily: 'var(--font-system-ui)', fontWeight: 400 }}
          >
            SofLIA es más que un asistente. Es la interfaz humana que traduce la inteligencia de SofLIA en
            conversaciones, acciones y decisiones cotidianas.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {liaMetaphors.map((metaphor, index) => {
            const IconComponent = metaphor.icon;
            return (
              <motion.div
                key={metaphor.title}
                className="group relative"
                initial={{ opacity: 0, y: 100, rotateX: -15 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: index * 0.1, duration: 0.8, type: 'spring', stiffness: 100 }}
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div className="relative h-full bg-white dark:bg-carbon-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-500/30 shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden">
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-br ${metaphor.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
                  />

                  <div className="relative z-10 mb-6">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center"
                      style={{ backgroundColor: `color-mix(in srgb, ${metaphor.color} 12.5%, transparent)` }}
                    >
                      <IconComponent className="w-8 h-8" style={{ color: metaphor.color }} />
                    </div>
                  </div>

                  <div className="relative z-10">
                    <h3
                      className="text-2xl font-bold mb-4 text-primary dark:text-white"
                      style={{ fontFamily: 'var(--font-system-ui)', fontWeight: 700 }}
                    >
                      {metaphor.title}
                    </h3>
                    <p
                      className="text-gray-500 dark:text-white/70 leading-relaxed"
                      style={{ fontFamily: 'var(--font-system-ui)', fontWeight: 400 }}
                    >
                      {metaphor.description}
                    </p>
                  </div>

                  <div
                    className="absolute top-0 right-0 w-32 h-32 opacity-5"
                    style={{ background: `linear-gradient(135deg, ${metaphor.color} 0%, transparent 70%)` }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
