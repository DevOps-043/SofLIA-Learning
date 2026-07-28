"use client";

import { CapabilityRadarSection } from "./capability-radar/CapabilityRadarSection";
import { ClickSpark } from "./react-bits/ClickSpark";
import { EcosystemSection } from "./EcosystemSection";
import { FinalCTA } from "./FinalCTA";
import { HeroSection } from "./HeroSection";
import { HomeHeader } from "./HomeHeader";
import { ImpactSection } from "./ImpactSection";
import { MethodSection } from "./MethodSection";
import { PackagesSection } from "./PackagesSection";
import { ScrollNarrative } from "./ScrollNarrative";
import { ServicesRail } from "./ServicesRail";
import { VideoShowcase } from "./VideoShowcase";
import styles from "./SofliaHome.module.css";

export function SofliaHome() {
  return (
    <main className={styles.page}>
      <div className={styles.noise} aria-hidden="true" />
      <ClickSpark>
        <HomeHeader />
        <HeroSection />
        <ScrollNarrative />
        <VideoShowcase />
        <EcosystemSection />
        <ServicesRail />
        <MethodSection />
        <CapabilityRadarSection />
        <ImpactSection />
        <PackagesSection />
        <FinalCTA />
      </ClickSpark>
    </main>
  );
}
