import { describe, it, expect } from 'vitest';
import {
  getStudyPlannerWelcomeAudioMessage,
  getStudyPlannerWelcomeFallbackMessage,
  STUDY_PLANNER_WELCOME_REQUEST_TIMEOUT_MS,
} from '../planner-welcome.service';

// ─── constants ─────────────────────────────────────────────────────────────────

describe('STUDY_PLANNER_WELCOME_REQUEST_TIMEOUT_MS', () => {
  it('is a positive number', () => {
    expect(typeof STUDY_PLANNER_WELCOME_REQUEST_TIMEOUT_MS).toBe('number');
    expect(STUDY_PLANNER_WELCOME_REQUEST_TIMEOUT_MS).toBeGreaterThan(0);
  });

  it('equals 8000ms', () => {
    expect(STUDY_PLANNER_WELCOME_REQUEST_TIMEOUT_MS).toBe(8000);
  });
});

// ─── getStudyPlannerWelcomeAudioMessage ───────────────────────────────────────

describe('getStudyPlannerWelcomeAudioMessage', () => {
  it('returns a non-empty string', () => {
    const msg = getStudyPlannerWelcomeAudioMessage();
    expect(typeof msg).toBe('string');
    expect(msg.length).toBeGreaterThan(0);
  });

  it('mentions SofLIA', () => {
    const msg = getStudyPlannerWelcomeAudioMessage();
    expect(msg).toContain('SofLIA');
  });

  it('returns consistent value on multiple calls', () => {
    expect(getStudyPlannerWelcomeAudioMessage()).toBe(getStudyPlannerWelcomeAudioMessage());
  });
});

// ─── getStudyPlannerWelcomeFallbackMessage ────────────────────────────────────

describe('getStudyPlannerWelcomeFallbackMessage', () => {
  it('returns string when hasAssignedCourses is true', () => {
    const msg = getStudyPlannerWelcomeFallbackMessage(true);
    expect(typeof msg).toBe('string');
    expect(msg.length).toBeGreaterThan(0);
  });

  it('returns string when hasAssignedCourses is false', () => {
    const msg = getStudyPlannerWelcomeFallbackMessage(false);
    expect(typeof msg).toBe('string');
    expect(msg.length).toBeGreaterThan(0);
  });

  it('returns different messages for true vs false', () => {
    const withCourses = getStudyPlannerWelcomeFallbackMessage(true);
    const withoutCourses = getStudyPlannerWelcomeFallbackMessage(false);
    expect(withCourses).not.toBe(withoutCourses);
  });

  it('mentions study session preference question when hasAssignedCourses is true', () => {
    const msg = getStudyPlannerWelcomeFallbackMessage(true);
    // Should ask about session type
    expect(msg.toLowerCase()).toMatch(/rapidas|normales|largas/);
  });

  it('both messages mention SofLIA', () => {
    expect(getStudyPlannerWelcomeFallbackMessage(true)).toContain('SofLIA');
    expect(getStudyPlannerWelcomeFallbackMessage(false)).toContain('SofLIA');
  });
});
