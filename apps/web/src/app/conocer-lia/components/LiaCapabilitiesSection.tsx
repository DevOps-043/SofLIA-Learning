import { motion, type MotionValue } from 'framer-motion';
import type { RefObject } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { liaCapabilities } from '../content';

interface LiaCapabilitiesSectionProps {
  sectionRef: RefObject<HTMLElement | null>;
  capabilitiesY: MotionValue<number>;
}

export function LiaCapabilitiesSection({ sectionRef, capabilitiesY }: LiaCapabilitiesSectionProps) {
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
            ¿Qué puede hacer <span className="text-[#00D4B3]">SofLIA</span> por ti?
          </h2>
          <p
            className="text-xl lg:text-2xl max-w-3xl mx-auto text-[#6C757D] dark:text-white/80"
            style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
          >
            Explora todas las capacidades que SofLIA tiene para ayudarte en tu aprendizaje
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {liaCapabilities.map((capability, index) => {
            const IconComponent = capability.icon;
            return (
              <motion.div
                key={capability.title}
                className="group"
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                style={{ y: capabilitiesY }}
              >
                <div className="relative h-full bg-white dark:bg-[#1E2329] rounded-2xl p-8 border border-[#E9ECEF] dark:border-[#6C757D]/30 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="mb-6">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#00D4B3] to-[#0A2540] flex items-center justify-center mb-4">
                      <IconComponent className="w-7 h-7 text-white" />
                    </div>
                  </div>

                  <h3
                    className="text-xl font-bold mb-3 text-[#0A2540] dark:text-white"
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700 }}
                  >
                    {capability.title}
                  </h3>
                  <p
                    className="text-[#6C757D] dark:text-white/70 leading-relaxed mb-4"
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                  >
                    {capability.description}
                  </p>

                  <div className="space-y-2">
                    {capability.examples?.map((example) => (
                      <div key={example} className="flex items-center gap-2 text-sm text-[#6C757D] dark:text-white/60">
                        <CheckCircle2 className="w-4 h-4 text-[#10B981] flex-shrink-0" />
                        <span>{example}</span>
                      </div>
                    ))}
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
