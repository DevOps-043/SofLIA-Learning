'use client';

import React, { useRef, useState } from 'react';
import { motion, useInView, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Newspaper, Video, Users, Calendar } from 'lucide-react';

interface PlatformFeature {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  link: string;
  color: string;
  gradient: string;
}

const platformFeatures: PlatformFeature[] = [
  {
    id: 'news',
    icon: Newspaper,
    title: 'Noticias',
    description: 'Mantente actualizado con las últimas tendencias y noticias del mundo de la IA.',
    link: '/news',
    color: '#00D4B3',
    gradient: 'from-[#00D4B3] to-[#00D4B3]/80'
  },
  {
    id: 'reels',
    icon: Video,
    title: 'Reels',
    description: 'Contenido en video corto para aprender de forma rápida y entretenida.',
    link: '/reels',
    color: '#10B981',
    gradient: 'from-[#10B981] to-[#10B981]/80'
  },
  {
    id: 'communities',
    icon: Users,
    title: 'Comunidades',
    description: 'Conecta con otros estudiantes y profesionales en comunidades especializadas.',
    link: '/communities',
    color: '#0A2540',
    gradient: 'from-[#0A2540] to-[#0A2540]/80'
  },
  {
    id: 'study-planner',
    icon: Calendar,
    title: 'Planificador de Estudios',
    description: 'Organiza tu tiempo y optimiza tu aprendizaje con un planificador inteligente.',
    link: '/study-planner',
    color: '#F59E0B',
    gradient: 'from-[#F59E0B] to-[#F59E0B]/80'
  }
];

