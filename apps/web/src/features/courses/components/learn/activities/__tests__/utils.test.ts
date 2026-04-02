import { describe, it, expect } from 'vitest';
import {
  extractPromptList,
  resolveQuizPayload,
  findQuizStatusItem,
} from '../utils';
import type { LessonQuizStatus, LessonQuizStatusItem } from '../../types';

// ─── extractPromptList ────────────────────────────────────────────────────────

describe('extractPromptList', () => {
  it('returns empty array for null', () => {
    expect(extractPromptList(null)).toEqual([]);
  });

  it('returns empty array for undefined', () => {
    expect(extractPromptList(undefined)).toEqual([]);
  });

  it('returns empty array for empty string', () => {
    expect(extractPromptList('')).toEqual([]);
  });

  it('parses JSON array string into prompt list', () => {
    const result = extractPromptList('["Prompt A", "Prompt B"]');
    expect(result).toEqual(['Prompt A', 'Prompt B']);
  });

  it('wraps single non-array value in a list', () => {
    const result = extractPromptList('Single prompt text');
    expect(result).toEqual(['Single prompt text']);
  });

  it('handles JSON string with single value', () => {
    const result = extractPromptList('"A prompt"');
    expect(result).toEqual(['A prompt']);
  });

  it('strips surrounding quotes from prompts', () => {
    const result = extractPromptList(['"quoted prompt"', "'another'"] as any);
    expect(result[0]).toBe('quoted prompt');
    expect(result[1]).toBe('another');
  });

  it('filters out empty/falsy prompts', () => {
    const result = extractPromptList(['Valid', '', '  ', null] as any);
    expect(result).toEqual(['Valid']);
  });

  it('handles array input directly', () => {
    const result = extractPromptList(['P1', 'P2', 'P3'] as any);
    expect(result).toEqual(['P1', 'P2', 'P3']);
  });

  it('trims whitespace from prompts', () => {
    const result = extractPromptList(['  trimmed  '] as any);
    expect(result[0]).toBe('trimmed');
  });

  it('handles JSON with objects by stringifying', () => {
    const result = extractPromptList([{ text: 'obj' }] as any);
    expect(result.length).toBeGreaterThan(0);
  });
});

// ─── resolveQuizPayload ───────────────────────────────────────────────────────

describe('resolveQuizPayload', () => {
  const makeQuestion = (id: string) => ({ id, question: 'What?', options: [], correctAnswer: 0 });

  it('returns null for null input', () => {
    expect(resolveQuizPayload(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(resolveQuizPayload(undefined)).toBeNull();
  });

  it('returns null for empty array', () => {
    expect(resolveQuizPayload([])).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(resolveQuizPayload('')).toBeNull();
  });

  it('parses array of questions', () => {
    const questions = [makeQuestion('q1'), makeQuestion('q2')];
    const result = resolveQuizPayload(questions);
    expect(result).not.toBeNull();
    expect(result!.questions).toHaveLength(2);
  });

  it('parses JSON string array', () => {
    const questions = [makeQuestion('q1')];
    const result = resolveQuizPayload(JSON.stringify(questions));
    expect(result).not.toBeNull();
    expect(result!.questions[0].id).toBe('q1');
  });

  it('parses object with "questions" array', () => {
    const payload = {
      questions: [makeQuestion('q1')],
      totalPoints: 100,
    };
    const result = resolveQuizPayload(payload);
    expect(result).not.toBeNull();
    expect(result!.questions).toHaveLength(1);
    expect(result!.totalPoints).toBe(100);
  });

  it('parses JSON string with object containing questions', () => {
    const payload = { questions: [makeQuestion('q1')], totalPoints: 50 };
    const result = resolveQuizPayload(JSON.stringify(payload));
    expect(result).not.toBeNull();
    expect(result!.totalPoints).toBe(50);
  });

  it('returns null for questions without valid structure', () => {
    const invalidQuestions = [{ title: 'No id or question field' }];
    expect(resolveQuizPayload(invalidQuestions)).toBeNull();
  });

  it('sets totalPoints to undefined when not in payload', () => {
    const questions = [makeQuestion('q1')];
    const result = resolveQuizPayload(questions);
    expect(result!.totalPoints).toBeUndefined();
  });
});

// ─── findQuizStatusItem ───────────────────────────────────────────────────────

describe('findQuizStatusItem', () => {
  const makeQuizStatus = (
    quizzes: Array<{ id: string; type: 'activity' | 'material'; passed?: boolean }>
  ): LessonQuizStatus => ({ quizzes } as unknown as LessonQuizStatus);

  it('returns undefined for null quizStatus', () => {
    expect(findQuizStatusItem(null, 'q1', 'activity')).toBeUndefined();
  });

  it('returns undefined when quizzes is empty', () => {
    const status = makeQuizStatus([]);
    expect(findQuizStatusItem(status, 'q1', 'activity')).toBeUndefined();
  });

  it('finds item matching id and type', () => {
    const status = makeQuizStatus([
      { id: 'q1', type: 'activity', passed: true },
    ]);
    const result = findQuizStatusItem(status, 'q1', 'activity');
    expect(result).toBeDefined();
    expect((result as LessonQuizStatusItem).id).toBe('q1');
  });

  it('returns undefined when id matches but type does not', () => {
    const status = makeQuizStatus([{ id: 'q1', type: 'activity' }]);
    expect(findQuizStatusItem(status, 'q1', 'material')).toBeUndefined();
  });

  it('returns undefined when type matches but id does not', () => {
    const status = makeQuizStatus([{ id: 'q1', type: 'activity' }]);
    expect(findQuizStatusItem(status, 'q99', 'activity')).toBeUndefined();
  });

  it('finds the correct item among multiple quizzes', () => {
    const status = makeQuizStatus([
      { id: 'q1', type: 'activity' },
      { id: 'q2', type: 'material' },
      { id: 'q3', type: 'activity' },
    ]);
    const result = findQuizStatusItem(status, 'q3', 'activity');
    expect(result).toBeDefined();
    expect((result as LessonQuizStatusItem).id).toBe('q3');
  });
});
