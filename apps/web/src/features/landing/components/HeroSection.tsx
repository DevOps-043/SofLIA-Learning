'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@aprende-y-aplica/ui';
import { ArrowRight } from 'lucide-react';
import { HeroContent } from '@aprende-y-aplica/shared';
import { fadeIn, slideUp, slideInFromLeft, slideInFromRight, staggerContainer, staggerItem } from '../../../shared/utils/animations';
import { useMotionSafe } from '../../../lib/utils/motion';

interface HeroSectionProps {
  content: HeroContent;
}

export function HeroSection({ content }: HeroSectionProps) {
  const { tag, title, highlightWord, description, ctaText, benefits } = content;
  const { disableHeavy } = useMotionSafe();

  return (
    <section className="min-h-screen flex items-center relative overflow-x-hidden hero-section bg-white dark:bg-[#0F1419]">

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Main Content */}
          <motion.div
            className="space-y-8"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            {/* Title */}
            <motion.h1
              className="text-4xl lg:text-6xl xl:text-7xl font-bold leading-tight text-[#0A2540] dark:text-white"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700 }}
              variants={slideUp}
            >
              <span className="text-[#0A2540] dark:text-white">{title}</span>
              <br />
              <motion.span 
                className="text-[#00D4B3]"
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700 }}
              >
                {highlightWord}
              </motion.span>
            </motion.h1>

            {/* Description */}
            <motion.p
              className="text-lg lg:text-xl leading-relaxed max-w-2xl text-[#6C757D] dark:text-white/90"
              style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}
              variants={fadeIn}
            >
              {description}
            </motion.p>

            {/* CTA Buttons */}
            <motion.div 
              variants={staggerItem}
              className="flex flex-col sm:flex-row gap-4"
            >
              <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link href="/auth">
                <Button
                  size="lg"
                  variant="primary"
                    className="group shadow-lg shadow-[#0A2540]/25 hover:shadow-[#0A2540]/50 relative overflow-hidden bg-[#0A2540] hover:bg-[#0d2f4d] text-white w-full sm:w-auto"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {ctaText}
                    <motion.div
                      animate={disableHeavy ? {} : { x: [0, 4, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <ArrowRight className="w-5 h-5 text-white" />
                    </motion.div>
                  </span>
                </Button>
              </Link>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link href="/conocer-lia">
                  <Button
                    size="lg"
                    variant="outline"
                    className="group shadow-lg shadow-[#00D4B3]/25 hover:shadow-[#00D4B3]/50 relative overflow-hidden border-2 border-[#00D4B3] bg-transparent hover:bg-[#00D4B3]/10 text-[#00D4B3] hover:text-[#00D4B3] dark:text-[#00D4B3] dark:hover:bg-[#00D4B3]/10 w-full sm:w-auto"
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      Conoce al Tutor
                      <motion.div
                        animate={disableHeavy ? {} : { rotate: [0, 15, -15, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        <ArrowRight className="w-5 h-5" />
                      </motion.div>
                    </span>
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Right Column - Logo with Floating Animation */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={slideInFromRight}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center"
          >
            <div className="relative w-full max-w-[360px] lg:max-w-[420px] mx-auto">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                          animate={{
                  scale: 1,
                  opacity: 1,
                  ...(disableHeavy ? {} : { y: [0, -20, 0] }),
                          }}
                          transition={{
                  scale: { delay: 0.2, duration: 0.5 },
                  opacity: { delay: 0.2, duration: 0.5 },
                  y: {
                    delay: 0.7,
                            duration: 3,
                            repeat: Infinity,
                    ease: "easeInOut",
                  }
                          }}
                className="relative w-full aspect-square"
              >
                <Image
                  src="/Logo.png"
                  alt="SofLIA Logo"
                  fill
                  className="object-contain"
                  priority
                />
                      </motion.div>
                  </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
