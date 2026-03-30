/**
 * lia-context.service.ts
 *
 * Re-exports all SofLIA study-planner context functionality for backward
 * compatibility. Implementation is split across:
 *
 * - lia-context.types.ts               → StudyPlannerContext interface
 * - lia-context-builder.service.ts     → buildStudyPlannerContext
 * - lia-course-analysis.service.ts     → analyzeCourses, detectCourseType, calculateSuggestedSessionDurations
 * - lia-prompt-formatter.service.ts    → formatContextForPrompt, formatPreCalculatedSessionsForPrompt
 * - lia-phase-instructions.service.ts  → generatePhaseInstructions
 * - lia-session-calculator.service.ts  → preCalculateStudySessions
 */

import type { StudyPlannerContext } from './lia-context.types';
import { LiaContextBuilderService } from './lia-context-builder.service';
import { LiaPromptFormatterService } from './lia-prompt-formatter.service';
import { LiaPhaseInstructionsService } from './lia-phase-instructions.service';
import { LiaSessionCalculatorService } from './lia-session-calculator.service';

export type { StudyPlannerContext } from './lia-context.types';

export class SofLIAContextService {
  // ── Context building ────────────────────────────────────────────────────────

  static async buildStudyPlannerContext(userId: string): Promise<StudyPlannerContext> {
    return LiaContextBuilderService.buildStudyPlannerContext(userId);
  }

  // ── Prompt formatting ───────────────────────────────────────────────────────

  static formatContextForPrompt(context: StudyPlannerContext): string {
    return LiaPromptFormatterService.formatContextForPrompt(context);
  }

  static formatPreCalculatedSessionsForPrompt(
    preCalculatedData: ReturnType<typeof SofLIAContextService.preCalculateStudySessions>
  ): string {
    return LiaPromptFormatterService.formatPreCalculatedSessionsForPrompt(preCalculatedData);
  }

  // ── Phase instructions ──────────────────────────────────────────────────────

  static generatePhaseInstructions(context: StudyPlannerContext, phase: number): string {
    return LiaPhaseInstructionsService.generatePhaseInstructions(context, phase);
  }

  // ── Session calculator ──────────────────────────────────────────────────────

  static preCalculateStudySessions(
    lessons: Parameters<typeof LiaSessionCalculatorService.preCalculateStudySessions>[0],
    config: Parameters<typeof LiaSessionCalculatorService.preCalculateStudySessions>[1]
  ): ReturnType<typeof LiaSessionCalculatorService.preCalculateStudySessions> {
    return LiaSessionCalculatorService.preCalculateStudySessions(lessons, config);
  }
}
