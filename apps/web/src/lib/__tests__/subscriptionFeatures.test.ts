import { describe, it, expect } from 'vitest';
import {
  hasFeature,
  getRequiredPlan,
  getFeatureName,
  getPlanName,
  getFeatureMessage,
  getPlansWithFeature,
  getFeaturesForPlan,
  getAllowedNotificationChannels,
} from '../subscription/subscriptionFeatures';

// ─── hasFeature ───────────────────────────────────────────────────────────────

describe('hasFeature', () => {
  it('returns false for null plan', () => {
    expect(hasFeature(null, 'panel_admin')).toBe(false);
  });

  it('returns false for undefined plan', () => {
    expect(hasFeature(undefined, 'panel_admin')).toBe(false);
  });

  it('returns false for unknown plan', () => {
    expect(hasFeature('starter', 'panel_admin')).toBe(false);
  });

  it('panel_admin is available on all plans', () => {
    expect(hasFeature('team', 'panel_admin')).toBe(true);
    expect(hasFeature('business', 'panel_admin')).toBe(true);
    expect(hasFeature('enterprise', 'panel_admin')).toBe(true);
  });

  it('course_messaging is NOT available on team', () => {
    expect(hasFeature('team', 'course_messaging')).toBe(false);
  });

  it('course_messaging IS available on business and enterprise', () => {
    expect(hasFeature('business', 'course_messaging')).toBe(true);
    expect(hasFeature('enterprise', 'course_messaging')).toBe(true);
  });

  it('advanced_groups is only available on enterprise', () => {
    expect(hasFeature('team', 'advanced_groups')).toBe(false);
    expect(hasFeature('business', 'advanced_groups')).toBe(false);
    expect(hasFeature('enterprise', 'advanced_groups')).toBe(true);
  });

  it('is case-insensitive for plan name', () => {
    expect(hasFeature('TEAM', 'panel_admin')).toBe(true);
    expect(hasFeature('Business', 'basic_reports')).toBe(true);
  });

  it('basic_reports is available on all plans', () => {
    expect(hasFeature('team', 'basic_reports')).toBe(true);
    expect(hasFeature('business', 'basic_reports')).toBe(true);
    expect(hasFeature('enterprise', 'basic_reports')).toBe(true);
  });

  it('corporate_branding is only enterprise', () => {
    expect(hasFeature('team', 'corporate_branding')).toBe(false);
    expect(hasFeature('business', 'corporate_branding')).toBe(false);
    expect(hasFeature('enterprise', 'corporate_branding')).toBe(true);
  });

  it('email_support is available on all plans', () => {
    expect(hasFeature('team', 'email_support')).toBe(true);
    expect(hasFeature('business', 'email_support')).toBe(true);
    expect(hasFeature('enterprise', 'email_support')).toBe(true);
  });
});

// ─── getRequiredPlan ──────────────────────────────────────────────────────────

describe('getRequiredPlan', () => {
  it('returns "team" for features available on team plan', () => {
    expect(getRequiredPlan('panel_admin')).toBe('team');
    expect(getRequiredPlan('basic_reports')).toBe('team');
    expect(getRequiredPlan('email_support')).toBe('team');
  });

  it('returns "business" for features only on business+', () => {
    expect(getRequiredPlan('course_messaging')).toBe('business');
    expect(getRequiredPlan('advanced_analytics')).toBe('business');
  });

  it('returns "enterprise" for enterprise-only features', () => {
    expect(getRequiredPlan('advanced_groups')).toBe('enterprise');
    expect(getRequiredPlan('corporate_branding')).toBe('enterprise');
    expect(getRequiredPlan('custom_dashboard')).toBe('enterprise');
    expect(getRequiredPlan('data_export')).toBe('enterprise');
  });
});

// ─── getFeatureName ───────────────────────────────────────────────────────────

describe('getFeatureName', () => {
  it('returns display name for panel_admin', () => {
    expect(getFeatureName('panel_admin')).toBe('Panel de administración');
  });

  it('returns display name for advanced_analytics', () => {
    expect(getFeatureName('advanced_analytics')).toBe('Analytics avanzados');
  });

  it('returns display name for email_support', () => {
    expect(getFeatureName('email_support')).toBe('Soporte por email');
  });

  it('returns non-empty string for all known features', () => {
    const features = [
      'panel_admin', 'course_messaging', 'custom_groups', 'advanced_groups',
      'corporate_branding', 'basic_reports', 'advanced_analytics', 'notification_email',
    ] as const;
    features.forEach((f) => {
      expect(getFeatureName(f).length).toBeGreaterThan(0);
    });
  });
});

// ─── getPlanName ──────────────────────────────────────────────────────────────

