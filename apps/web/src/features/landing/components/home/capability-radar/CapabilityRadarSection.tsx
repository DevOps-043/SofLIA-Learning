'use client';

import { motion, useInView } from 'motion/react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SectionHeading } from '../SectionHeading';
import { RadarChart } from './RadarChart';
import {
  RADAR_AXES,
  RADAR_SERIES,
  RADAR_VALUES,
  type RadarAxisKey,
} from './radar.config';
import styles from '../SofliaHome.module.css';

function AxisDeltaRow({
  axis,
  index,
  isInView,
  isHovered,
  onHover,
  onLeave,
}: {
  axis: RadarAxisKey;
  index: number;
  isInView: boolean;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}) {
  const { t } = useTranslation('home');
  const now = RADAR_VALUES.now[axis];
  const soflia = RADAR_VALUES.soflia[axis];

  return (
    <motion.li
      className={`${styles.radarRow} ${isHovered ? styles.radarRowActive : ''}`}
      onPointerEnter={onHover}
      onPointerLeave={onLeave}
      initial={{ opacity: 0, x: 26 }}
      animate={isInView ? { opacity: 1, x: 0 } : undefined}
      transition={{
        type: 'spring',
        stiffness: 240,
        damping: 26,
        delay: 0.5 + index * 0.09,
      }}
    >
      <span className={styles.radarRowLabel}>{t(`radar.axes.${axis}`)}</span>
      <span className={styles.radarBar} aria-hidden="true">
        <motion.i
          className={`${styles.radarBarSoflia} ${
            isHovered ? styles.radarBarSofliaActive : ''
          }`}
          style={{
            background: RADAR_SERIES.soflia.color,
            opacity: isHovered ? 1 : 0.85,
          }}
          initial={{ width: 0 }}
          animate={isInView ? { width: `${soflia}%` } : undefined}
          transition={{
            duration: 1.1,
            delay: 0.65 + index * 0.09,
            ease: [0.22, 1, 0.36, 1],
          }}
        />
        <motion.i
          className={styles.radarBarNow}
          style={{ left: `${now}%`, background: RADAR_SERIES.now.color }}
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : undefined}
          transition={{ duration: 0.4, delay: 1 + index * 0.09 }}
        />
      </span>
      <span
        className={styles.radarRowDelta}
        style={{
          color: RADAR_SERIES.soflia.color,
        }}
      >
        +{soflia - now}
      </span>
    </motion.li>
  );
}

export function CapabilityRadarSection() {
  const { t } = useTranslation('home');
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.3 });
  const [hoveredAxis, setHoveredAxis] = useState<RadarAxisKey | null>(null);

  return (
    <section ref={sectionRef} className={`${styles.section} ${styles.shell}`}>
      <SectionHeading
        eyebrow={t('radar.eyebrow')}
        title={t('radar.title')}
        description={t('radar.description')}
      />

      <div className={styles.radarLayout}>
        <RadarChart
          isInView={isInView}
          hoveredAxis={hoveredAxis}
          onHoverAxis={setHoveredAxis}
        />

        <div className={styles.radarPanel}>
          <ul className={styles.radarLegend} aria-label={t('radar.legendLabel')}>
            <li>
              <i
                className={styles.radarLegendChipNow}
                style={{ borderColor: RADAR_SERIES.now.color }}
              />
              {t('radar.series.now')}
            </li>
            <li>
              <i style={{ background: RADAR_SERIES.soflia.color }} />
              {t('radar.series.soflia')}
            </li>
          </ul>

          <ul className={styles.radarRows}>
            {RADAR_AXES.map((axis, index) => (
              <AxisDeltaRow
                key={axis}
                axis={axis}
                index={index}
                isInView={isInView}
                isHovered={hoveredAxis === axis}
                onHover={() => setHoveredAxis(axis)}
                onLeave={() => setHoveredAxis(null)}
              />
            ))}
          </ul>

          <p className={styles.radarNote}>{t('radar.note')}</p>
        </div>
      </div>
    </section>
  );
}
