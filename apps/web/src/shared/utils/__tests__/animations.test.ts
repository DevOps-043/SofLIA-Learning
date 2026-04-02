import { describe, it, expect } from 'vitest';
import {
  fadeIn,
  fadeInUp,
  fadeInDown,
  fadeInLeft,
  fadeInRight,
  scaleIn,
  scaleInBounce,
  slideUp,
  slideDown,
  slideLeft,
  slideRight,
  staggerContainer,
  staggerItem,
  cardHover,
  buttonHover,
  modalBackdrop,
  modalContent,
  dropdown,
  pageTransition,
  createStaggerAnimation,
  createFadeInAnimation,
  createScaleAnimation,
} from '../animations';

// ─── Animation constants ──────────────────────────────────────────────────────

describe('animation constants', () => {
  it('fadeIn has hidden and visible states', () => {
    expect(fadeIn).toHaveProperty('hidden');
    expect(fadeIn).toHaveProperty('visible');
  });

  it('fadeIn hidden state has opacity 0', () => {
    expect((fadeIn.hidden as any).opacity).toBe(0);
  });

  it('fadeIn visible state has opacity 1', () => {
    expect((fadeIn.visible as any).opacity).toBe(1);
  });

  it('fadeInUp hidden state has positive y value', () => {
    expect((fadeInUp.hidden as any).y).toBeGreaterThan(0);
  });

  it('fadeInUp visible state has y=0', () => {
    expect((fadeInUp.visible as any).y).toBe(0);
  });

  it('fadeInDown hidden state has negative y value', () => {
    expect((fadeInDown.hidden as any).y).toBeLessThan(0);
  });

  it('fadeInLeft hidden state has negative x value', () => {
    expect((fadeInLeft.hidden as any).x).toBeLessThan(0);
  });

  it('fadeInRight hidden state has positive x value', () => {
    expect((fadeInRight.hidden as any).x).toBeGreaterThan(0);
  });

  it('scaleIn hidden state has scale < 1', () => {
    expect((scaleIn.hidden as any).scale).toBeLessThan(1);
  });

  it('scaleIn visible state has scale = 1', () => {
    expect((scaleIn.visible as any).scale).toBe(1);
  });

  it('scaleInBounce hidden state has scale < 1', () => {
    expect((scaleInBounce.hidden as any).scale).toBeLessThan(1);
  });

  it('slideUp hidden state has y > 0 (below viewport)', () => {
    expect((slideUp.hidden as any).y).toBeGreaterThan(0);
  });

  it('slideDown hidden state has y < 0 (above viewport)', () => {
    expect((slideDown.hidden as any).y).toBeLessThan(0);
  });

  it('slideLeft hidden state has x > 0 (right of viewport)', () => {
    expect((slideLeft.hidden as any).x).toBeGreaterThan(0);
  });

  it('slideRight hidden state has x < 0 (left of viewport)', () => {
    expect((slideRight.hidden as any).x).toBeLessThan(0);
  });

  it('staggerContainer visible state has transition with staggerChildren', () => {
    const transition = (staggerContainer.visible as any).transition;
    expect(transition).toHaveProperty('staggerChildren');
    expect(transition.staggerChildren).toBeGreaterThan(0);
  });

  it('staggerItem has hidden and visible states', () => {
    expect(staggerItem).toHaveProperty('hidden');
    expect(staggerItem).toHaveProperty('visible');
  });

  it('cardHover has rest and hover states', () => {
    expect(cardHover).toHaveProperty('rest');
    expect(cardHover).toHaveProperty('hover');
  });

  it('cardHover hover state has scale > 1', () => {
    expect((cardHover.hover as any).scale).toBeGreaterThan(1);
  });

  it('buttonHover has rest, hover and tap states', () => {
    expect(buttonHover).toHaveProperty('rest');
    expect(buttonHover).toHaveProperty('hover');
    expect(buttonHover).toHaveProperty('tap');
  });

  it('modalBackdrop has hidden, visible and exit states', () => {
    expect(modalBackdrop).toHaveProperty('hidden');
    expect(modalBackdrop).toHaveProperty('visible');
    expect(modalBackdrop).toHaveProperty('exit');
  });

  it('modalContent hidden has scale and y offset', () => {
    expect((modalContent.hidden as any).scale).toBeLessThan(1);
    expect((modalContent.hidden as any).y).toBeGreaterThan(0);
  });

  it('dropdown has hidden, visible and exit states', () => {
    expect(dropdown).toHaveProperty('hidden');
    expect(dropdown).toHaveProperty('visible');
    expect(dropdown).toHaveProperty('exit');
  });

  it('pageTransition has initial, animate and exit states', () => {
    expect(pageTransition).toHaveProperty('initial');
    expect(pageTransition).toHaveProperty('animate');
    expect(pageTransition).toHaveProperty('exit');
  });
});

