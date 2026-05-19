import { describe, expect, it } from 'vitest';

import { recalculateDurationsSchema } from '../schema';

describe('recalculateDurationsSchema', () => {
  it('accepts an optional course id filter', () => {
    const result = recalculateDurationsSchema.safeParse({
      courseId: 'course-123',
    });

    expect(result.success).toBe(true);
  });

  it('accepts an empty object to recalculate all courses', () => {
    const result = recalculateDurationsSchema.safeParse({});

    expect(result.success).toBe(true);
  });

  it('rejects unknown fields', () => {
    const result = recalculateDurationsSchema.safeParse({
      courseId: 'course-123',
      dryRun: true,
    });

    expect(result.success).toBe(false);
  });
});
