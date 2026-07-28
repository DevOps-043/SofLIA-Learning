'use client';

import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  RADAR_AXES,
  RADAR_MAX,
  RADAR_SERIES,
  RADAR_VALUES,
  type RadarAxisKey,
} from './radar.config';
import styles from '../SofliaHome.module.css';

const SIZE = 480;
const CENTER = SIZE / 2;
const RADIUS = 168;
const LABEL_RADIUS = RADIUS + 34;
const GRID_RINGS = [0.25, 0.5, 0.75, 1];
const VERTEX_STAGGER = 0.14;

interface TooltipState {
  axis: RadarAxisKey;
  x: number;
  y: number;
}

/** Angle for axis i, starting at the top and going clockwise. */
function axisAngle(index: number): number {
  return -Math.PI / 2 + (index / RADAR_AXES.length) * Math.PI * 2;
}

function pointAt(index: number, radius: number): { x: number; y: number } {
  const angle = axisAngle(index);
  return {
    x: CENTER + Math.cos(angle) * radius,
    y: CENTER + Math.sin(angle) * radius,
  };
}

function polygonPath(radii: number[]): string {
  return `${radii
    .map((radius, index) => {
      const { x, y } = pointAt(index, radius);
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ')} Z`;
}

/** Ease-out-back: settles with a small overshoot so vertices "pop". */
function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
}

/** Per-vertex progress derived from one driver, staggered clockwise. */
function staggeredRadii(values: number[], progress: number): number[] {
  const total = 1 + VERTEX_STAGGER * (values.length - 1);
  return values.map((value, index) => {
    const local = Math.min(
      Math.max((progress * total - index * VERTEX_STAGGER), 0),
      1,
    );
    return (value / RADAR_MAX) * RADIUS * easeOutBack(local);
  });
}

interface RadarChartProps {
  isInView: boolean;
  hoveredAxis: RadarAxisKey | null;
  onHoverAxis: (axis: RadarAxisKey | null) => void;
}

