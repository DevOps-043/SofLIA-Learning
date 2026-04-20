'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion, useInView, useSpring, useTransform } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { TrendingUp, TrendingDown, Clock, DollarSign, Award, BarChart3 } from 'lucide-react';
import { useMotionSafe } from '../../../lib/utils/motion';

interface CounterProps {
  target: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
}

function AnimatedCounter({ target, suffix = '', prefix = '', duration = 2 }: CounterProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      
      // Easing function for smooth animation
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeOut * target));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [isInView, target, duration]);

  return (
    <span ref={ref}>
      {prefix}{count}{suffix}
    </span>
  );
}

const metrics = [
  {
    key: 'onboarding',
    value: 60,
    suffix: '%',
    icon: Clock,
    color: '#00D4B3',
    trend: 'down',
  },
  {
    key: 'savings',
    value: 150,
    prefix: '$',
    suffix: 'K',
    icon: DollarSign,
    color: '#10B981',
    trend: 'up',
  },
  {
    key: 'completion',
    value: 85,
    suffix: '%',
    icon: Award,
    color: '#8B5CF6',
    trend: 'up',
  },
  {
    key: 'productivity',
    value: 40,
    suffix: '%',
    icon: BarChart3,
    color: '#F59E0B',
    trend: 'up',
  },
];

export function ROIImpactSection() {
  const { t } = useTranslation('common');
  const { disableHeavy } = useMotionSafe();
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  return (
    <section 
      ref={sectionRef}
      className="py-20 lg:py-32 bg-[#0A2540] relative overflow-hidden"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Gradient Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #00D4B3, transparent)' }}
      />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #8B5CF6, transparent)' }}
      />

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
            className="inline-block px-4 py-2 rounded-full bg-[#00D4B3]/20 text-[#00D4B3] text-sm font-medium mb-6"
          >
            {t('landing.roi.tag', 'Impacto Medible')}
          </motion.span>

          <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6">
            {t('landing.roi.title', 'ROI que habla por sí mismo')}
          </h2>

          <p className="text-lg lg:text-xl text-white/60 max-w-3xl mx-auto">
            {t('landing.roi.subtitle', 'Resultados reales de organizaciones que transformaron su capacitación con SofLIA')}
          </p>
        </motion.div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-16">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.key}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="group relative p-6 lg:p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 hover:border-white/20 transition-all duration-500"
            >
              {/* Icon */}
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: `${metric.color}20` }}
              >
                <metric.icon size={24} style={{ color: metric.color }} />
              </div>

              {/* Value */}
              <div className="flex items-baseline gap-2 mb-2">
                <span 
                  className="text-4xl lg:text-5xl font-bold"
                  style={{ color: metric.color }}
                >
                  <AnimatedCounter 
                    target={metric.value} 
                    prefix={metric.prefix} 
                    suffix={metric.suffix}
                  />
                </span>
                
                {/* Trend Arrow */}
                <motion.div
                  animate={disableHeavy ? {} : { y: metric.trend === 'up' ? [0, -4, 0] : [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  {metric.trend === 'up' ? (
                    <TrendingUp size={20} className="text-[#10B981]" />
                  ) : (
                    <TrendingDown size={20} className="text-[#10B981]" />
                  )}
                </motion.div>
              </div>

              {/* Label */}
              <p className="text-sm text-white/60">
                {t(`landing.roi.metrics.${metric.key}`, metric.key)}
              </p>

              {/* Hover Glow */}
              <div 
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at center, ${metric.color}10, transparent 70%)`,
                }}
              />
            </motion.div>
          ))}
        </div>

        {/* Bottom Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center"
        >
          <p className="text-white/40 text-sm">
            {t('landing.roi.disclaimer', '* Métricas basadas en resultados promedio de clientes. Los resultados pueden variar según la implementación.')}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
