'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { useMotionSafe } from '../../../lib/utils/motion';
import { Statistic } from '@aprende-y-aplica/shared';
import { Users, Briefcase, Star, Clock } from 'lucide-react';

interface StatisticsSectionProps {
  statistics: Statistic[];
}

// Iconos para cada estadística
const statIcons = {
  'Estudiantes Activos': Users,
  'Cursos en la Plataforma': Briefcase,
  '% de Satisfacción': Star,
  'Horas de Contenido': Clock,
};

// Componente para animar números
function AnimatedCounter({ endValue, duration = 2 }: { endValue: string; duration?: number }) {
  const [count, setCount] = useState<number | string>(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    const numericValue = parseInt(endValue.replace(/[^\d]/g, ''));
    if (isNaN(numericValue)) {
      setCount(endValue);
      return;
    }

    const increment = numericValue / (duration * 60); // 60fps
    const timer = setInterval(() => {
      setCount((prev) => {
        if (typeof prev !== 'number') return numericValue;
        const next = prev + increment;
        if (next >= numericValue) {
          clearInterval(timer);
          return numericValue;
        }
        return next;
      });
    }, 1000 / 60);

    return () => clearInterval(timer);
  }, [endValue, duration, isInView]);

  return (
    <div ref={ref} className="text-4xl lg:text-5xl xl:text-6xl font-bold text-white dark:text-white">
      {typeof count === 'number' ? Math.floor(count).toLocaleString() : count}
    </div>
  );
}

export function StatisticsSection({ statistics }: StatisticsSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const { disableHeavy } = useMotionSafe();
  const isInView = useInView(sectionRef, { once: false, amount: 0.1 });
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start']
  });

  // Parallax effects — disabled on mobile to eliminate scroll listener overhead
  const y1 = useTransform(scrollYProgress, [0, 1], disableHeavy ? [0, 0] : [0, -150]);
  const y2 = useTransform(scrollYProgress, [0, 1], disableHeavy ? [0, 0] : [0, 150]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0.3]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], disableHeavy ? [1, 1, 1] : [0.8, 1, 1.1]);

  return (
    <section 
      ref={sectionRef}
      className="py-16 lg:py-20 relative"
    >
      {/* Gradient Background con animación */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-r from-[#0A2540] via-[#0A2540] to-[#00D4B3] dark:from-[#0A2540] dark:via-[#0A2540] dark:to-[#00D4B3]"
        style={{ opacity: 1, scale }}
      />
      
      {/* Animated Background Effects con parallax - Extended beyond section */}
      {/* Background orbs — static on mobile */}
      <motion.div
        className="absolute -top-[200px] -left-[200px] w-[800px] h-[800px] bg-[#00D4B3]/20 rounded-full blur-3xl"
        style={{ y: y1 }}
        animate={disableHeavy ? {} : { scale: [1, 1.4, 1], opacity: [0.3, 0.6, 0.3], x: [0, 50, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-[200px] -right-[200px] w-[800px] h-[800px] bg-[#10B981]/20 rounded-full blur-3xl"
        style={{ y: y2 }}
        animate={disableHeavy ? {} : { scale: [1, 1.5, 1], opacity: [0.2, 0.5, 0.2], x: [0, -50, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />

      {/* Static dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
          backgroundSize: '60px 60px',
        }}
      />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Statistics - Diseño Fluido sin Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 items-center">
          {statistics.map((stat, index) => {
            const IconComponent = statIcons[stat.label as keyof typeof statIcons] || Users;
            
            return (
              <motion.div
                key={index}
                className="relative text-center group"
                initial={{ opacity: 0, y: 150, rotateX: -30 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ 
                  delay: index * 0.2,
                  duration: 1,
                  type: 'spring',
                  stiffness: 80
                }}
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Icon — floating animation desktop only */}
                <motion.div
                  className="mb-4 flex justify-center"
                  animate={!disableHeavy && isInView ? { y: [0, -10, 0], rotate: [0, 3, -3, 0] } : {}}
                  transition={{ duration: 4, repeat: Infinity, delay: index * 0.5, ease: 'easeInOut' }}
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-[#00D4B3] rounded-full blur-xl opacity-20" />
                    <div className="relative w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-[#00D4B3]/40 to-[#00D4B3]/20 rounded-xl flex items-center justify-center border-2 border-[#00D4B3]/50 backdrop-blur-sm">
                      <IconComponent className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
                    </div>
                  </div>
                </motion.div>

                {/* Number — no infinite scale loop */}
                <div className="text-white dark:text-white mb-2 relative" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900 }}>
                  <AnimatedCounter endValue={stat.value} />
                </div>

                {/* Label con animación */}
              <motion.p
                  className="text-base lg:text-lg text-white/90 dark:text-white/90 font-medium"
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                  initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                  transition={{ delay: index * 0.2 + 0.6, duration: 0.8 }}
              >
                {stat.label}
              </motion.p>

                {/* Línea decorativa animada */}
                <motion.div
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 bg-gradient-to-r from-transparent via-[#00D4B3] to-transparent"
                  initial={{ width: 0 }}
                  whileInView={{ width: '80%' }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 + 0.8, duration: 1.2 }}
                />
            </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

