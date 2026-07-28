'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@aprende-y-aplica/ui';
import { PricingTier } from '@aprende-y-aplica/shared';
import { fadeIn, slideUp, staggerContainer, staggerItem } from '../../../../shared/utils/animations';
import { Check, ArrowRight, Sparkles } from 'lucide-react';
import { useMotionSafe } from '../../../../lib/utils/motion';

interface PricingSectionProps {
  title: string;
  subtitle: string;
  tiers: PricingTier[];
}

interface PricingWithAnnual extends PricingTier {
  annualPrice?: string;
}

export function PricingSection({ title, subtitle, tiers }: PricingSectionProps) {
  const [isAnnual, setIsAnnual] = useState(true);
  const { disableHeavy } = useMotionSafe();

  // Calcular precios anuales (20% descuento)
  const tiersWithAnnual: PricingWithAnnual[] = tiers.map(tier => {
    if (tier.price === 'Personalizado') {
      return { ...tier, annualPrice: 'Personalizado' };
    }
    const monthlyPrice = parseFloat(tier.price.replace(/[^0-9.]/g, ''));
    const annualPrice = monthlyPrice * 12 * 0.8; // 20% descuento
    return {
      ...tier,
      annualPrice: `$${Math.round(annualPrice)}`
    };
  });

  return (
    <section className="py-12 relative overflow-hidden bg-white dark:bg-carbon-900">
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerContainer}
        >
          <motion.h2
            className="text-3xl lg:text-4xl font-bold mb-4 text-primary dark:text-white"
            style={{ fontFamily: 'var(--font-system-ui)', fontWeight: 700 }}
            variants={slideUp}
          >
            {title}
          </motion.h2>
          <motion.p
            className="text-lg max-w-3xl mx-auto mb-8 text-gray-500 dark:text-white/70"
            style={{ fontFamily: 'var(--font-system-ui)', fontWeight: 400 }}
            variants={fadeIn}
          >
            {subtitle}
          </motion.p>

          {/* Billing Toggle */}
          <motion.div
            variants={fadeIn}
            className="flex items-center justify-center gap-4 mb-8"
          >
            <span
              className={`text-sm font-medium transition-colors ${!isAnnual ? 'text-primary dark:text-white' : 'text-gray-500 dark:text-white/70'}`}
              style={{ fontFamily: 'var(--font-system-ui)', fontWeight: 500 }}
            >
              Mensual
            </span>
            <motion.button
              onClick={() => setIsAnnual(!isAnnual)}
              className="relative w-14 h-8 bg-gray-200 dark:bg-carbon-800 rounded-full p-1 cursor-pointer transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                className="w-6 h-6 rounded-full absolute shadow-md"
                style={{ backgroundColor: 'var(--color-accent)' }}
                animate={{
                  x: isAnnual ? 24 : 0
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              />
              {isAnnual && (
                <motion.div
                  className="absolute -right-14 flex items-center gap-2"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
                    style={{ backgroundColor: 'var(--color-accent)' }}
                  >
                    <span
                      className="text-xs font-bold text-white px-1"
                      style={{ fontFamily: 'var(--font-system-ui)', fontWeight: 700 }}
                    >
                      20%
                    </span>
                  </div>
                  <span
                    className="text-xs font-semibold whitespace-nowrap"
                    style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-system-ui)', fontWeight: 600 }}
                  >
                    OFF
                  </span>
                </motion.div>
              )}
            </motion.button>
            <span
              className={`text-sm font-medium transition-colors ${isAnnual ? 'text-primary dark:text-white' : 'text-gray-500 dark:text-white/70'}`}
              style={{ fontFamily: 'var(--font-system-ui)', fontWeight: 500 }}
            >
              Anual
            </span>
          </motion.div>
        </motion.div>

        {/* Pricing Tiers Grid */}
        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto items-stretch"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
        >
          {tiersWithAnnual.map((tier, index) => {
            const isPopular = tier.isPopular;
            const isEnterprise = tier.id === 'enterprise';

            return (
              <motion.div
                key={tier.id}
                variants={staggerItem}
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className={`relative h-full flex flex-col ${isPopular ? 'lg:scale-105 lg:z-10' : ''}`}
              >
                {/* Badge Más Popular */}
                {isPopular && (
                  <motion.div
                    className="absolute -top-4 left-1/2 -translate-x-1/2 z-30"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div
                      className="px-4 py-1.5 rounded-full shadow-lg text-white text-xs font-semibold flex items-center gap-1.5"
                      style={{ backgroundColor: 'var(--color-accent)', fontFamily: 'var(--font-system-ui)', fontWeight: 600 }}
                    >
                      <Sparkles className="w-3 h-3" />
                      Más Popular
                    </div>
                  </motion.div>
                )}

                {/* Card Container */}
                <div
                  className={`h-full relative rounded-2xl transition-all duration-300 flex flex-col overflow-hidden ${
                    isPopular
                      ? 'bg-white dark:bg-carbon-800 border-2 shadow-2xl'
                      : 'bg-white dark:bg-carbon-800/95 border shadow-lg hover:shadow-xl'
                  }`}
                  style={{
                    borderColor: isPopular ? 'var(--color-accent)' : 'var(--color-gray-200)',
                    ...(isPopular && {
                      boxShadow: '0 20px 60px -12px rgba(0, 212, 179, 0.25)'
                    })
                  }}
                >
                  {/* Top Accent Bar for Popular Plan */}
                  {isPopular && (
                    <div
                      className="h-1.5 w-full"
                      style={{ backgroundColor: 'var(--color-accent)' }}
                    />
                  )}

                  {/* Card Content */}
                  <div className="p-8 flex flex-col flex-1 h-full min-h-0">
                    {/* Plan Header */}
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-3">
                        <h3
                          className="text-2xl font-bold text-primary dark:text-white"
                          style={{ fontFamily: 'var(--font-system-ui)', fontWeight: 700 }}
                        >
                          {tier.name}
                        </h3>
                        {isPopular && (
                          <motion.div
                            className="px-2.5 py-1 rounded-md text-[10px] font-bold text-white uppercase tracking-wide"
                            style={{ backgroundColor: 'var(--color-primary)', fontFamily: 'var(--font-system-ui)', fontWeight: 700 }}
                            animate={disableHeavy ? {} : { scale: [1, 1.05, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            ⭐ Recomendado
                          </motion.div>
                        )}
                      </div>
                      <p
                        className="text-sm text-gray-500 dark:text-white/70 mb-6"
                        style={{ fontFamily: 'var(--font-system-ui)', fontWeight: 400 }}
                      >
                        {tier.description}
                      </p>

                      {/* Price Display */}
                      <div className="mb-6">
                        <div className="flex items-baseline gap-2">
                          <motion.span
                            key={isAnnual ? 'annual' : 'monthly'}
                            className={`font-bold text-primary dark:text-white ${
                              isEnterprise ? 'text-3xl lg:text-4xl' : 'text-4xl lg:text-5xl'
                            }`}
                            style={{ fontFamily: 'var(--font-system-ui)', fontWeight: 700 }}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            {isAnnual && tier.annualPrice ? tier.annualPrice : tier.price}
                          </motion.span>
                          {!isEnterprise && tier.period && (
                            <span
                              className="text-lg text-gray-500 dark:text-white/70"
                              style={{ fontFamily: 'var(--font-system-ui)', fontWeight: 400 }}
                            >
                              {isAnnual ? '/año' : '/mes'}
                            </span>
                          )}
                        </div>
                        {!isEnterprise && tier.price !== 'Personalizado' && (
                          <div
                            className="text-xs mt-2 text-gray-500 dark:text-white/60"
                            style={{ fontFamily: 'var(--font-system-ui)', fontWeight: 400 }}
                          >
                            {isAnnual
                              ? `$${Math.round(parseFloat(tier.price.replace(/[^0-9.]/g, '')) * 12 * 0.8 / 12)}/mes facturado anualmente`
                              : ''
                            }
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Features List */}
                    <div className="flex-grow mb-8">
                      <ul className="space-y-3.5">
                        {tier.features.map((feature, idx) => (
                          <motion.li
                            key={idx}
                            className="flex items-start gap-3"
                            initial={{ opacity: 0, x: -10 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.03 }}
                          >
                            <div
                              className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: 'var(--color-accent)' }}
                            >
                              <Check className="w-3 h-3 text-white" strokeWidth={3} />
                            </div>
                            <span
                              className="text-sm text-primary dark:text-white/90 leading-relaxed"
                              style={{ fontFamily: 'var(--font-system-ui)', fontWeight: 400 }}
                            >
                              {feature}
                            </span>
                          </motion.li>
                        ))}
                      </ul>
                    </div>

                    {/* CTA Button */}
                    <Link href="/auth?type=business" className="block mt-auto">
                      <motion.div
                        className="relative"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {/* Aura/Glow Effect */}
                        {isPopular && (
                          <motion.div
                            className="absolute -inset-1 rounded-xl opacity-75 blur-xl"
                            style={{ backgroundColor: 'var(--color-accent)' }}
                            animate={disableHeavy ? {} : { opacity: [0.5, 0.75, 0.5], scale: [1, 1.05, 1] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                          />
                        )}

                        {/* Button Container */}
                        <motion.button
                          className={`w-full group relative overflow-hidden rounded-xl py-4 px-6 font-semibold text-base transition-all duration-300 ${
                            isPopular
                              ? 'bg-primary text-white'
                              : 'bg-white dark:bg-carbon-800 border-2 text-primary dark:text-white'
                          }`}
                          style={{
                            borderColor: isPopular ? 'transparent' : 'var(--color-accent)',
                            fontFamily: 'var(--font-system-ui)',
                            fontWeight: 600,
                            boxShadow: isPopular
                              ? '0 10px 40px -10px rgba(0, 212, 179, 0.4)'
                              : '0 4px 12px rgba(0, 0, 0, 0.1)'
                          }}
                          whileHover={{
                            boxShadow: isPopular
                              ? '0 15px 50px -10px rgba(0, 212, 179, 0.6)'
                              : '0 8px 20px rgba(0, 212, 179, 0.2)',
                            backgroundColor: isPopular ? 'var(--color-primary-hover)' : undefined,
                            borderColor: isPopular ? undefined : 'var(--color-accent)',
                          }}
                        >
                          {/* Shimmer Effect for Popular Plan — desktop only */}
                          {isPopular && !disableHeavy && (
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                              animate={{ x: ['-100%', '100%'] }}
                              transition={{ duration: 2.5, repeat: Infinity, ease: 'linear', repeatDelay: 0.5 }}
                            />
                          )}

                          {/* Button Content */}
                          <span className="relative z-10 flex items-center justify-center gap-2">
                            {tier.ctaText}
                            <motion.div
                              animate={disableHeavy ? {} : { x: [0, 4, 0] }}
                              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                            >
                              <ArrowRight className="w-4 h-4" />
                            </motion.div>
                          </span>

                          {/* Pulsing Ring for Popular Plan */}
                          {isPopular && (
                            <motion.div
                              className="absolute inset-0 rounded-xl border-2"
                              style={{ borderColor: 'var(--color-accent)' }}
                              animate={disableHeavy ? {} : { opacity: [0.3, 0.6, 0.3], scale: [1, 1.02, 1] }}
                              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                            />
                          )}
                        </motion.button>
                      </motion.div>
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
