export function normalizeScoreByDifficulty(
  score: number,
  userDifficulty: number | null | undefined,
): number {
  if (!userDifficulty || userDifficulty < 1 || userDifficulty > 5) return score;

  const maxScoreByDifficulty: Record<number, number> = {
    1: 20,
    2: 40,
    3: 60,
    4: 80,
    5: 100,
  };

  return Math.round((score * (maxScoreByDifficulty[userDifficulty] || 100)) / 100);
}

export function parseJsonStringValue(value: unknown): unknown {
  if (!(value && typeof value === 'string' && value.startsWith('"') && value.endsWith('"'))) {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export function scoreAnswerValue(value: unknown, escala?: Record<string, number> | null): number {
  const parsedValue = parseJsonStringValue(value);
  if (typeof parsedValue === 'number') return parsedValue;
  if (typeof parsedValue !== 'string') return 0;
  if (escala && typeof escala === 'object') return escala[parsedValue] || 0;

  if (parsedValue.includes('A)')) return 0;
  if (parsedValue.includes('B)')) return 25;
  if (parsedValue.includes('C)')) return 50;
  if (parsedValue.includes('D)')) return 75;
  if (parsedValue.includes('E)')) return 100;
  return 50;
}

export function getLevel(score: number) {
  if (score >= 80) return 'Avanzado';
  if (score >= 60) return 'Intermedio';
  if (score >= 40) return 'Medio';
  if (score >= 20) return 'Básico';
  return 'Principiante';
}