export function RadarChart({
  isInView,
  hoveredAxis,
  onHoverAxis,
}: RadarChartProps) {
  const { t } = useTranslation('home');
  const reduceMotion = useReducedMotion();
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [isDrawn, setIsDrawn] = useState(false);
  const [isChartHovered, setIsChartHovered] = useState(false);
  const hasAnimatedRef = useRef(false);

  const progress = useMotionValue(0);

  const nowValues = RADAR_AXES.map((axis) => RADAR_VALUES.now[axis]);
  const sofliaValues = RADAR_AXES.map((axis) => RADAR_VALUES.soflia[axis]);

  const nowPath = useTransform(progress, (p) =>
    polygonPath(staggeredRadii(nowValues, p)),
  );
  const sofliaPath = useTransform(progress, (p) =>
    polygonPath(staggeredRadii(sofliaValues, p)),
  );

  useEffect(() => {
    if (!isInView || hasAnimatedRef.current) return;
    hasAnimatedRef.current = true;

    if (reduceMotion) {
      progress.set(1);
      setIsDrawn(true);
      return;
    }

    const controls = animate(progress, 1, {
      duration: 1.7,
      ease: [0.22, 1, 0.36, 1],
      delay: 0.35,
      onComplete: () => setIsDrawn(true),
    });
    return () => controls.stop();
  }, [isInView, progress, reduceMotion]);

  const activeGlow = isChartHovered || hoveredAxis !== null;

  return (
    <div
      className={styles.radarChartWrap}
      onPointerEnter={() => setIsChartHovered(true)}
      onPointerLeave={() => setIsChartHovered(false)}
    >
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className={styles.radarSvg}
        role="img"
        aria-label={t('radar.chartLabel')}
      >
        <defs>
          <radialGradient id="radar-fill" cx="50%" cy="50%" r="65%">
            <stop offset="0%" stopColor={RADAR_SERIES.soflia.color} stopOpacity="0.34" />
            <stop offset="100%" stopColor={RADAR_SERIES.soflia.color} stopOpacity="0.04" />
          </radialGradient>
          <filter id="radar-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="7" />
          </filter>
        </defs>

        {/* Grid rings, drawn in from the center outward. */}
        {GRID_RINGS.map((ring, ringIndex) => (
          <motion.path
            key={ring}
            d={polygonPath(RADAR_AXES.map(() => RADIUS * ring))}
            className={styles.radarGrid}
            initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
            animate={
              isInView ? { pathLength: 1, opacity: 1 } : undefined
            }
            transition={{
              duration: 0.8,
              delay: 0.08 * ringIndex,
              ease: 'easeOut',
            }}
          />
        ))}

        {/* Axis spokes. */}
        {RADAR_AXES.map((axis, index) => {
          const outer = pointAt(index, RADIUS);
          return (
            <motion.line
              key={axis}
              x1={CENTER}
              y1={CENTER}
              x2={outer.x}
              y2={outer.y}
              className={`${styles.radarSpoke} ${
                tooltip?.axis === axis || hoveredAxis === axis
                  ? styles.radarSpokeActive
                  : ''
              }`}
              initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
              animate={isInView ? { pathLength: 1, opacity: 1 } : undefined}
              transition={{ duration: 0.6, delay: 0.05 * index, ease: 'easeOut' }}
            />
          );
        })}

        {/* Baseline series: dashed (secondary encoding, CVD floor band). */}
        <motion.path
          d={nowPath}
          fill={RADAR_SERIES.now.color}
          fillOpacity="0.07"
          stroke={RADAR_SERIES.now.color}
          strokeWidth="2"
          strokeDasharray={RADAR_SERIES.now.dash}
          strokeLinejoin="round"
        />

        {/* SofLIA series: interactive hover illumination + gradient fill. */}
        <motion.g
          animate={{
            opacity: activeGlow ? 0.95 : 0.85,
            filter: activeGlow
              ? 'drop-shadow(0 0 6px rgba(0, 153, 135, 0.55)) drop-shadow(0 0 12px rgba(34, 211, 179, 0.35))'
              : 'drop-shadow(0 0 3px rgba(0, 153, 135, 0.25))',
          }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <motion.path
            d={sofliaPath}
            fill="none"
            stroke={RADAR_SERIES.soflia.color}
            strokeWidth={activeGlow ? '2.8' : '2.5'}
            strokeLinejoin="round"
          />
          <motion.path
            d={sofliaPath}
            fill="url(#radar-fill)"
            stroke={RADAR_SERIES.soflia.color}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        </motion.g>

        {/* Vertices, pulses, direct labels and hover targets. */}
        {RADAR_AXES.map((axis, index) => {
          const value = RADAR_VALUES.soflia[axis];
          const vertex = pointAt(index, (value / RADAR_MAX) * RADIUS);
          const label = pointAt(index, LABEL_RADIUS);
          const valuePos = pointAt(index, (value / RADAR_MAX) * RADIUS + 18);
          const isAxisActive = hoveredAxis === axis;

          return (
            <g key={axis}>
              {isDrawn && !reduceMotion && isAxisActive ? (
                <motion.circle
                  cx={vertex.x}
                  cy={vertex.y}
                  r="6"
                  className={styles.radarPulse}
                  initial={{ scale: 0.6, opacity: 0.75 }}
                  animate={{ scale: 2.6, opacity: 0 }}
                  transition={{
                    duration: 1.1,
                    repeat: Infinity,
                    ease: 'easeOut',
                  }}
                  style={{ transformOrigin: `${vertex.x}px ${vertex.y}px` }}
                />
              ) : null}
              <motion.circle
                cx={vertex.x}
                cy={vertex.y}
                r="4.5"
                className={`${styles.radarDot} ${
                  isAxisActive ? styles.radarDotActive : ''
                }`}
                initial={reduceMotion ? false : { scale: 0, opacity: 0 }}
                animate={
                  isDrawn
                    ? { scale: isAxisActive ? 1.4 : 1, opacity: 1 }
                    : undefined
                }
                transition={{
                  type: 'spring',
                  stiffness: 320,
                  damping: 16,
                  delay: 0.06 * index,
                }}
                style={{ transformOrigin: `${vertex.x}px ${vertex.y}px` }}
              />
              <motion.text
                x={valuePos.x}
                y={valuePos.y}
                className={`${styles.radarValue} ${
                  isAxisActive ? styles.radarValueActive : ''
                }`}
                textAnchor="middle"
                dominantBaseline="middle"
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={isDrawn ? { opacity: 1 } : undefined}
                transition={{ duration: 0.4, delay: 0.35 + 0.06 * index }}
              >
                {value}
              </motion.text>
              <motion.text
                x={label.x}
                y={label.y}
                className={`${styles.radarAxisLabel} ${
                  isAxisActive ? styles.radarAxisLabelActive : ''
                }`}
                textAnchor="middle"
                dominantBaseline="middle"
                initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                animate={isInView ? { opacity: 1, y: 0 } : undefined}
                transition={{ duration: 0.5, delay: 0.4 + 0.05 * index }}
              >
                {t(`radar.axes.${axis}`)}
              </motion.text>
              {/* Oversized invisible hover target (>= 28px). */}
              <circle
                cx={vertex.x}
                cy={vertex.y}
                r="18"
                fill="transparent"
                onPointerEnter={() => {
                  setTooltip({ axis, x: vertex.x, y: vertex.y });
                  onHoverAxis(axis);
                }}
                onPointerLeave={() => {
                  setTooltip(null);
                  onHoverAxis(null);
                }}
              />
            </g>
          );
        })}
      </svg>

      {tooltip ? (
        <div
          className={styles.radarTooltip}
          style={{
            left: `${(tooltip.x / SIZE) * 100}%`,
            top: `${(tooltip.y / SIZE) * 100}%`,
          }}
          role="status"
        >
          <strong>{t(`radar.axes.${tooltip.axis}`)}</strong>
          <span>
            <i style={{ background: RADAR_SERIES.now.color }} />
            {t('radar.series.now')}: {RADAR_VALUES.now[tooltip.axis]}
          </span>
          <span>
            <i style={{ background: RADAR_SERIES.soflia.color }} />
            {t('radar.series.soflia')}: {RADAR_VALUES.soflia[tooltip.axis]}
          </span>
        </div>
      ) : null}

      {/* Screen-reader table view of the same data. */}
      <table className="sr-only">
        <caption>{t('radar.chartLabel')}</caption>
        <thead>
          <tr>
            <th>{t('radar.tableAxis')}</th>
            <th>{t('radar.series.now')}</th>
            <th>{t('radar.series.soflia')}</th>
          </tr>
        </thead>
        <tbody>
          {RADAR_AXES.map((axis) => (
            <tr key={axis}>
              <th>{t(`radar.axes.${axis}`)}</th>
              <td>{RADAR_VALUES.now[axis]}</td>
              <td>{RADAR_VALUES.soflia[axis]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
