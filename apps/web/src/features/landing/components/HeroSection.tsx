'use client';

import React from 'react';
import type { HeroContent } from '@aprende-y-aplica/shared';

import { useMotionSafe } from '../../../lib/utils/motion';
import { HeroCopy } from './hero-section/HeroCopy';
import { HeroLogo } from './hero-section/HeroLogo';

interface HeroSectionProps {
  content: HeroContent;
}

export function HeroSection({ content }: HeroSectionProps) {
  const { disableHeavy } = useMotionSafe();

  return (
    <section className="hero-section relative flex min-h-screen items-center overflow-x-hidden bg-white dark:bg-gray-900">
      <div className="container relative z-10 mx-auto px-4">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <HeroCopy content={content} disableHeavy={disableHeavy} />
          <HeroLogo disableHeavy={disableHeavy} />
        </div>
      </div>
    </section>
  );
}