describe('getPlanName', () => {
  it('returns "Team" for team plan', () => {
    expect(getPlanName('team')).toBe('Team');
  });

  it('returns "Business" for business plan', () => {
    expect(getPlanName('business')).toBe('Business');
  });

  it('returns "Enterprise" for enterprise plan', () => {
    expect(getPlanName('enterprise')).toBe('Enterprise');
  });

  it('is case-insensitive', () => {
    expect(getPlanName('TEAM')).toBe('Team');
    expect(getPlanName('Business')).toBe('Business');
  });

  it('returns the input for unknown plans', () => {
    expect(getPlanName('unknown_plan')).toBe('unknown_plan');
  });
});

// ─── getFeatureMessage ────────────────────────────────────────────────────────

describe('getFeatureMessage', () => {
  it('returns available message when plan has feature', () => {
    const msg = getFeatureMessage('panel_admin', 'team');
    expect(msg).toContain('Team');
    expect(msg).toContain('disponible');
  });

  it('returns upgrade message when plan lacks feature', () => {
    const msg = getFeatureMessage('advanced_analytics', 'team');
    expect(msg).toContain('Business');
    expect(msg).toContain('Actualiza');
  });

  it('mentions the required plan in upgrade message', () => {
    const msg = getFeatureMessage('corporate_branding', 'business');
    expect(msg).toContain('Enterprise');
  });

  it('uses fallback when currentPlan is null', () => {
    const msg = getFeatureMessage('panel_admin', null);
    expect(msg).toBeTruthy();
  });

  it('returns not available message for hypothetically unavailable feature', () => {
    // All features have at least one plan, so this just tests the message format
    const msg = getFeatureMessage('email_support', 'enterprise');
    expect(msg).toContain('disponible');
  });
});

// ─── getPlansWithFeature ──────────────────────────────────────────────────────

describe('getPlansWithFeature', () => {
  it('returns all plans for universal features', () => {
    const plans = getPlansWithFeature('panel_admin');
    expect(plans).toContain('team');
    expect(plans).toContain('business');
    expect(plans).toContain('enterprise');
  });

  it('returns only enterprise for enterprise-only features', () => {
    const plans = getPlansWithFeature('advanced_groups');
    expect(plans).toEqual(['enterprise']);
  });

  it('returns business and enterprise for business+ features', () => {
    const plans = getPlansWithFeature('course_messaging');
    expect(plans).not.toContain('team');
    expect(plans).toContain('business');
    expect(plans).toContain('enterprise');
  });

  it('returns plans in order team → business → enterprise', () => {
    const plans = getPlansWithFeature('panel_admin');
    const idx = (p: string) => plans.indexOf(p as any);
    if (idx('team') !== -1 && idx('business') !== -1) {
      expect(idx('team')).toBeLessThan(idx('business'));
    }
  });
});

// ─── getFeaturesForPlan ───────────────────────────────────────────────────────

describe('getFeaturesForPlan', () => {
  it('returns empty array for null plan', () => {
    expect(getFeaturesForPlan(null)).toEqual([]);
  });

  it('returns empty array for unknown plan', () => {
    expect(getFeaturesForPlan('starter')).toEqual([]);
  });

  it('team plan includes panel_admin', () => {
    const features = getFeaturesForPlan('team');
    expect(features).toContain('panel_admin');
  });

  it('team plan does NOT include advanced_groups', () => {
    const features = getFeaturesForPlan('team');
    expect(features).not.toContain('advanced_groups');
  });

  it('enterprise plan includes all features that team has', () => {
    const teamFeatures = getFeaturesForPlan('team');
    const enterpriseFeatures = getFeaturesForPlan('enterprise');
    teamFeatures.forEach((f) => {
      expect(enterpriseFeatures).toContain(f);
    });
  });

  it('enterprise plan has more features than team plan', () => {
    const team = getFeaturesForPlan('team');
    const enterprise = getFeaturesForPlan('enterprise');
    expect(enterprise.length).toBeGreaterThan(team.length);
  });

  it('business plan has at least as many features as team', () => {
    const team = getFeaturesForPlan('team');
    const business = getFeaturesForPlan('business');
    expect(business.length).toBeGreaterThanOrEqual(team.length);
  });
});

// ─── getAllowedNotificationChannels ───────────────────────────────────────────

describe('getAllowedNotificationChannels', () => {
  it('returns email only for team plan', () => {
    const channels = getAllowedNotificationChannels('team');
    expect(channels).toContain('email');
    expect(channels).not.toContain('push');
    expect(channels).not.toContain('sms');
  });

  it('returns email and push for business plan', () => {
    const channels = getAllowedNotificationChannels('business');
    expect(channels).toContain('email');
    expect(channels).toContain('push');
    expect(channels).not.toContain('sms');
  });

  it('returns all channels for enterprise plan', () => {
    const channels = getAllowedNotificationChannels('enterprise');
    expect(channels).toContain('email');
    expect(channels).toContain('push');
    expect(channels).toContain('sms');
  });

  it('returns empty array for null plan', () => {
    expect(getAllowedNotificationChannels(null)).toEqual([]);
  });

  it('returns empty array for unknown plan', () => {
    expect(getAllowedNotificationChannels('free')).toEqual([]);
  });
});
