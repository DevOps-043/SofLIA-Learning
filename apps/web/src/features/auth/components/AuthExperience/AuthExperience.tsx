'use client';

import dynamic from 'next/dynamic';
import { motion, useReducedMotion } from 'motion/react';
import {
  useEffect,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import homeStyles from '../../../landing/components/home/SofliaHome.module.css';
import styles from './AuthExperience.module.css';

const AuthLogoScene = dynamic(
  () => import('./AuthLogoScene').then((module) => module.AuthLogoScene),
  { ssr: false, loading: () => null },
);

export interface AuthExperienceBrand {
  logoUrl: string;
  name: string;
  primaryColor?: string | null;
}

interface AuthExperienceProps {
  brand?: AuthExperienceBrand | null;
  children: ReactNode;
  pageStyle?: CSSProperties;
  panelClassName?: string;
  panelStyle?: CSSProperties;
  variant?: 'default' | 'registration' | 'wide';
}

export function AuthExperience({
  brand,
  children,
  pageStyle,
  panelClassName,
  panelStyle,
  variant = 'default',
}: AuthExperienceProps) {
  const reduceMotion = useReducedMotion();
  const [mount3D, setMount3D] = useState(false);

  useEffect(() => {
    if (brand) {
      setMount3D(false);
      return;
    }

    type IdleWindow = Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    const idleWindow = window as IdleWindow;
    let idleId: number | undefined;
    let timeoutId: number | undefined;
    const activate = () => setMount3D(true);

    if (idleWindow.requestIdleCallback) {
      idleId = idleWindow.requestIdleCallback(activate, { timeout: 900 });
    } else {
      timeoutId = window.setTimeout(activate, 240);
    }

    return () => {
      if (idleId !== undefined) idleWindow.cancelIdleCallback?.(idleId);
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, [brand]);

  const entrance = reduceMotion
    ? { duration: 0 }
    : { duration: 0.65, ease: [0.16, 1, 0.3, 1] as const };
  const brandVariables = {
    '--auth-experience-brand': brand?.primaryColor || 'var(--color-accent)',
  } as CSSProperties;

  return (
    <main
      className={`${homeStyles.page} ${styles.page}`}
      style={{ ...pageStyle, ...brandVariables }}
    >
      <div
        className={`${styles.shell} ${
          variant === 'registration'
            ? styles.shellRegistration
            : variant === 'wide'
              ? styles.shellWide
              : ''
        }`}
      >
        <motion.section
          className={styles.brandPanel}
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={entrance}
          aria-label={brand ? `Logo de ${brand.name}` : 'Logo tridimensional interactivo de SofLIA'}
        >
          {brand ? (
            <div className={styles.organizationLogo}>
              <img
                src={brand.logoUrl}
                alt={`Logo de ${brand.name}`}
                className={styles.organizationLogoImage}
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = '/icono.png';
                }}
              />
            </div>
          ) : mount3D ? (
            <div className={styles.canvas}>
              <AuthLogoScene reducedMotion={Boolean(reduceMotion)} />
            </div>
          ) : null}
        </motion.section>

        <motion.section
          className={`${styles.panel} ${panelClassName || ''}`}
          style={panelStyle}
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...entrance, delay: reduceMotion ? 0 : 0.08 }}
        >
          {children}
        </motion.section>
      </div>
    </main>
  );
}

export { default as authExperienceStyles } from './AuthExperience.module.css';
