'use client';

import { animated, to, useSpring } from '@react-spring/web';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import Link from 'next/link';
import { useEffect, useRef, type KeyboardEvent, type PointerEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { SectionHeading } from './SectionHeading';
import styles from './SofliaHome.module.css';
import { useScrollStage } from './useScrollStage';

interface PackageItem {
  id: string;
  name: string;
  scope: string;
  description: string;
}

export function PackagesSection() {
  const { t } = useTranslation('home');
  const reduceMotion = useReducedMotion();
  const packages = t('packages.items', { returnObjects: true }) as PackageItem[];
  const sectionRef = useRef<HTMLElement>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const { activeStage, goToStage } = useScrollStage(sectionRef, packages.length);
  const activePackage = packages[activeStage] ?? packages[0];
  const routeProgress = packages.length > 1 ? activeStage / (packages.length - 1) : 1;

  const [{ rotateX, rotateY, scale }, springApi] = useSpring(() => ({
    rotateX: 0,
    rotateY: 0,
    scale: 1,
    config: { mass: 0.9, tension: 210, friction: 24 },
  }));

  useEffect(() => {
    springApi.start({ rotateX: 0, rotateY: 0, scale: 1 });
  }, [activeStage, springApi]);

  useEffect(() => {
    if (!window.matchMedia('(max-width: 1199px)').matches) return;

    tabRefs.current[activeStage]?.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'nearest',
      inline: 'center',
    });
  }, [activeStage, reduceMotion]);

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (reduceMotion || event.pointerType === 'touch') return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    springApi.start({
      rotateX: y * -3.4,
      rotateY: x * 4.2,
      scale: 1.008,
    });
  };

  const resetTilt = () => {
    springApi.start({ rotateX: 0, rotateY: 0, scale: 1 });
  };

  const selectPackage = (index: number, focusTab = false) => {
    const nextIndex = Math.min(Math.max(index, 0), packages.length - 1);
    goToStage(nextIndex);
    if (focusTab) tabRefs.current[nextIndex]?.focus();
  };

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const isPrevious = event.key === 'ArrowUp' || event.key === 'ArrowLeft';
    const isNext = event.key === 'ArrowDown' || event.key === 'ArrowRight';
    if (!isPrevious && !isNext) return;

    event.preventDefault();
    const offset = isPrevious ? -1 : 1;
    const nextIndex = (index + offset + packages.length) % packages.length;
    selectPackage(nextIndex, true);
  };

  return (
    <section
      ref={sectionRef}
      className={styles.packagesStory}
      aria-labelledby="packages-title"
    >
      <div className={styles.packagesSticky}>
        <div className={styles.shell}>
          <SectionHeading
            eyebrow={t('packages.eyebrow')}
            title={t('packages.title')}
            description={t('packages.description')}
            titleId="packages-title"
          />

          <div className={styles.packagesLayout}>
            <div className={styles.packageRail}>
              <div
                className={styles.packageTabs}
                role="tablist"
                aria-label={t('packages.tabsLabel')}
                aria-orientation="vertical"
              >
                <span className={styles.packageRailTrack} aria-hidden="true">
                  <motion.i
                    animate={{ scaleY: Math.max(routeProgress, 0.02) }}
                    transition={{ type: 'spring', stiffness: 170, damping: 25 }}
                  />
                </span>
                {packages.map((item, index) => (
                  <button
                    id={`package-tab-${item.id}`}
                    key={item.id}
                    ref={(element) => {
                      tabRefs.current[index] = element;
                    }}
                    type="button"
                    role="tab"
                    aria-selected={activeStage === index}
                    aria-controls={`package-panel-${item.id}`}
                    tabIndex={activeStage === index ? 0 : -1}
                    className={`${styles.packageTab} ${
                      activeStage === index ? styles.packageTabActive : ''
                    } ${index < activeStage ? styles.packageTabComplete : ''}`}
                    onClick={() => selectPackage(index)}
                    onKeyDown={(event) => handleTabKeyDown(event, index)}
                  >
                    <span className={styles.packageTabIndex}>
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className={styles.packageTabCopy}>
                      <strong>{item.name}</strong>
                      <small>{item.scope}</small>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <animated.div
              className={styles.packageCard}
              style={{
                transform: to(
                  [rotateX, rotateY, scale],
                  (x, y, nextScale) =>
                    `perspective(1200px) rotateX(${x}deg) rotateY(${y}deg) scale(${nextScale})`,
                ),
              }}
              onPointerMove={handlePointerMove}
              onPointerLeave={resetTilt}
            >
              <div className={styles.packageCardGlow} aria-hidden="true" />

              <AnimatePresence mode="popLayout">
                <motion.article
                  id={`package-panel-${activePackage?.id}`}
                  key={activePackage?.id}
                  role="tabpanel"
                  aria-labelledby={`package-tab-${activePackage?.id}`}
                  className={styles.packageContent}
                  initial={
                    reduceMotion
                      ? false
                      : { opacity: 0, x: -34, filter: 'blur(8px)' }
                  }
                  animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                  exit={{
                    opacity: 0,
                    x: 22,
                    filter: 'blur(5px)',
                    transition: { duration: 0.18, ease: 'easeIn' },
                  }}
                  transition={{ type: 'spring', stiffness: 175, damping: 23 }}
                >
                  <div className={styles.packageMeta}>
                    <span className={styles.packageScope}>{activePackage?.scope}</span>
                    <span className={styles.packageStageLabel}>
                      {t('packages.stageLabel')} {String(activeStage + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <h3>{activePackage?.name}</h3>
                  <p>{activePackage?.description}</p>
                  <div className={styles.packageActions}>
                    <Link
                      href={`/contact?interest=${activePackage?.id ?? 'assessment'}`}
                      className={styles.primaryButton}
                    >
                      {t('packages.cta')}
                      <ArrowUpRight size={16} aria-hidden="true" />
                    </Link>
                    <div className={styles.packageStepControls}>
                      <button
                        type="button"
                        onClick={() => selectPackage(activeStage - 1)}
                        disabled={activeStage === 0}
                        aria-label={t('packages.previous')}
                      >
                        <ArrowLeft size={17} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => selectPackage(activeStage + 1)}
                        disabled={activeStage === packages.length - 1}
                        aria-label={t('packages.next')}
                      >
                        <ArrowRight size={17} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </motion.article>
              </AnimatePresence>

              <div className={styles.packageRouteVisual} aria-hidden="true">
                <span className={styles.packageOrbitOuter} />
                <span className={styles.packageOrbitInner} />
                <motion.div
                  key={activeStage}
                  className={styles.packageOrb}
                  initial={
                    reduceMotion
                      ? false
                      : { scale: 0.72, opacity: 0, rotate: -12 }
                  }
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 165, damping: 18 }}
                >
                  <small>{t('packages.stageLabel')}</small>
                  <strong>{String(activeStage + 1).padStart(2, '0')}</strong>
                </motion.div>
                <ol className={styles.packageRouteNodes}>
                  {packages.map((item, index) => (
                    <li
                      key={item.id}
                      className={`${index === activeStage ? styles.packageRouteNodeActive : ''} ${
                        index < activeStage ? styles.packageRouteNodeComplete : ''
                      }`}
                    >
                      <span>{String(index + 1).padStart(2, '0')}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div
                className={styles.packageProgress}
                role="progressbar"
                aria-label={t('packages.progressLabel')}
                aria-valuemin={1}
                aria-valuemax={packages.length}
                aria-valuenow={activeStage + 1}
              >
                <motion.span
                  animate={{ scaleX: (activeStage + 1) / packages.length }}
                  transition={{ type: 'spring', stiffness: 170, damping: 25 }}
                />
              </div>
            </animated.div>
          </div>
        </div>
      </div>
    </section>
  );
}
