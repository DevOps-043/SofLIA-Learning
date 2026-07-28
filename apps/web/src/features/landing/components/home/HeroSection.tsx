"use client";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { useInView } from "motion/react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useThemeStore } from "@/core/stores/themeStore";
import { HeroCanvasBoundary } from "./HeroCanvasBoundary";
import { useStage3DEnabled } from "./logo-stage/useStage3DEnabled";
import { BlurText } from "./react-bits/BlurText";
import styles from "./SofliaHome.module.css";

const HeroLogoScene = dynamic(
  () =>
    import("./logo-stage/LogoStageScene").then((module) => ({
      default: module.HeroLogoScene,
    })),
  { ssr: false, loading: () => null },
);

const HERO_STAGES = ["diagnosis", "adoption", "impact"] as const;
const HERO_TEXT_FROM = { filter: "blur(3px)", opacity: 0.78, y: 12 };
const HERO_TEXT_TO = [
  { filter: "blur(1px)", opacity: 0.94, y: 2 },
  { filter: "blur(0px)", opacity: 1, y: 0 },
];

export function HeroSection() {
  const { t } = useTranslation("home");
  const stage3DEnabled = useStage3DEnabled();
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme);
  const [accent, setAccent] = useState("rgb(0, 212, 179)");
  const visualRef = useRef<HTMLDivElement>(null);
  // Mount the hero canvas only while in view, so it never competes for a WebGL
  // context with the ecosystem canvas further down the page.
  const heroInView = useInView(visualRef, { margin: "150px 0px 150px 0px" });

  useEffect(() => {
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue("--color-accent")
      .trim();
    if (value) setAccent(value);
  }, [resolvedTheme]);

  const staticLogo = (
    <div className={styles.heroFallback}>
      <Image
        src="/Logo.png"
        alt={t("hero.logoAlt")}
        fill
        sizes="(min-width: 960px) 34vw, 64vw"
        className="object-contain"
        priority
      />
    </div>
  );

  return (
    <section
      className={`${styles.hero} ${styles.shell}`}
      aria-labelledby="home-hero-title"
    >
      <div className={styles.heroCopy}>
        <p className={styles.eyebrow}>{t("hero.eyebrow")}</p>
        <h1 id="home-hero-title" className={styles.heroTitle}>
          <BlurText
            text={t("hero.titleStart")}
            delay={45}
            stepDuration={0.28}
            animationFrom={HERO_TEXT_FROM}
            animationTo={HERO_TEXT_TO}
          />
          <BlurText
            text={t("hero.titleHighlight")}
            delay={40}
            stepDuration={0.28}
            animationFrom={HERO_TEXT_FROM}
            animationTo={HERO_TEXT_TO}
            className={styles.heroTitleAccent}
          />
        </h1>
        <p className={styles.heroDescription}>{t("hero.description")}</p>

        <div className={styles.heroActions}>
          <Link
            href="/contact?interest=assessment"
            className={styles.primaryButton}
          >
            {t("hero.primaryCta")}
            <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
          <a href="#sistema" className={styles.secondaryButton}>
            {t("hero.secondaryCta")}
            <ArrowDownRight size={17} aria-hidden="true" />
          </a>
        </div>

        <ul className={styles.heroStages} aria-label={t("hero.stagesLabel")}>
          {HERO_STAGES.map((stage) => (
            <li key={stage} className={styles.heroStage}>
              {t(`hero.stages.${stage}`)}
            </li>
          ))}
        </ul>
      </div>

      <div ref={visualRef} className={styles.heroVisual}>
        {stage3DEnabled && heroInView ? (
          <HeroCanvasBoundary fallback={staticLogo}>
            <div className={styles.heroCanvas}>
              <HeroLogoScene accent={accent} />
            </div>
          </HeroCanvasBoundary>
        ) : (
          staticLogo
        )}
      </div>
    </section>
  );
}
