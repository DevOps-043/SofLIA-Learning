'use client';

import type { ElementType, ReactNode } from 'react';
import styles from '../SofliaHome.module.css';

interface StarBorderProps {
  as?: ElementType;
  className?: string;
  innerClassName?: string;
  /** CSS color for the traveling glow; defaults to the platform accent. */
  color?: string;
  /** Animation duration, e.g. '6s'. */
  speed?: string;
  children: ReactNode;
}

/**
 * Source-integrated from the React Bits StarBorder registry component:
 * two soft radial glows travel along the top and bottom edges of the
 * container, creating an animated border. Styling lives in the home module
 * so colors come from design-system tokens.
 */
export function StarBorder({
  as = 'div',
  className = '',
  innerClassName = '',
  color = 'var(--color-accent)',
  speed = '6s',
  children,
}: StarBorderProps) {
  const Component = as as 'div';
  return (
    <Component className={`${styles.starBorder} ${className}`}>
      <span
        className={styles.starBorderBottom}
        style={{
          background: `radial-gradient(circle, ${color}, transparent 12%)`,
          animationDuration: speed,
        }}
        aria-hidden="true"
      />
      <span
        className={styles.starBorderTop}
        style={{
          background: `radial-gradient(circle, ${color}, transparent 12%)`,
          animationDuration: speed,
        }}
        aria-hidden="true"
      />
      <span className={`${styles.starBorderInner} ${innerClassName}`}>{children}</span>
    </Component>
  );
}
