import { generateEarlyPhaseInstructions } from './lia-phase-instructions-early.service';
import { generateLatePhaseInstructions } from './lia-phase-instructions-late.service';
import type { StudyPlannerContext } from './lia-context.types';

export class LiaPhaseInstructionsService {
  static generatePhaseInstructions(
    context: StudyPlannerContext,
    phase: number,
  ): string {
    const isB2B = context.userType === 'b2b';

    return (
      generateEarlyPhaseInstructions(context, phase, isB2B)
      || generateLatePhaseInstructions(phase, isB2B)
      || ''
    );
  }
}
