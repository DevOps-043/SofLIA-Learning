'use client';

import React from 'react';
import type { HeroContent } from '@aprende-y-aplica/shared';

import { HeroBusinessBenefitsCard } from './hero-business/HeroBusinessBenefitsCard';
import { HeroBusinessCopy } from './hero-business/HeroBusinessCopy';

interface HeroBusinessSectionProps {
  content: HeroContent;
}

export function HeroBusinessSection({ content }: HeroBusinessSectionProps) {
  return (
    <section className="hero-section relative flex min-h-screen items-start overflow-hidden bg-white pt-32 dark:bg-gray-900 lg:pt-36">
      <div className="container relative z-10 mx-auto px-4 py-12 lg:py-16">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <HeroBusinessCopy content={content} />
          <HeroBusinessBenefitsCard />
        </div>
      </div>
    </section>
  );
}
