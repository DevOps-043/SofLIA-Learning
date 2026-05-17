'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { Instructor } from '@aprende-y-aplica/shared';

import { staggerContainer } from '../../../../shared/utils/animations';
import { InstructorCard } from './instructors-section/InstructorCard';
import { InstructorsHeader } from './instructors-section/InstructorsHeader';

interface InstructorsSectionProps {
  title: string;
  subtitle: string;
  instructors: Instructor[];
}

export function InstructorsSection({
  title,
  subtitle,
  instructors,
}: InstructorsSectionProps) {
  return (
    <section className="relative overflow-hidden py-24">
      <div className="container relative z-10 mx-auto px-4">
        <InstructorsHeader title={title} subtitle={subtitle} />

        <motion.div
          className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
        >
          {instructors.map((instructor) => (
            <InstructorCard key={instructor.id} instructor={instructor} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