// ─── createStaggerAnimation ───────────────────────────────────────────────────

describe('createStaggerAnimation', () => {
  it('returns object with hidden and visible states', () => {
    const anim = createStaggerAnimation();
    expect(anim).toHaveProperty('hidden');
    expect(anim).toHaveProperty('visible');
  });

  it('uses default delay of 0.1', () => {
    const anim = createStaggerAnimation();
    expect((anim.visible as any).transition.staggerChildren).toBe(0.1);
  });

  it('uses custom delay when provided', () => {
    const anim = createStaggerAnimation(0.3);
    expect((anim.visible as any).transition.staggerChildren).toBe(0.3);
  });

  it('hidden state has opacity 0', () => {
    const anim = createStaggerAnimation();
    expect((anim.hidden as any).opacity).toBe(0);
  });

  it('visible state has opacity 1', () => {
    const anim = createStaggerAnimation();
    expect((anim.visible as any).opacity).toBe(1);
  });

  it('includes delayChildren in transition', () => {
    const anim = createStaggerAnimation();
    expect((anim.visible as any).transition.delayChildren).toBe(0.2);
  });
});

// ─── createFadeInAnimation ────────────────────────────────────────────────────

describe('createFadeInAnimation', () => {
  it('returns object with hidden and visible states', () => {
    const anim = createFadeInAnimation();
    expect(anim).toHaveProperty('hidden');
    expect(anim).toHaveProperty('visible');
  });

  it('default direction "up" produces positive y offset in hidden', () => {
    const anim = createFadeInAnimation('up');
    expect((anim.hidden as any).y).toBeGreaterThan(0);
  });

  it('direction "down" produces negative y offset in hidden', () => {
    const anim = createFadeInAnimation('down');
    expect((anim.hidden as any).y).toBeLessThan(0);
  });

  it('direction "left" produces positive x offset in hidden', () => {
    const anim = createFadeInAnimation('left');
    expect((anim.hidden as any).x).toBeGreaterThan(0);
  });

  it('direction "right" produces negative x offset in hidden', () => {
    const anim = createFadeInAnimation('right');
    expect((anim.hidden as any).x).toBeLessThan(0);
  });

  it('visible state has opacity 1, x=0, y=0', () => {
    const anim = createFadeInAnimation('up');
    expect((anim.visible as any).opacity).toBe(1);
    expect((anim.visible as any).x).toBe(0);
    expect((anim.visible as any).y).toBe(0);
  });

  it('uses custom distance when provided', () => {
    const anim = createFadeInAnimation('up', 100);
    expect((anim.hidden as any).y).toBe(100);
  });

  it('hidden state has opacity 0', () => {
    const anim = createFadeInAnimation();
    expect((anim.hidden as any).opacity).toBe(0);
  });
});

// ─── createScaleAnimation ─────────────────────────────────────────────────────

describe('createScaleAnimation', () => {
  it('returns object with hidden and visible states', () => {
    const anim = createScaleAnimation();
    expect(anim).toHaveProperty('hidden');
    expect(anim).toHaveProperty('visible');
  });

  it('uses default initialScale of 0.9', () => {
    const anim = createScaleAnimation();
    expect((anim.hidden as any).scale).toBe(0.9);
  });

  it('uses default finalScale of 1', () => {
    const anim = createScaleAnimation();
    expect((anim.visible as any).scale).toBe(1);
  });

  it('uses custom initialScale when provided', () => {
    const anim = createScaleAnimation(0.5);
    expect((anim.hidden as any).scale).toBe(0.5);
  });

  it('uses custom finalScale when provided', () => {
    const anim = createScaleAnimation(0.9, 1.1);
    expect((anim.visible as any).scale).toBe(1.1);
  });

  it('hidden state has opacity 0', () => {
    const anim = createScaleAnimation();
    expect((anim.hidden as any).opacity).toBe(0);
  });

  it('visible state has opacity 1', () => {
    const anim = createScaleAnimation();
    expect((anim.visible as any).opacity).toBe(1);
  });

  it('visible state has transition config', () => {
    const anim = createScaleAnimation();
    expect((anim.visible as any).transition).toBeDefined();
    expect((anim.visible as any).transition.duration).toBeGreaterThan(0);
  });
});
