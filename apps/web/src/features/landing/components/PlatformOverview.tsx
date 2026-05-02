'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import { 
  Bot, 
  CalendarDays, 
  LineChart, 
  GraduationCap,
  Shield,
  ArrowRight,
  Sparkles
} from 'lucide-react';

const platformFeatures = [
  {
    key: 'aiTraining',
    icon: Bot,
    color: '#00D4B3',
  },
  {
    key: 'liaAssistant',
    icon: Sparkles,
    color: '#8B5CF6',
  },
  {
    key: 'studyPlanner',
    icon: CalendarDays,
    color: '#F59E0B',
  },
  {
    key: 'analytics',
    icon: LineChart,
    color: '#10B981',
  },
  {
    key: 'certificates',
    icon: GraduationCap,
    color: '#EC4899',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export function PlatformOverview() {
  const { t } = useTranslation('common');
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  return (
    <section 
      id="platform"
      ref={sectionRef}
      className="py-20 lg:py-32 bg-white dark:bg-[#1E2329] relative overflow-hidden"
    >
      {/* Background Gradient */}
      <div className="absolute top-0 right-0 w-1/2 h-full opacity-30 dark:opacity-20 pointer-events-none">
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle at 80% 20%, rgba(0, 212, 179, 0.15), transparent 50%)',
          }}
        />
      </div>

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-block px-4 py-2 rounded-full bg-[#0A2540]/10 dark:bg-white/10 text-[#0A2540] dark:text-white text-sm font-medium mb-6"
            >
              {t('landing.platform.tag', 'La Plataforma')}
            </motion.span>

            <h2 className="text-3xl lg:text-5xl font-bold text-[#0A2540] dark:text-white mb-6 leading-tight">
              {t('landing.platform.title', 'Capacitación corporativa potenciada por inteligencia artificial')}
            </h2>

            <p className="text-lg text-[#6C757D] dark:text-white/60 mb-10 leading-relaxed">
              {t('landing.platform.description', 'SofLIA combina tecnología de punta con diseño centrado en el usuario para ofrecer una experiencia de aprendizaje que genera resultados medibles para tu organización.')}
            </p>

            {/* Features List */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
              className="space-y-4"
            >
              {platformFeatures.map((feature) => (
                <motion.div
                  key={feature.key}
                  variants={itemVariants}
                  className="group flex items-start gap-4 p-4 rounded-xl hover:bg-[#E9ECEF]/50 dark:hover:bg-white/5 transition-colors duration-300 cursor-default"
                >
                  <div 
                    className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundColor: `${feature.color}15` }}
                  >
                    <feature.icon 
                      size={20} 
                      style={{ color: feature.color }}
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-[#0A2540] dark:text-white mb-1">
                      {t(`landing.platform.features.${feature.key}.title`, feature.key)}
                    </h3>
                    <p className="text-sm text-[#6C757D] dark:text-white/50">
                      {t(`landing.platform.features.${feature.key}.description`, '')}
                    </p>
                  </div>
                  <ArrowRight 
                    size={18} 
                    className="flex-shrink-0 text-[#00D4B3] opacity-0 group-hover:opacity-100 transition-opacity duration-300 mt-1"
                  />
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right: Visual */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            {/* Main Dashboard Preview */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/20 dark:shadow-black/40 border border-[#E9ECEF] dark:border-white/10">
              {/* Dashboard Image */}
              <div className="aspect-[4/3] bg-gradient-to-br from-[#0A2540] to-[#1E3A5F] relative">
                {/* Try to load actual dashboard image, fallback to gradient */}
                <Image
                  src="/images/dashboard-header.webp"
                  alt="SofLIA Dashboard"
                  fill
                  className="object-cover object-top"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                
                {/* Overlay with mock UI elements */}
                <div className="absolute inset-0 p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  
                  {/* Mock cards */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[1, 2, 3].map((i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ delay: 0.5 + i * 0.1 }}
                        className="h-16 rounded-lg bg-white/10 backdrop-blur-sm"
                      />
                    ))}
                  </div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.8 }}
                    className="h-32 rounded-lg bg-white/10 backdrop-blur-sm"
                  />
                </div>
              </div>
            </div>

            {/* Floating Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={isInView ? { opacity: 1, scale: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="absolute -bottom-6 -left-6 lg:-left-10 bg-white dark:bg-[#0F1419] rounded-2xl shadow-xl shadow-black/10 dark:shadow-black/30 p-4 border border-[#E9ECEF] dark:border-white/10"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00D4B3] to-[#10B981] flex items-center justify-center">
                  <GraduationCap size={24} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#0A2540] dark:text-white">Tutor IA</p>
                  <p className="text-xs text-[#00D4B3]">Disponible 24/7</p>
                </div>
              </div>
            </motion.div>

            {/* Floating Stats */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: -20 }}
              animate={isInView ? { opacity: 1, scale: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="absolute -top-4 -right-4 lg:-right-8 bg-white dark:bg-[#0F1419] rounded-2xl shadow-xl shadow-black/10 dark:shadow-black/30 p-4 border border-[#E9ECEF] dark:border-white/10"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#10B981]/10 flex items-center justify-center">
                  <LineChart size={20} className="text-[#10B981]" />
                </div>
                <div>
                  <p className="text-lg font-bold text-[#0A2540] dark:text-white">+85%</p>
                  <p className="text-xs text-[#6C757D] dark:text-white/50">Completitud</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
