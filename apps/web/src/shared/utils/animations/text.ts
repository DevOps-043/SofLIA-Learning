import type { Variants } from 'framer-motion';

import { DEFAULT_EASE } from './constants';

export const textReveal: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: DEFAULT_EASE,
    },
  },
};

export const textSlideUp: Variants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 1,
      ease: DEFAULT_EASE,
    },
  },
};
