import { describe, it, expect } from 'vitest';
import {
  detectStudyPlannerApproachFromMessage,
  looksLikeStudyPlannerTargetDateMessage,
} from '../planner-input-detection.service';

// ─── detectStudyPlannerApproachFromMessage ────────────────────────────────────

describe('detectStudyPlannerApproachFromMessage', () => {
  it('returns null for empty message', () => {
    expect(detectStudyPlannerApproachFromMessage('')).toBeNull();
  });

  it('returns null for unrelated message', () => {
    expect(detectStudyPlannerApproachFromMessage('Quiero aprender más sobre IA')).toBeNull();
  });

  // Short approach
  it('detects "corto" approach from "corto"', () => {
    expect(detectStudyPlannerApproachFromMessage('prefiero sesiones cortas')).toBe('corto');
  });

  it('detects "corto" approach from "cortas"', () => {
    expect(detectStudyPlannerApproachFromMessage('quiero sesiones cortas')).toBe('corto');
  });

  it('detects "corto" approach from "rapido"', () => {
    expect(detectStudyPlannerApproachFromMessage('algo rapido por favor')).toBe('corto');
  });

  it('detects "corto" approach from "rapidas"', () => {
    expect(detectStudyPlannerApproachFromMessage('clases rapidas')).toBe('corto');
  });

  it('detects "corto" approach from accented "rápido" (normalized)', () => {
    expect(detectStudyPlannerApproachFromMessage('quiero algo rápido')).toBe('corto');
  });

  // Balanced approach
  it('detects "balance" approach from "balance"', () => {
    expect(detectStudyPlannerApproachFromMessage('prefiero algo balance')).toBe('balance');
  });

  it('detects "balance" approach from "equilibrado"', () => {
    expect(detectStudyPlannerApproachFromMessage('un ritmo equilibrado')).toBe('balance');
  });

  it('detects "balance" approach from "normal"', () => {
    expect(detectStudyPlannerApproachFromMessage('sesiones normales está bien')).toBe('balance');
  });

  // Long approach
  it('detects "largo" approach from "largo"', () => {
    expect(detectStudyPlannerApproachFromMessage('prefiero estudios largo')).toBe('largo');
  });

  it('detects "largo" approach from "largas"', () => {
    expect(detectStudyPlannerApproachFromMessage('quiero sesiones largas')).toBe('largo');
  });

  it('detects "largo" approach from "extensas"', () => {
    expect(detectStudyPlannerApproachFromMessage('sesiones extensas por favor')).toBe('largo');
  });

  it('detects "largo" approach from "profundizar"', () => {
    expect(detectStudyPlannerApproachFromMessage('quiero profundizar en el tema')).toBe('largo');
  });

  it('detects "largo" approach from "sin prisa"', () => {
    expect(detectStudyPlannerApproachFromMessage('aprender sin prisa')).toBe('largo');
  });

  // Short takes priority over others
  it('prioritizes corto when multiple tokens present', () => {
    // "corto" check comes first in code
    expect(detectStudyPlannerApproachFromMessage('algo corto y equilibrado')).toBe('corto');
  });

  // Case insensitivity
  it('is case-insensitive', () => {
    expect(detectStudyPlannerApproachFromMessage('CORTO')).toBe('corto');
    expect(detectStudyPlannerApproachFromMessage('BALANCE')).toBe('balance');
    expect(detectStudyPlannerApproachFromMessage('LARGO')).toBe('largo');
  });
});

// ─── looksLikeStudyPlannerTargetDateMessage ───────────────────────────────────

describe('looksLikeStudyPlannerTargetDateMessage', () => {
  it('returns false for empty message', () => {
    expect(looksLikeStudyPlannerTargetDateMessage('')).toBe(false);
  });

  it('returns false for unrelated message', () => {
    expect(looksLikeStudyPlannerTargetDateMessage('Quiero aprender IA')).toBe(false);
  });

  it('returns true for message with "mes"', () => {
    expect(looksLikeStudyPlannerTargetDateMessage('quiero terminar este mes')).toBe(true);
  });

  it('returns true for message with "semana"', () => {
    expect(looksLikeStudyPlannerTargetDateMessage('en una semana')).toBe(true);
  });

  it('returns true for message with "dia"', () => {
    expect(looksLikeStudyPlannerTargetDateMessage('en un dia lo termino')).toBe(true);
  });

  it('returns true for message with "dias"', () => {
    expect(looksLikeStudyPlannerTargetDateMessage('en 5 dias')).toBe(true);
  });

  it('returns true for ISO date format (DD/MM/YYYY)', () => {
    expect(looksLikeStudyPlannerTargetDateMessage('quiero terminar el 15/12/2025')).toBe(true);
  });

  it('returns true for Spanish date format "15 de diciembre de 2025"', () => {
    expect(looksLikeStudyPlannerTargetDateMessage('terminar el 15 de diciembre de 2025')).toBe(true);
  });

  it('returns true for DD-MM-YYYY format in pattern', () => {
    expect(looksLikeStudyPlannerTargetDateMessage('hasta el 15/06/2025')).toBe(true);
  });

  it('is case-insensitive for hint tokens', () => {
    expect(looksLikeStudyPlannerTargetDateMessage('En Una SEMANA')).toBe(true);
  });
});
