'use client';

import React, { useRef } from 'react';
import { motion, useInView, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Zap } from 'lucide-react';
import { useMotionSafe } from '../../../lib/utils/motion';

export function CTASection() {
  const sectionRef = useRef<HTMLElement>(null);
  const { disableHeavy } = useMotionSafe();
  const isInView = useInView(sectionRef, { once: false, amount: 0.2 });

  // Parallax scroll transforms — disabled on mobile to eliminate scroll listener overhead
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start']
  });
  const y1 = useTransform(scrollYProgress, [0, 1], disableHeavy ? [0, 0] : [0, -100]);
  const y2 = useTransform(scrollYProgress, [0, 1], disableHeavy ? [0, 0] : [0, 100]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0.5]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], disableHeavy ? [1, 1, 1] : [0.9, 1, 1.1]);

  return (
    <section
      ref={sectionRef}
      className="pt-16 lg:pt-20 pb-4 lg:pb-6 relative bg-gradient-to-br from-white via-[#F8F9FA] to-white dark:from-[#0F1419] dark:via-[#0A0D12] dark:to-[#0F1419]"
    >
      {/* Animated Background Effects */}
      <motion.div
        className="absolute inset-0"
        style={{ opacity: opacity as React.CSSProperties['opacity'] }}
      >
        {/* Gradient Orbs — static on mobile, animated on desktop */}
        <motion.div
          className="absolute -top-[300px] -left-[300px] w-[900px] h-[900px] bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20 rounded-full blur-3xl"
          style={{ y: y1 }}
          animate={disableHeavy ? {} : { scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3], x: [0, 50, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-[300px] -right-[300px] w-[900px] h-[900px] bg-[#0A2540]/10 dark:bg-[#0A2540]/20 rounded-full blur-3xl"
          style={{ y: y2 }}
          animate={disableHeavy ? {} : { scale: [1, 1.4, 1], opacity: [0.2, 0.5, 0.2], x: [0, -50, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
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
        <motion.div
          className="text-center max-w-5xl mx-auto"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ scale }}
        >
          {/* Logo SOFLIA */}
          <motion.div
            className="flex justify-center mb-8"
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <div className="relative">
              <Image
                src="/Logo.png"
                alt="SofLIA Logo"
                width={80}
                height={80}
                className="w-16 h-16 lg:w-20 lg:h-20 object-contain"
                priority
              />
            </div>
          </motion.div>

          {/* Main Title */}
          <motion.h2
            className="text-5xl lg:text-7xl xl:text-8xl font-bold mb-4 text-[#0A2540] dark:text-white leading-tight"
            style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900 }}
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{
              duration: 0.8,
              type: 'spring',
              stiffness: 100
            }}
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#0A2540] via-[#00D4B3] to-[#0A2540] dark:from-white dark:via-[#00D4B3] dark:to-white">
              ¿Listo para revolucionar
            </span>
            <br />
            <span className="text-[#00D4B3]">tu carrera?</span>
          </motion.h2>

          {/* Subtitle */}
          <motion.p
            className="text-xl lg:text-2xl xl:text-3xl mb-8 max-w-3xl mx-auto leading-relaxed text-[#6C757D] dark:text-white/80 font-medium"
            style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            Únete a miles de profesionales que ya están transformando su futuro con IA
          </motion.p>

          {/* CTA Button - Rediseñado */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <Link href="/auth">
              <motion.button
                className="group relative px-12 py-5 lg:px-16 lg:py-6 bg-gradient-to-r from-[#0A2540] via-[#0A2540] to-[#00D4B3] text-white rounded-2xl font-bold text-lg lg:text-xl overflow-hidden shadow-2xl shadow-[#00D4B3]/30"
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700 }}
                whileHover={{
                  scale: 1.05,
                  boxShadow: '0 20px 60px rgba(0, 212, 179, 0.4)'
                }}
                whileTap={{ scale: 0.98 }}
                style={{ boxShadow: '0 20px 60px rgba(0, 212, 179, 0.35)' }}
              >
                {/* Hover gradient — CSS only, no JS animation */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#00D4B3] via-[#10B981] to-[#00D4B3] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Shimmer — desktop only */}
                {!disableHeavy && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12"
                    animate={{ x: ['-200%', '200%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear', repeatDelay: 1 }}
                  />
                )}

                {/* Button Content */}
                <span className="relative z-10 flex items-center gap-3">
                  <Zap className="w-5 h-5 lg:w-6 lg:h-6" />
                  <span>Comienza Ahora</span>
                  <ArrowRight className="w-5 h-5 lg:w-6 lg:h-6 transition-transform duration-300 group-hover:translate-x-1" />
                </span>

                {/* Border glow — static */}
                <div className="absolute inset-0 rounded-2xl border-2 border-[#00D4B3]/50 pointer-events-none" />
              </motion.button>
            </Link>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            className="mt-6 flex flex-wrap justify-center items-center gap-6 text-sm text-[#6C757D] dark:text-white/60"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.7, duration: 0.6 }}
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span>Sin tarjeta de crédito</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span>Acceso inmediato</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span>Cancelación en cualquier momento</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Footer with Legal Links */}
        <motion.footer
          className="mt-12 lg:mt-16 pt-8 border-t border-[#E9ECEF] dark:border-[#6C757D]/30"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.9, duration: 0.6 }}
        >
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 text-sm">
            <p className="text-[#6C757D] dark:text-white/60">
              © {new Date().getFullYear()} SofLIA. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-4">
              <Link
                href="/privacy"
                className="text-[#0A2540] dark:text-[#00D4B3] hover:underline transition-colors font-medium"
              >
                Política de Privacidad
              </Link>
              <span className="text-[#6C757D] dark:text-white/40">â€¢</span>
              <Link
                href="/terms"
                className="text-[#0A2540] dark:text-[#00D4B3] hover:underline transition-colors font-medium"
              >
                Términos de Servicio
              </Link>
            </div>
          </div>
        </motion.footer>
      </div>
    </section>
  );
}
