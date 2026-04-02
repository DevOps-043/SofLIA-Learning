import { describe, it, expect } from 'vitest';
import { LiaPhaseInstructionsService } from '../lia-phase-instructions.service';
import type { StudyPlannerContext } from '../lia-context.types';

const makeContext = (overrides: Partial<StudyPlannerContext> = {}): StudyPlannerContext => ({
  userType: 'b2c',
  userProfile: {
    nombre: 'Test User',
    rol: 'Developer',
    area: 'Tech',
    nivel: 'Senior',
    sector: 'Technology',
  },
  courses: [],
  calendarConnected: false,
  ...overrides,
} as StudyPlannerContext);

describe('LiaPhaseInstructionsService.generatePhaseInstructions', () => {
  // ── Phase 1 ─────────────────────────────────────────────────────────────────

  describe('phase 1 (context analysis)', () => {
    it('returns non-empty string', () => {
      const result = LiaPhaseInstructionsService.generatePhaseInstructions(makeContext(), 1);
      expect(result.length).toBeGreaterThan(0);
    });

    it('contains FASE 1 marker', () => {
      const result = LiaPhaseInstructionsService.generatePhaseInstructions(makeContext(), 1);
      expect(result).toContain('FASE 1');
    });

    it('contains B2C instructions for b2c user', () => {
      const ctx = makeContext({ userType: 'b2c' });
      const result = LiaPhaseInstructionsService.generatePhaseInstructions(ctx, 1);
      expect(result).toContain('B2C');
    });

    it('contains B2B instructions for b2b user', () => {
      const ctx = makeContext({ userType: 'b2b' });
      const result = LiaPhaseInstructionsService.generatePhaseInstructions(ctx, 1);
      expect(result).toContain('B2B');
    });
  });

  // ── Phase 2 ─────────────────────────────────────────────────────────────────

  describe('phase 2 (course selection)', () => {
    it('returns B2B assigned courses text when b2b with courses', () => {
      const ctx = makeContext({
        userType: 'b2b',
        courses: [{ id: 'c1', title: 'Course 1' } as any],
      });
      const result = LiaPhaseInstructionsService.generatePhaseInstructions(ctx, 2);
      expect(result).toContain('B2B');
      expect(result).toContain('FASE 2');
    });

    it('returns no assigned courses text when b2b with no courses', () => {
      const ctx = makeContext({ userType: 'b2b', courses: [] });
      const result = LiaPhaseInstructionsService.generatePhaseInstructions(ctx, 2);
      expect(result).toContain('SIN CURSOS ASIGNADOS');
    });

    it('returns B2C selection text for b2c user', () => {
      const ctx = makeContext({ userType: 'b2c' });
      const result = LiaPhaseInstructionsService.generatePhaseInstructions(ctx, 2);
      expect(result).toContain('SELECCIÓN DE CURSOS');
    });

    it('mentions SOLO lecciones pendientes rule', () => {
      const ctx = makeContext({ userType: 'b2c' });
      const result = LiaPhaseInstructionsService.generatePhaseInstructions(ctx, 2);
      expect(result).toContain('SOLO');
    });
  });

  // ── Phase 3 ─────────────────────────────────────────────────────────────────

  describe('phase 3 (calendar integration)', () => {
    it('mentions connecting calendar when not connected', () => {
      const ctx = makeContext({ calendarConnected: false });
      const result = LiaPhaseInstructionsService.generatePhaseInstructions(ctx, 3);
      expect(result).toContain('FASE 3');
      expect(result).toContain('Google Calendar');
    });

    it('mentions connected calendar when calendar is connected', () => {
      const ctx = makeContext({
        calendarConnected: true,
        calendarProvider: 'google' as any,
      });
      const result = LiaPhaseInstructionsService.generatePhaseInstructions(ctx, 3);
      expect(result).toContain('google');
    });
  });

  // ── Phase 4 ─────────────────────────────────────────────────────────────────

  describe('phase 4 (time config)', () => {
    it('contains FASE 4 marker', () => {
      const result = LiaPhaseInstructionsService.generatePhaseInstructions(makeContext(), 4);
      expect(result).toContain('FASE 4');
    });

    it('mentions minimum lesson time from courseAnalysis', () => {
      const ctx = makeContext({
        courseAnalysis: { minimumLessonTime: 20 } as any,
      });
      const result = LiaPhaseInstructionsService.generatePhaseInstructions(ctx, 4);
      expect(result).toContain('20');
    });

    it('uses fallback 15 minutes when courseAnalysis missing', () => {
      const result = LiaPhaseInstructionsService.generatePhaseInstructions(makeContext(), 4);
      expect(result).toContain('15');
    });

    it('contains B2B additional rules for b2b user', () => {
      const ctx = makeContext({ userType: 'b2b' });
      const result = LiaPhaseInstructionsService.generatePhaseInstructions(ctx, 4);
      expect(result).toContain('B2B');
    });
  });

  // ── Phase 5 ─────────────────────────────────────────────────────────────────

  describe('phase 5 (break times)', () => {
    it('contains FASE 5 marker', () => {
      const result = LiaPhaseInstructionsService.generatePhaseInstructions(makeContext(), 5);
      expect(result).toContain('FASE 5');
    });

    it('mentions Pomodoro technique', () => {
      const result = LiaPhaseInstructionsService.generatePhaseInstructions(makeContext(), 5);
      expect(result).toContain('Pomodoro');
    });
  });

  // ── Phase 6 ─────────────────────────────────────────────────────────────────

  describe('phase 6 (days and schedules)', () => {
    it('contains FASE 6 marker', () => {
      const result = LiaPhaseInstructionsService.generatePhaseInstructions(makeContext(), 6);
      expect(result).toContain('FASE 6');
    });

    it('contains example of correct distribution', () => {
      const result = LiaPhaseInstructionsService.generatePhaseInstructions(makeContext(), 6);
      expect(result).toContain('EJEMPLO CORRECTO');
    });
  });

  // ── Phase 7 ─────────────────────────────────────────────────────────────────

  describe('phase 7 (summary and confirmation)', () => {
    it('contains FASE 7 marker', () => {
      const result = LiaPhaseInstructionsService.generatePhaseInstructions(makeContext(), 7);
      expect(result).toContain('FASE 7');
    });

    it('contains summary items', () => {
      const result = LiaPhaseInstructionsService.generatePhaseInstructions(makeContext(), 7);
      expect(result).toContain('RESUMEN');
    });

    it('includes B2B plazos check for b2b user', () => {
      const ctx = makeContext({ userType: 'b2b' });
      const result = LiaPhaseInstructionsService.generatePhaseInstructions(ctx, 7);
      expect(result).toContain('Plazos');
    });
  });

  // ── Unknown phase ─────────────────────────────────────────────────────────

  describe('unknown phase', () => {
    it('returns empty string for unknown phase', () => {
      const result = LiaPhaseInstructionsService.generatePhaseInstructions(makeContext(), 99);
      expect(result).toBe('');
    });

    it('returns empty string for phase 0', () => {
      const result = LiaPhaseInstructionsService.generatePhaseInstructions(makeContext(), 0);
      expect(result).toBe('');
    });
  });
});
