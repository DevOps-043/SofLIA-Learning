'use client';

import React, { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { faqItems } from './landing-faq-section/landing-faq.config';
import { LandingFAQHeader } from './landing-faq-section/LandingFAQHeader';
import { LandingFAQItem } from './landing-faq-section/LandingFAQItem';

export function FAQSection() {
  const { t } = useTranslation('common');
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  return (
    <section id="faq" ref={sectionRef} className="bg-white py-20 dark:bg-gray-800 lg:py-32">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          <LandingFAQHeader isInView={isInView} t={t} />

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="rounded-md border border-gray-200 bg-gray-100/20 p-6 dark:border-white/10 dark:bg-white/5 lg:p-8"
          >
            {faqItems.map((item, index) => (
              <LandingFAQItem
                key={item.key}
                index={index}
                isOpen={openIndex === index}
                onToggle={() => setOpenIndex(openIndex === index ? null : index)}
                questionKey={item.key}
              />
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
