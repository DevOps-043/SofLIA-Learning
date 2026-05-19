import { describe, expect, it } from 'vitest';

import { adminDashboardPreferencesSchema } from '../schema';

describe('adminDashboardPreferencesSchema', () => {
  it('accepts a valid preferences payload', () => {
    const result = adminDashboardPreferencesSchema.safeParse({
      activity_period: '7d',
      growth_chart_metrics: ['users', 'courses'],
    });

    expect(result.success).toBe(true);
  });

  it('rejects unsupported activity periods', () => {
    const result = adminDashboardPreferencesSchema.safeParse({
      activity_period: '90d',
      growth_chart_metrics: ['users'],
    });

    expect(result.success).toBe(false);
  });

  it('rejects unknown fields to keep the API contract explicit', () => {
    const result = adminDashboardPreferencesSchema.safeParse({
      activity_period: '24h',
      organizationId: 'not-allowed',
    });

    expect(result.success).toBe(false);
  });
});
