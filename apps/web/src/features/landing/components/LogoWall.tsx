'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import { 
  MessageSquare, 
  Brain, 
  Sparkles, 
  BookOpen,
  Target,
  Zap
} from 'lucide-react';

interface LogoWallProps {
  className?: string;
}

const liaFeatures = [
  {
    icon: MessageSquare,
    titleKey: 'chat',
    descKey: 'chatDesc',
  },
  {
    icon: Brain,
    titleKey: 'adaptive',
    descKey: 'adaptiveDesc',
  },
  {
    icon: Target,
    titleKey: 'personalized',
    descKey: 'personalizedDesc',
  },
  {
    icon: Zap,
    titleKey: 'instant',
    descKey: 'instantDesc',
  },
];

export function LogoWall({ className = '' }: LogoWallProps) {
  const { t } = useTranslation('common');

  return (
    <section className={`py-16 lg:py-24 bg-gradient-to-b from-white to-[#E9ECEF]/30 dark:from-[#0F1419] dark:to-[#0A2540]/30 overflow-hidden ${className}`}>
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* LIA Avatar Section */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative flex justify-center lg:justify-end"
          >
            {/* Glow Effect */}
            <div className="absolute inset-0 flex items-center justify-center lg:justify-end">
              <div className="w-72 h-72 lg:w-96 lg:h-96 rounded-full bg-gradient-to-r from-[#00D4B3]/20 to-[#00A896]/20 blur-3xl" />
            </div>
            
            {/* Avatar Container */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
              className="relative"
            >
              {/* Decorative Ring */}
              <div className="absolute -inset-4 bg-gradient-to-r from-[#00D4B3] via-[#00A896] to-[#00D4B3] rounded-full opacity-20 blur-sm animate-pulse" />
              
              {/* Avatar Image */}
              <div className="relative w-64 h-64 lg:w-80 lg:h-80 rounded-full overflow-hidden border-4 border-white/20 dark:border-white/10 shadow-2xl">
                <Image
                  src="/lia-avatar.webp"
                  alt="LIA - Asistente de Inteligencia Artificial"
                  fill
                  className="object-cover object-top"
                  priority
                />
              </div>
              
              {/* Floating Badge */}
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-2 bg-gradient-to-r from-[#00D4B3] to-[#00A896] rounded-full shadow-lg"
              >
                <div className="flex items-center gap-2 text-white">
                  <Sparkles size={16} />
                  <span className="text-sm font-semibold whitespace-nowrap">
                    {t('landing.lia.badge', 'Inteligencia Artificial')}
                  </span>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Content Section */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center lg:text-left"
          >
            {/* Title */}
            <div className="mb-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20 rounded-full mb-4"
              >
                <Brain size={16} className="text-[#00D4B3]" />
                <span className="text-sm font-medium text-[#00D4B3]">
                  {t('landing.lia.tag', 'Tu asistente personal')}
                </span>
              </motion.div>
              
              <h2 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-[#0A2540] dark:text-white mb-4">
                {t('landing.lia.title', 'Conoce a')} <span className="text-[#00D4B3]">SofLIA</span>
              </h2>
              
              <p className="text-lg text-[#6C757D] dark:text-white/70 max-w-lg mx-auto lg:mx-0">
                {t('landing.lia.description', 'Tu asistente de aprendizaje con inteligencia artificial que te guía, responde tus dudas y personaliza tu experiencia de capacitación en tiempo real.')}
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4 mt-8">
              {liaFeatures.map((feature, index) => (
                <motion.div
                  key={feature.titleKey}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  whileHover={{ scale: 1.03, y: -2 }}
                  className="p-4 bg-white dark:bg-white/5 rounded-xl border border-[#E9ECEF] dark:border-white/10 hover:border-[#00D4B3]/30 hover:shadow-lg transition-all duration-300"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#00D4B3]/10 flex items-center justify-center mb-3">
                    <feature.icon size={20} className="text-[#00D4B3]" />
                  </div>
                  <h4 className="text-sm font-semibold text-[#0A2540] dark:text-white mb-1">
                    {t(`landing.lia.features.${feature.titleKey}`, feature.titleKey)}
                  </h4>
                  <p className="text-xs text-[#6C757D] dark:text-white/60">
                    {t(`landing.lia.features.${feature.descKey}`, feature.descKey)}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
