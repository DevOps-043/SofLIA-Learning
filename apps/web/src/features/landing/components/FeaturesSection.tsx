'use client';

import React, { useRef, useState } from 'react';
import { motion, useInView, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Icon, IconName } from '@aprende-y-aplica/ui';
import { FeatureCard } from '@aprende-y-aplica/shared';
import { useMotionSafe } from '../../../lib/utils/motion';

interface FeaturesSectionProps {
  title: string;
  subtitle: string;
  cards: FeatureCard[];
}

export function FeaturesSection({ title, subtitle, cards }: FeaturesSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const { disableHeavy } = useMotionSafe();
  const isInView = useInView(sectionRef, { once: false, amount: 0.1 });
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start']
  });

  // Parallax disabled on mobile to eliminate scroll listener overhead
  const y1 = useTransform(scrollYProgress, [0, 1], disableHeavy ? [0, 0] : [0, -150]);
  const y2 = useTransform(scrollYProgress, [0, 1], disableHeavy ? [0, 0] : [0, 100]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0.5]);

  return (
    <section 
      ref={sectionRef}
      className="py-32 relative features-section bg-white dark:bg-[#0F1419]"
    >
      {/* Animated Background Effects */}
      <motion.div 
        className="absolute inset-0"
        style={{ opacity }}
      >
        {/* Gradient Orbs - Extended beyond section bounds */}
        <motion.div
          className="absolute -top-[200px] -left-[200px] w-[700px] h-[700px] bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20 rounded-full blur-3xl"
          style={{ y: y1 }}
          animate={disableHeavy ? {} : { scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-[200px] -right-[200px] w-[700px] h-[700px] bg-[#0A2540]/10 dark:bg-[#0A2540]/20 rounded-full blur-3xl"
          style={{ y: y2 }}
          animate={disableHeavy ? {} : { scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
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
            {title}
          </motion.h2>
          <motion.p 
            className="text-xl lg:text-2xl max-w-3xl mx-auto text-[#6C757D] dark:text-white/80 leading-relaxed"
            style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            {subtitle}
          </motion.p>
        </motion.div>

        {/* Interactive Feature Showcase */}
        <div className="space-y-8 lg:space-y-16">
          {cards.map((card, index) => {
            const isHovered = hoveredIndex === index;
            const isEven = index % 2 === 0;
            
            return (
              <motion.div
                key={card.id}
                className="relative"
                initial={{ opacity: 0, y: 100 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ 
                  delay: index * 0.2,
                  duration: 0.8,
                  type: 'spring',
                  stiffness: 100
                }}
                onHoverStart={() => setHoveredIndex(index)}
                onHoverEnd={() => setHoveredIndex(null)}
              >
                <div className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-8 lg:gap-16`}>
                  {/* Icon/Visual Side */}
                  <motion.div
                    className="flex-1 w-full lg:w-auto"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                >
                    <div className="relative">
                      {/* Large Icon Container */}
                    <motion.div
                        className="relative w-48 h-48 lg:w-64 lg:h-64 mx-auto"
                        animate={isHovered ? {
                          rotate: [0, 5, -5, 0],
                          scale: [1, 1.1, 1]
                        } : {}}
                        transition={{ duration: 0.6 }}
                      >
                        {/* Glowing background */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-br from-[#00D4B3]/20 to-[#00D4B3]/10 dark:from-[#00D4B3]/30 dark:to-[#00D4B3]/20 rounded-3xl blur-2xl"
                          animate={isHovered ? {
                            scale: [1, 1.3, 1],
                            opacity: [0.5, 0.8, 0.5]
                          } : {}}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                        
                        {/* Main icon container */}
                        <div className="relative w-full h-full bg-gradient-to-br from-[#00D4B3]/20 to-[#00D4B3]/10 dark:from-[#00D4B3]/30 dark:to-[#00D4B3]/20 rounded-3xl flex items-center justify-center border-2 border-[#00D4B3]/30 shadow-2xl backdrop-blur-sm">
                      {card.icon ? (
                        <Icon 
                          name={card.icon as IconName} 
                              size="xl" 
                              className="text-[#00D4B3] w-24 h-24 lg:w-32 lg:h-32"
                        />
                      ) : (
                            <div className="w-24 h-24 lg:w-32 lg:h-32 bg-[#00D4B3]/20 rounded-2xl" />
                          )}
                        </div>

                        {/* Floating particles */}
                        <AnimatePresence>
                          {isHovered && (
                            <>
                              {[...Array(6)].map((_, i) => (
                                <motion.div
                                  key={i}
                                  className="absolute w-2 h-2 bg-[#00D4B3] rounded-full"
                                  initial={{ 
                                    x: '50%', 
                                    y: '50%', 
                                    opacity: 0,
                                    scale: 0
                                  }}
                                  animate={{
                                    x: `${50 + (Math.cos(i * 60 * Math.PI / 180) * 100)}%`,
                                    y: `${50 + (Math.sin(i * 60 * Math.PI / 180) * 100)}%`,
                                    opacity: [0, 1, 0],
                                    scale: [0, 1, 0]
                                  }}
                                  exit={{ opacity: 0, scale: 0 }}
                                  transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    delay: i * 0.2
                                  }}
                                />
                              ))}
                            </>
                          )}
                        </AnimatePresence>
                      </motion.div>
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
                        className="text-3xl lg:text-4xl xl:text-5xl font-bold text-[#0A2540] dark:text-white"
                        style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800 }}
                        animate={isHovered ? { scale: 1.05 } : { scale: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        {card.title}
                      </motion.h3>
                      
                      <motion.p
                        className="text-lg lg:text-xl text-[#6C757D] dark:text-white/70 leading-relaxed"
                        style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
                        animate={isHovered ? { opacity: 1 } : { opacity: 0.8 }}
                        transition={{ duration: 0.3 }}
                    >
                        {card.description}
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
                          className="h-full bg-gradient-to-r from-[#00D4B3] to-[#10B981]"
                          initial={{ width: 0 }}
                          whileInView={{ width: '100%' }}
                          viewport={{ once: true }}
                          transition={{ delay: index * 0.2 + 0.7, duration: 0.8 }}
                        />
                      </motion.div>
                    </div>
                    </motion.div>
                </div>

                {/* Connecting line (only visible on desktop) */}
                {index < cards.length - 1 && (
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
