import { describe, expect, it } from 'vitest';

import {
  scormAttemptSchema,
  scormInitializeSchema,
  scormSetValueSchema,
} from '../_schemas';

describe('scorm runtime schemas', () => {
  it('accepts required fields while preserving polymorphic SCORM keys', () => {
    const result = scormSetValueSchema.safeParse({
      attemptId: 'attempt-1',
      key: 'cmi.core.lesson_status',
      value: 'completed',
      'cmi.interactions.0.id': 'question-1',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data['cmi.interactions.0.id']).toBe('question-1');
    }
  });

  it('rejects missing runtime identifiers', () => {
    expect(scormInitializeSchema.safeParse({}).success).toBe(false);
    expect(scormAttemptSchema.safeParse({}).success).toBe(false);
  });

  it('rejects oversized SCORM payloads', () => {
    const result = scormAttemptSchema.safeParse({
      attemptId: 'attempt-1',
      'cmi.suspend_data': 'x'.repeat(100_001),
    });

    expect(result.success).toBe(false);
  });
});
