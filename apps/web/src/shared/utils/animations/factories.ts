import { DEFAULT_EASE } from './constants';

type FadeDirection = 'up' | 'down' | 'left' | 'right';

export const createStaggerAnimation = (delay: number = 0.1) => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: delay,
      delayChildren: 0.2,
    },
  },
});

export const createFadeInAnimation = (
  direction: FadeDirection = 'up',
  distance: number = 30,
) => {
  const directions = {
    up: { y: distance },
    down: { y: -distance },
    left: { x: distance },
    right: { x: -distance },
  };

  return {
    hidden: {
      opacity: 0,
      ...directions[direction],
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration: 0.6,
        ease: DEFAULT_EASE,
      },
    },
  };
};

export const createScaleAnimation = (
  initialScale: number = 0.9,
  finalScale: number = 1,
) => ({
  hidden: {
    opacity: 0,
    scale: initialScale,
  },
  visible: {
    opacity: 1,
    scale: finalScale,
    transition: {
      duration: 0.4,
      ease: DEFAULT_EASE,
    },
  },
});
