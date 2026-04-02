import { motion } from 'framer-motion';
import type { RefObject } from 'react';
import { liaPersonalityFeatures } from '../content';

interface LiaPersonalitySectionProps {
  sectionRef: RefObject<HTMLElement | null>;
}

export function LiaPersonalitySection({ sectionRef }: LiaPersonalitySectionProps) {
  return (
    <section
      ref={sectionRef}
      className="py-32 relative bg-gradient-to-b from-white to-[#F8F9FA] dark:from-[#0F1419] dark:to-[#0A0D12]"
    >
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8 }}
        >
          <h2
            className="text-4xl lg:text-6xl font-bold mb-6 text-[#0A2540] dark:text-white"
            style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900 }}
          >
            La <span className="text-[#00D4B3]">Personalidad</span> de LIA
          </h2>
          <p
            className="text-xl lg:text-2xl max-w-3xl mx-auto text-[#6C757D] dark:text-white/80"
            style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
          >
            LIA no es solo tecnología, es tu compañero de aprendizaje con una personalidad única
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {liaPersonalityFeatures.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <motion.div
                key={feature.title}
                className="group"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
              >
                <div className="relative h-full bg-white dark:bg-[#1E2329] rounded-2xl p-8 border border-[#E9ECEF] dark:border-[#6C757D]/30 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${feature.color}20` }}
                    >
                      <IconComponent className="w-6 h-6" style={{ color: feature.color }} />
                    </div>
                    <div>
                      <h3
                        className="text-xl font-bold mb-2 text-[#0A2540] dark:text-white"
                        style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700 }}
                      >
                        {feature.title}
                      </h3>
                      <p
                        className="text-[#6C757D] dark:text-white/70 leading-relaxed"
                        style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                      >
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