export function TestimonialsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const isInView = useInView(sectionRef, { once: false, amount: 0.1 });
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start']
  });

  // Parallax effects
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -150]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0.3]);

  return (
    <section 
      ref={sectionRef}
      className="py-32 relative bg-white dark:bg-[#0F1419]"
    >
      {/* Animated Background Effects */}
      <motion.div 
        className="absolute inset-0"
        style={{ opacity: opacity as React.CSSProperties['opacity'] }}
      >
        {/* Gradient Orbs - Extended beyond section bounds */}
        <motion.div
          className="absolute -top-[200px] -left-[200px] w-[700px] h-[700px] bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20 rounded-full blur-3xl"
          style={{ y: y1 }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
        <motion.div
          className="absolute -bottom-[200px] -right-[200px] w-[700px] h-[700px] bg-[#0A2540]/10 dark:bg-[#0A2540]/20 rounded-full blur-3xl"
          style={{ y: y2 }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1
          }}
        />
        
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(#0A2540 1px, transparent 1px), linear-gradient(90deg, #0A2540 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />
      </motion.div>
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-24"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <motion.h2 
            className="text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 text-[#0A2540] dark:text-white"
            style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800 }}
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ 
              duration: 0.8,
              type: 'spring',
              stiffness: 100
            }}
          >
            Explora la Plataforma
          </motion.h2>
          <motion.p 
            className="text-xl lg:text-2xl max-w-3xl mx-auto text-[#6C757D] dark:text-white/80 leading-relaxed"
            style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            Descubre todas las herramientas y recursos que tenemos para ti
          </motion.p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {platformFeatures.map((feature, index) => {
            const IconComponent = feature.icon;
            const isHovered = hoveredIndex === index;
            const isEven = index % 2 === 0;
            
            return (
        <motion.div
                key={feature.id}
                className="relative group"
                initial={{ opacity: 0, y: 100, rotateX: -15 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ 
                  delay: index * 0.2,
                  duration: 0.8,
                  type: 'spring',
                  stiffness: 100
                }}
                style={{ transformStyle: 'preserve-3d' }}
                onHoverStart={() => setHoveredIndex(index)}
                onHoverEnd={() => setHoveredIndex(null)}
              >
                <Link href={feature.link}>
                  <div className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-8 lg:gap-12 h-full`}>
                    {/* Icon/Visual Side */}
                <motion.div
                      className="flex-1 w-full lg:w-auto"
                      animate={isHovered ? {
                        scale: 1.1,
                        rotate: [0, 5, -5, 0],
                      } : {
                        scale: 1,
                        rotate: 0
                      }}
                      transition={{ duration: 0.5 }}
                    >
                      <div className="relative">
                        {/* Glowing background */}
                        <motion.div
                          className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} rounded-3xl blur-2xl opacity-30`}
                          animate={isHovered ? {
                            scale: [1, 1.4, 1],
                            opacity: [0.3, 0.6, 0.3]
                          } : {}}
                          transition={{ duration: 2, repeat: Infinity }}
                        />

                        {/* Main icon container */}
                        <div className={`relative w-32 h-32 lg:w-40 lg:h-40 bg-gradient-to-br ${feature.gradient} rounded-3xl flex items-center justify-center border-2 border-white/20 shadow-2xl backdrop-blur-sm`}>
                          <IconComponent className="w-16 h-16 lg:w-20 lg:h-20 text-white" />
                      </div>
                      
                        {/* Floating particles */}
                        <AnimatePresence>
                          {isHovered && (
                            <>
                              {[...Array(8)].map((_, i) => (
                                <motion.div
                                  key={i}
                                  className="absolute w-2 h-2 rounded-full"
                                  style={{ backgroundColor: feature.color }}
                                  initial={{ 
                                    x: '50%', 
                                    y: '50%', 
                                    opacity: 0,
                                    scale: 0
                                  }}
                                  animate={{
                                    x: `${50 + (Math.cos(i * 45 * Math.PI / 180) * 80)}%`,
                                    y: `${50 + (Math.sin(i * 45 * Math.PI / 180) * 80)}%`,
                                    opacity: [0, 1, 0],
                                    scale: [0, 1, 0]
                                  }}
                                  exit={{ opacity: 0, scale: 0 }}
                                  transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    delay: i * 0.15
                                  }}
                                />
                              ))}
                            </>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>

                    {/* Content Side */}
                    <motion.div
                      className="flex-1 w-full lg:w-auto"
                      animate={isHovered ? { x: isEven ? 10 : -10 } : { x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="space-y-4">
                        <motion.h3
                          className={`text-3xl lg:text-4xl xl:text-5xl font-bold`}
                          style={{ 
                            fontFamily: 'Inter, sans-serif', 
                            fontWeight: 800,
                            color: feature.color
                          }}
                          animate={isHovered ? { scale: 1.05 } : { scale: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          {feature.title}
                        </motion.h3>
                        
                        <motion.p
                          className="text-lg lg:text-xl text-[#6C757D] dark:text-white/70 leading-relaxed"
                          style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                          animate={isHovered ? { opacity: 1 } : { opacity: 0.8 }}
                          transition={{ duration: 0.3 }}
                        >
                          {feature.description}
                        </motion.p>

                        {/* Progress bar indicator */}
                        <motion.div
                          className="h-1 bg-[#E9ECEF] dark:bg-[#6C757D]/30 rounded-full overflow-hidden mt-6"
                          initial={{ width: 0 }}
                          whileInView={{ width: '100%' }}
                          viewport={{ once: true }}
                          transition={{ delay: index * 0.2 + 0.5, duration: 1 }}
                        >
                          <motion.div
                            className={`h-full bg-gradient-to-r ${feature.gradient}`}
                            initial={{ width: 0 }}
                            whileInView={{ width: '100%' }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.2 + 0.7, duration: 0.8 }}
                          />
                        </motion.div>
                    </div>
                    </motion.div>
                  </div>
                </Link>

                {/* Connecting line (only visible on desktop) */}
                {index < platformFeatures.length - 1 && (
            <motion.div
                    className="hidden lg:block absolute left-1/2 -translate-x-1/2 w-0.5 h-16 bg-gradient-to-b from-[#00D4B3]/30 to-transparent"
                    initial={{ height: 0 }}
                    whileInView={{ height: 64 }}
              viewport={{ once: true }}
                    transition={{ delay: index * 0.2 + 0.8, duration: 0.6 }}
                />
          )}
        </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
