import { describe, it, expect } from 'vitest';
import {
  BUSINESS_PLANS,
  getPlanById,
  calculatePlanPrice,
  calculateYearlySavings,
  calculateEndDate,
  calculateMonthlyEquivalent,
  formatPlanPrice,
  isValidPlanId,
  isValidBillingCycle,
} from '../subscription.utils';

// ─── BUSINESS_PLANS ───────────────────────────────────────────────────────────

describe('BUSINESS_PLANS', () => {
  it('defines team, business, enterprise plans', () => {
    expect(BUSINESS_PLANS).toHaveProperty('team');
    expect(BUSINESS_PLANS).toHaveProperty('business');
    expect(BUSINESS_PLANS).toHaveProperty('enterprise');
  });

  it('team plan has maxUsers=10', () => {
    expect(BUSINESS_PLANS.team.maxUsers).toBe(10);
  });

  it('business plan has maxUsers=50', () => {
    expect(BUSINESS_PLANS.business.maxUsers).toBe(50);
  });

  it('enterprise plan has very high maxUsers', () => {
    expect(BUSINESS_PLANS.enterprise.maxUsers).toBeGreaterThan(1000);
  });

  it('team plan has higher price than team monthly * 12', () => {
    const team = BUSINESS_PLANS.team;
    const monthlyAnnual = team.pricing.priceMonthly * 12;
    // Yearly price should be less than paying monthly for a year (savings)
    expect(team.pricing.priceYearly).toBeLessThan(monthlyAnnual);
  });
});

// ─── getPlanById ──────────────────────────────────────────────────────────────

describe('getPlanById', () => {
  it('returns team plan', () => {
    const plan = getPlanById('team');
    expect(plan).not.toBeNull();
    expect(plan!.id).toBe('team');
  });

  it('returns business plan', () => {
    expect(getPlanById('business')).not.toBeNull();
  });

  it('returns enterprise plan', () => {
    expect(getPlanById('enterprise')).not.toBeNull();
  });

  it('normalizes to lowercase', () => {
    expect(getPlanById('TEAM')).not.toBeNull();
    expect(getPlanById('Business')).not.toBeNull();
  });

  it('returns null for unknown plan', () => {
    expect(getPlanById('unknown')).toBeNull();
    expect(getPlanById('')).toBeNull();
  });
});

// ─── calculatePlanPrice ───────────────────────────────────────────────────────

describe('calculatePlanPrice', () => {
  it('returns monthly price for monthly cycle', () => {
    const price = calculatePlanPrice('team', 'monthly');
    expect(price).toBe(BUSINESS_PLANS.team.pricing.priceMonthly);
  });

  it('returns yearly price for yearly cycle', () => {
    const price = calculatePlanPrice('team', 'yearly');
    expect(price).toBe(BUSINESS_PLANS.team.pricing.priceYearly);
  });

  it('yearly price is less than monthly * 12', () => {
    const yearly = calculatePlanPrice('business', 'yearly');
    const monthly12 = calculatePlanPrice('business', 'monthly') * 12;
    expect(yearly).toBeLessThan(monthly12);
  });

  it('returns 0 for enterprise plan', () => {
    expect(calculatePlanPrice('enterprise', 'monthly')).toBe(0);
    expect(calculatePlanPrice('enterprise', 'yearly')).toBe(0);
  });
});

// ─── calculateYearlySavings ───────────────────────────────────────────────────

describe('calculateYearlySavings', () => {
  it('returns a percentage (0-100) for team plan', () => {
    const savings = calculateYearlySavings('team');
    expect(savings).toBeGreaterThan(0);
    expect(savings).toBeLessThanOrEqual(100);
  });

  it('returns 0 for enterprise plan', () => {
    expect(calculateYearlySavings('enterprise')).toBe(0);
  });

  it('returns rounded integer', () => {
    const savings = calculateYearlySavings('business');
    expect(Number.isInteger(savings)).toBe(true);
  });

  it('team and business have positive savings', () => {
    expect(calculateYearlySavings('team')).toBeGreaterThan(0);
    expect(calculateYearlySavings('business')).toBeGreaterThan(0);
  });
});

// ─── calculateEndDate ─────────────────────────────────────────────────────────

