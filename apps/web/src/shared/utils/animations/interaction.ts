import type { Variants } from 'framer-motion';

import { DEFAULT_EASE } from './constants';

const CARD_TRANSITION = { duration: 0.3, ease: DEFAULT_EASE };

export const cardHover: Variants = {
  rest: {
    scale: 1,
    y: 0,
    transition: CARD_TRANSITION,
  },
  hover: {
    scale: 1.02,
    y: -4,
    transition: CARD_TRANSITION,
  },
};

export const scaleOnHover: Variants = {
  rest: {
    scale: 1,
    transition: CARD_TRANSITION,
  },
  hover: {
    scale: 1.05,
    transition: CARD_TRANSITION,
  },
};

export const cardTap: Variants = {
  rest: { scale: 1 },
  tap: { scale: 0.98 },
};

export const buttonHover: Variants = {
  rest: {
    scale: 1,
    transition: { duration: 0.2 },
  },
  hover: {
    scale: 1.05,
    transition: { duration: 0.2 },
  },
  tap: {
    scale: 0.95,
    transition: { duration: 0.1 },
  },
};
