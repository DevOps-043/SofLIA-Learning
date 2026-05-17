'use client';

import React from 'react';
import type { ComparisonCategory } from '@aprende-y-aplica/shared';
import { motion } from 'framer-motion';

import { fadeIn } from '../../../../shared/utils/animations';
import { ComparisonCategoryRows } from '../comparison-table/ComparisonCategoryRows';
import { ComparisonHeader } from '../comparison-table/ComparisonHeader';

interface ComparisonTableProps {
  title: string;
  subtitle: string;
  categories: ComparisonCategory[];
}

export function ComparisonTable({ title, subtitle, categories }: ComparisonTableProps) {
  return (
    <section className="relative overflow-hidden bg-carbon/30 py-24">
      <div className="container relative z-10 mx-auto px-4">
        <ComparisonHeader title={title} subtitle={subtitle} />

        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <motion.div
              className="overflow-hidden rounded-md border border-glass-light bg-glass"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeIn}
            >
              <div className="grid grid-cols-4 gap-4 border-b border-glass-light bg-gradient-to-r from-primary/5 to-success/5 p-6">
                <div className="text-lg font-bold">Caracteristica</div>
                <div className="text-center text-lg font-bold">Team</div>
                <div className="text-center text-lg font-bold">
                  Business
                  <span className="block text-sm font-normal text-primary">Mas Popular</span>
                </div>
                <div className="text-center text-lg font-bold">Enterprise</div>
              </div>
              <ComparisonCategoryRows categories={categories} />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