describe('calculateEndDate', () => {
  it('adds 1 month for monthly billing', () => {
    const start = new Date('2025-06-01');
    const end = calculateEndDate('monthly', start);
    expect(end.getMonth()).toBe(6); // July
    expect(end.getFullYear()).toBe(2025);
  });

  it('adds 1 year for yearly billing', () => {
    const start = new Date('2025-06-01');
    const end = calculateEndDate('yearly', start);
    expect(end.getFullYear()).toBe(2026);
    expect(end.getMonth()).toBe(5); // June
  });

  it('uses today as default startDate', () => {
    const before = new Date();
    const end = calculateEndDate('monthly');
    expect(end.getTime()).toBeGreaterThan(before.getTime());
  });

  it('end date is after start date', () => {
    const start = new Date('2025-01-15');
    const endMonthly = calculateEndDate('monthly', start);
    const endYearly = calculateEndDate('yearly', start);
    expect(endMonthly.getTime()).toBeGreaterThan(start.getTime());
    expect(endYearly.getTime()).toBeGreaterThan(start.getTime());
  });

  it('yearly end is later than monthly end', () => {
    const start = new Date('2025-06-01');
    const monthly = calculateEndDate('monthly', start);
    const yearly = calculateEndDate('yearly', start);
    expect(yearly.getTime()).toBeGreaterThan(monthly.getTime());
  });
});

// ─── calculateMonthlyEquivalent ───────────────────────────────────────────────

describe('calculateMonthlyEquivalent', () => {
  it('returns monthly price for monthly cycle', () => {
    const result = calculateMonthlyEquivalent('team', 'monthly');
    expect(result).toBe(BUSINESS_PLANS.team.pricing.priceMonthly);
  });

  it('returns yearly / 12 (rounded) for yearly cycle', () => {
    const result = calculateMonthlyEquivalent('team', 'yearly');
    const expected = Math.round(BUSINESS_PLANS.team.pricing.priceYearly / 12);
    expect(result).toBe(expected);
  });

  it('returns 0 for enterprise', () => {
    expect(calculateMonthlyEquivalent('enterprise', 'monthly')).toBe(0);
    expect(calculateMonthlyEquivalent('enterprise', 'yearly')).toBe(0);
  });

  it('yearly equivalent is less than monthly price', () => {
    const monthly = calculateMonthlyEquivalent('business', 'monthly');
    const yearlyEquiv = calculateMonthlyEquivalent('business', 'yearly');
    expect(yearlyEquiv).toBeLessThan(monthly);
  });
});

// ─── formatPlanPrice ──────────────────────────────────────────────────────────

describe('formatPlanPrice', () => {
  it('returns yearly price string for yearly cycle', () => {
    const result = formatPlanPrice('team', 'yearly');
    expect(result).toBe(BUSINESS_PLANS.team.pricing.yearlyPrice);
  });

  it('returns monthly price string for monthly cycle', () => {
    const result = formatPlanPrice('team', 'monthly');
    expect(result).toBe(BUSINESS_PLANS.team.pricing.monthlyPrice);
  });

  it('returns "Personalizado" for enterprise', () => {
    expect(formatPlanPrice('enterprise', 'monthly')).toBe('Personalizado');
    expect(formatPlanPrice('enterprise', 'yearly')).toBe('Personalizado');
  });

  it('returns non-empty string for known plans', () => {
    expect(formatPlanPrice('business', 'monthly').length).toBeGreaterThan(0);
    expect(formatPlanPrice('business', 'yearly').length).toBeGreaterThan(0);
  });
});

// ─── isValidPlanId ────────────────────────────────────────────────────────────

describe('isValidPlanId', () => {
  it('returns true for valid plan IDs', () => {
    expect(isValidPlanId('team')).toBe(true);
    expect(isValidPlanId('business')).toBe(true);
    expect(isValidPlanId('enterprise')).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(isValidPlanId('TEAM')).toBe(true);
    expect(isValidPlanId('Business')).toBe(true);
    expect(isValidPlanId('ENTERPRISE')).toBe(true);
  });

  it('returns false for unknown plans', () => {
    expect(isValidPlanId('unknown')).toBe(false);
    expect(isValidPlanId('')).toBe(false);
    expect(isValidPlanId('premium')).toBe(false);
  });
});

// ─── isValidBillingCycle ──────────────────────────────────────────────────────

describe('isValidBillingCycle', () => {
  it('returns true for "monthly"', () => {
    expect(isValidBillingCycle('monthly')).toBe(true);
  });

  it('returns true for "yearly"', () => {
    expect(isValidBillingCycle('yearly')).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(isValidBillingCycle('MONTHLY')).toBe(true);
    expect(isValidBillingCycle('Yearly')).toBe(true);
  });

  it('returns false for unknown cycles', () => {
    expect(isValidBillingCycle('weekly')).toBe(false);
    expect(isValidBillingCycle('')).toBe(false);
    expect(isValidBillingCycle('annual')).toBe(false);
  });
});
