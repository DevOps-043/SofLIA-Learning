import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { liaStudyPlannerFeatures } from '../content';

export function LiaStudyPlannerSection() {
  return (
    <section className="py-32 relative bg-white dark:bg-carbon-900">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8 }}
        >
          <h2
            className="text-4xl lg:text-6xl font-bold mb-6 text-primary dark:text-white"
            style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900 }}
          >
            Planificador de <span className="text-accent">Estudios</span>
          </h2>
          <p
            className="text-xl lg:text-2xl max-w-3xl mx-auto text-gray-500 dark:text-white/80"
            style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
          >
            LIA genera planes de estudio personalizados adaptados a tu perfil profesional, disponibilidad y objetivos
            de aprendizaje
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {liaStudyPlannerFeatures.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <motion.div
                key={feature.title}
                className="group relative"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
              >
                <div className="relative h-full bg-white dark:bg-carbon-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-500/30 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="mb-6">
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `color-mix(in srgb, ${feature.color} 12.5%, transparent)` }}
                    >
                      <IconComponent className="w-7 h-7" style={{ color: feature.color }} />
                    </div>
                  </div>

                  <h3
                    className="text-xl font-bold mb-3 text-primary dark:text-white"
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700 }}
                  >
                    {feature.title}
                  </h3>
                  <p
                    className="text-gray-500 dark:text-white/70 leading-relaxed mb-4"
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                  >
                    {feature.description}
                  </p>

                  <div className="space-y-2">
                    {feature.features?.map((item) => (
                      <div key={item} className="flex items-center gap-2 text-sm text-gray-500 dark:text-white/60">
                        <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                        <span>{item}</span>
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
