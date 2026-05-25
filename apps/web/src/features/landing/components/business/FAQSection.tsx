'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { HelpCircle } from 'lucide-react';

import { fadeIn, staggerContainer } from '../../../../shared/utils/animations';
import { BusinessFAQItem } from './business-faq-section/BusinessFAQItem';

interface FAQ {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  title: string;
  subtitle: string;
  faqs: FAQ[];
  category: 'companies' | 'instructors';
}

export function FAQSection({ title, subtitle, faqs }: FAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="relative overflow-hidden bg-carbon/30 py-24">
      <div className="container relative z-10 mx-auto px-4">
        <motion.div
          className="mb-16 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerContainer}
        >
          <motion.div className="mb-4 flex justify-center" variants={fadeIn}>
            <HelpCircle className="h-12 w-12 text-primary" />
          </motion.div>
          <motion.h2 className="mb-6 text-4xl font-bold lg:text-5xl" variants={fadeIn}>
            {title}
          </motion.h2>
          <motion.p className="mx-auto max-w-3xl text-xl" variants={fadeIn}>
            {subtitle}
          </motion.p>
        </motion.div>

        <motion.div
          className="mx-auto max-w-4xl"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
        >
          {faqs.map((faq, index) => (
            <BusinessFAQItem
              key={`${faq.question}-${index}`}
              answer={faq.answer}
              isOpen={openIndex === index}
              onToggle={() => setOpenIndex(openIndex === index ? null : index)}
              question={faq.question}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
