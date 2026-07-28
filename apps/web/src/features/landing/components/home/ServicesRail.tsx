'use client';

import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Bot,
  BrainCircuit,
  ChartNoAxesCombined,
  ClipboardCheck,
  GripHorizontal,
  Route,
  Sparkles,
} from 'lucide-react';
import {
  animate,
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SectionHeading } from './SectionHeading';
import { SpotlightCard } from './react-bits/SpotlightCard';
import styles from './SofliaHome.module.css';

interface ServiceItem {
  id: string;
  title: string;
  description: string;
  outcome: string;
}

const SERVICE_ICONS = [
  ClipboardCheck,
  Route,
  BrainCircuit,
  BookOpenCheck,
  Sparkles,
  Bot,
  BarChart3,
  ChartNoAxesCombined,
] as const;

const CARD_STRIDE_PX = 352;
const DRIFT_PX_PER_SECOND = 30;
const NUDGE_SPRING = { type: 'spring', stiffness: 210, damping: 28 } as const;

/**
 * Continuous marquee carousel: the rail drifts slowly and wraps seamlessly
 * (items rendered twice, position folded into one loop via useTransform).
 * Dragging, arrows and hover pause the drift; releasing keeps the momentum.
 */
export function ServicesRail() {
  const { t } = useTranslation('home');
  const reduceMotion = useReducedMotion();
  const items = t('services.items', { returnObjects: true }) as ServiceItem[];
  const viewportRef = useRef<HTMLDivElement>(null);
  const baseX = useMotionValue(0);
  const isInteractingRef = useRef(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isInView, setIsInView] = useState(false);

  const loopWidth = items.length * CARD_STRIDE_PX;

  const x = useTransform(baseX, (value) => {
    if (loopWidth === 0) return 0;
    return (((value % loopWidth) + loopWidth) % loopWidth) - loopWidth;
  });

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.25 },
    );
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  useAnimationFrame((_, delta) => {
    if (reduceMotion || isPaused || !isInView || isInteractingRef.current) return;
    baseX.set(baseX.get() - (delta / 1000) * DRIFT_PX_PER_SECOND);
  });

  const nudge = (direction: -1 | 1) => {
    isInteractingRef.current = true;
    baseX.stop();
    animate(baseX, baseX.get() - direction * CARD_STRIDE_PX, {
      ...NUDGE_SPRING,
      onComplete: () => {
        isInteractingRef.current = false;
      },
    });
  };

  const extendedItems = [...items, ...items];

  return (
    <section id="servicios" className={`${styles.section} ${styles.shell}`}>
      <SectionHeading
        eyebrow={t('services.eyebrow')}
        title={t('services.title')}
        description={t('services.description')}
      />

      <div className={styles.railHeader}>
        <p className={styles.dragHint}>
          <GripHorizontal size={16} aria-hidden="true" />
          {t('services.dragHint')}
        </p>
        <div className={styles.railControls}>
          <button
            type="button"
            className={styles.railControl}
            onClick={() => nudge(-1)}
            aria-label={t('services.previous')}
          >
            <ArrowLeft size={17} />
          </button>
          <button
            type="button"
            className={styles.railControl}
            onClick={() => nudge(1)}
            aria-label={t('services.next')}
          >
            <ArrowRight size={17} />
          </button>
        </div>
      </div>

      <div
        ref={viewportRef}
        className={styles.servicesViewport}
        onPointerEnter={() => setIsPaused(true)}
        onPointerLeave={() => setIsPaused(false)}
        onFocusCapture={() => setIsPaused(true)}
        onBlurCapture={() => setIsPaused(false)}
      >
        <motion.div
          className={styles.servicesRail}
          style={{ x }}
          onPanStart={() => {
            isInteractingRef.current = true;
            baseX.stop();
          }}
          onPan={(_, info) => {
            baseX.set(baseX.get() + info.delta.x);
          }}
          onPanEnd={(_, info) => {
            animate(baseX, baseX.get() + info.velocity.x * 0.2, {
              type: 'spring',
              stiffness: 90,
              damping: 22,
              onComplete: () => {
                isInteractingRef.current = false;
              },
            });
          }}
          aria-label={t('services.listLabel')}
        >
          {extendedItems.map((item, index) => {
            const originalIndex = index % items.length;
            const isClone = index >= items.length;
            const Icon = SERVICE_ICONS[originalIndex] ?? Sparkles;
            const card = (
              <SpotlightCard className={styles.serviceCard}>
                <span className={styles.serviceNumber}>
                  {String(originalIndex + 1).padStart(2, '0')}
                </span>
                <div>
                  <span className={styles.serviceIcon}>
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
                <div className={styles.serviceOutcome}>
                  <Sparkles size={15} aria-hidden="true" />
                  {item.outcome}
                </div>
              </SpotlightCard>
            );
            const key = `${item.id}-${isClone ? 'clone' : 'original'}`;
            return isClone ? (
              <div key={key} style={{ display: 'contents' }} aria-hidden="true">
                {card}
              </div>
            ) : (
              <div key={key} style={{ display: 'contents' }}>
                {card}
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
