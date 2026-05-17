import type { Variants } from 'framer-motion';

import { DEFAULT_EASE } from './constants';

const SLIDE_TRANSITION = { duration: 0.8, ease: DEFAULT_EASE };

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: SLIDE_TRANSITION },
};

export const slideDown: Variants = {
  hidden: { opacity: 0, y: -50 },
  visible: { opacity: 1, y: 0, transition: SLIDE_TRANSITION },
};

export const slideLeft: Variants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0, transition: SLIDE_TRANSITION },
};

export const slideRight: Variants = {
  hidden: { opacity: 0, x: -50 },
  visible: { opacity: 1, x: 0, transition: SLIDE_TRANSITION },
};

export const slideInFromLeft: Variants = {
  hidden: { opacity: 0, x: -100 },
  visible: { opacity: 1, x: 0, transition: SLIDE_TRANSITION },
};

export const slideInFromRight: Variants = {
  hidden: { opacity: 0, x: 100 },
  visible: { opacity: 1, x: 0, transition: SLIDE_TRANSITION },
};
