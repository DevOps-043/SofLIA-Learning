import { logger as techDebtLogger } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server';
import type { Lesson, Preferences } from './generate-plan.types';
import { generateDeterministicPlan } from './generate-plan-engine';
import { calculateValidAlternatives } from './generate-plan-alternatives';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lessons, preferences, deadlineDate } = body;

    if (!lessons || !preferences) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
    }

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
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
