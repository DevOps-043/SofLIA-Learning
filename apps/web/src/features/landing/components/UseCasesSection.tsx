'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useMotionSafe } from '../../../lib/utils/motion';
import { 
  Brain, 
  Rocket, 
  TrendingUp, 
  Users, 
  GraduationCap,
  Target,
  ArrowRight
} from 'lucide-react';

const useCases = [
  {
    key: 'upskilling',
    icon: Brain,
    color: '#00D4B3',
    gradient: 'from-[#00D4B3] to-[#10B981]',
  },
  {
    key: 'onboarding',
    icon: Rocket,
    color: '#8B5CF6',
    gradient: 'from-[#8B5CF6] to-[#6366F1]',
  },
  {
    key: 'salesEnablement',
    icon: TrendingUp,
    color: '#F59E0B',
    gradient: 'from-[#F59E0B] to-[#EF4444]',
  },
  {
    key: 'partnerTraining',
    icon: Users,
    color: '#EC4899',
    gradient: 'from-[#EC4899] to-[#F43F5E]',
  },
  {
    key: 'customerTraining',
    icon: GraduationCap,
    color: '#06B6D4',
    gradient: 'from-[#06B6D4] to-[#0EA5E9]',
  },
  {
    key: 'compliance',
    icon: Target,
    color: '#10B981',
    gradient: 'from-[#10B981] to-[#22C55E]',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export function UseCasesSection() {
  const { t } = useTranslation('common');
  const { disableHeavy } = useMotionSafe();
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  return (
    <section 
      id="use-cases"
      ref={sectionRef}
      className="py-20 lg:py-32 bg-gradient-to-b from-white to-[#E9ECEF]/30 dark:from-[#1E2329] dark:to-[#0F1419] relative overflow-hidden"
    >
      {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-1/4 left-0 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ background: 'radial-gradient(circle, #00D4B3, transparent)' }}
        />
        <div 
          className="absolute bottom-1/4 right-0 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ background: 'radial-gradient(circle, #8B5CF6, transparent)' }}
        />
      </div>

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 lg:mb-20"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-block px-4 py-2 rounded-full bg-[#8B5CF6]/10 text-[#8B5CF6] text-sm font-medium mb-6"
          >
            {t('landing.useCases.tag', 'Casos de Uso')}
          </motion.span>

          <h2 className="text-3xl lg:text-5xl font-bold text-[#0A2540] dark:text-white mb-6">
            {t('landing.useCases.title', 'Casos de uso que impulsan resultados')}
          </h2>

          <p className="text-lg lg:text-xl text-[#6C757D] dark:text-white/60 max-w-3xl mx-auto">
            {t('landing.useCases.subtitle', 'Cada solución está diseñada para resolver desafíos específicos de tu organización')}
          </p>
        </motion.div>

        {/* Use Cases Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
        >
          {useCases.map((useCase) => (
            <motion.div
              key={useCase.key}
              variants={cardVariants}
              whileHover={{ y: -8 }}
              className="group relative rounded-2xl overflow-hidden"
            >
              {/* Card Background */}
              <div className="absolute inset-0 bg-white dark:bg-[#1E2329] border border-[#E9ECEF] dark:border-white/10 rounded-2xl transition-all duration-500 group-hover:border-transparent" />
              
              {/* Gradient Border on Hover */}
              <div 
                className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${useCase.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                style={{ padding: '1px' }}
              >
                <div className="w-full h-full bg-white dark:bg-[#1E2329] rounded-2xl" />
              </div>

              {/* Content */}
              <div className="relative p-8">
                {/* Icon */}
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ duration: 0.3 }}
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${useCase.gradient} flex items-center justify-center mb-6 shadow-lg`}
                  style={{ boxShadow: `0 8px 30px ${useCase.color}30` }}
                >
                  <useCase.icon size={28} className="text-white" />
                </motion.div>

                {/* Title */}
                <h3 className="text-xl font-bold text-[#0A2540] dark:text-white mb-3">
                  {t(`landing.useCases.items.${useCase.key}.title`, useCase.key)}
                </h3>

                {/* Pain Point */}
                <div className="mb-4">
                  <p className="text-xs font-medium text-[#F59E0B] uppercase tracking-wider mb-1">
                    {t('landing.useCases.labels.pain', 'Desafío')}
                  </p>
                  <p className="text-sm text-[#6C757D] dark:text-white/60">
                    {t(`landing.useCases.items.${useCase.key}.pain`, '')}
                  </p>
                </div>

                {/* Solution */}
                <div className="mb-4">
                  <p className="text-xs font-medium text-[#00D4B3] uppercase tracking-wider mb-1">
                    {t('landing.useCases.labels.solution', 'Solución')}
                  </p>
                  <p className="text-sm text-[#6C757D] dark:text-white/60">
                    {t(`landing.useCases.items.${useCase.key}.solution`, '')}
                  </p>
                </div>

                {/* Result */}
                <div className="pt-4 border-t border-[#E9ECEF] dark:border-white/10">
                  <p className="text-xs font-medium text-[#10B981] uppercase tracking-wider mb-1">
                    {t('landing.useCases.labels.result', 'Resultado')}
                  </p>
                  <p className="text-sm font-medium text-[#0A2540] dark:text-white">
                    {t(`landing.useCases.items.${useCase.key}.result`, '')}
                  </p>
                </div>

                {/* Arrow */}
                <motion.div
                  className="absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  animate={disableHeavy ? {} : { x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight size={20} style={{ color: useCase.color }} />
                </motion.div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
