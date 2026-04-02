'use client';

import React, { useRef } from 'react';
import { useInView, useScroll, useTransform } from 'framer-motion';
import {
  LiaCapabilitiesSection,
  LiaHeroSection,
  LiaLandingBackground,
  LiaLandingBackLink,
  LiaLandingCta,
  LiaMetaphorsSection,
  LiaPersonalitySection,
  LiaStudyPlannerSection,
} from './components';

export default function ConocerLiaPage() {
  const heroRef = useRef<HTMLElement>(null);
  const capabilitiesRef = useRef<HTMLElement>(null);
  const metaphorsRef = useRef<HTMLElement>(null);
  const featuresRef = useRef<HTMLElement>(null);

  const heroInView = useInView(heroRef, { once: true, amount: 0.3 });
  const { scrollYProgress: capabilitiesScroll } = useScroll({
    target: capabilitiesRef,
    offset: ['start end', 'end start'],
  });
  const capabilitiesY = useTransform(capabilitiesScroll, [0, 1], [50, -50]);

  return (
    <main className="min-h-screen bg-white dark:bg-[#0F1419] relative overflow-x-hidden">
      <LiaLandingBackground />
      <LiaLandingBackLink />
      <LiaHeroSection heroRef={heroRef} heroInView={heroInView} />
      <LiaMetaphorsSection sectionRef={metaphorsRef} />
      <LiaCapabilitiesSection sectionRef={capabilitiesRef} capabilitiesY={capabilitiesY} />
      <LiaStudyPlannerSection />
      <LiaPersonalitySection sectionRef={featuresRef} />
      <LiaLandingCta />
    </main>
  );
}
