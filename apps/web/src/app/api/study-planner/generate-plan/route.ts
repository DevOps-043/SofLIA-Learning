import { logger as techDebtLogger } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/api/errors';
import { withZodBody } from '@/lib/api/with-validation';
import type { Lesson, Preferences } from './generate-plan.types';
import { generateDeterministicPlan } from './generate-plan-engine';
import { calculateValidAlternatives } from './generate-plan-alternatives';
import { generatePlanSchema, type GeneratePlanBody } from '../_schemas';

async function handlePost(
  _request: NextRequest,
  body: GeneratePlanBody,
) {
  try {
    const { lessons, preferences, deadlineDate } = body;

    const maxSessionMinutes: number = body.maxSessionMinutes || 50;
    const result = generateDeterministicPlan(
      lessons as Lesson[],
      preferences as Preferences,
      deadlineDate,
      maxSessionMinutes,
    );

    if (typeof result !== 'string') {
      if (result.exceedsDeadline && deadlineDate) {
        const validAlternatives = calculateValidAlternatives(
          lessons as Lesson[],
          preferences as Preferences,
          deadlineDate,
          maxSessionMinutes,
          Boolean((preferences as Preferences).allowSunday),
        );
        return NextResponse.json({ ...result, validAlternatives });
      }
      return NextResponse.json(result);
    }

    return NextResponse.json({ plan: result });
  } catch (error) {
    techDebtLogger.error('Error generando plan:', error);
    return apiError('GENERATE_PLAN_FAILED', 'Error interno', 500);
  }
}

export const POST = withZodBody(generatePlanSchema, handlePost);
