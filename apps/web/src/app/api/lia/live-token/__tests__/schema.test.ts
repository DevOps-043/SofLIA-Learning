import { describe, expect, it } from 'vitest';

import { liaLiveTokenSchema } from '../schema';
import { formatLiaLiveStudyMemorySection } from '../live-study-memory.formatter';
import { buildLiaLiveVoiceGuardrails } from '../voice-guardrails';

describe('lia live token schema', () => {
  it('accepts empty body for backward compatibility', () => {
    const result = liaLiveTokenSchema.safeParse({});

    expect(result.success).toBe(true);
    expect(result.success && result.data.source).toBe('side_panel');
  });

  it('accepts side panel context and builds Live anti-hallucination guardrails', () => {
    const body = {
      sessionId: '17805935-3110-4000-9000-000000000001',
      conversationId: '17805935-3110-4000-9000-000000000002',
      contextType: 'course',
      language: 'es',
      source: 'side_panel',
      pageContext: {
        currentPage: '/courses/ia-basica/learn',
        currentLessonContext: {
          courseTitle: 'IA Basica',
          moduleTitle: 'Modulo 1',
          lessonTitle: 'Introduccion',
        },
      },
    };

    const result = liaLiveTokenSchema.safeParse(body);
    expect(result.success).toBe(true);

    const instruction = buildLiaLiveVoiceGuardrails(result.success ? result.data : body);
    expect(instruction).toContain('sesion de voz a voz');
    expect(instruction).toContain('Nunca inventes nombres de cursos');
    expect(instruction).toContain('Nunca pidas nombre completo');
  });

  it('formats hidden study memory without writing visible chat messages', () => {
    const section = formatLiaLiveStudyMemorySection({
      notes: [
        {
          contentPreview: 'Idea clave sobre automatizacion con IA.',
          courseTitle: 'IA Aplicada',
          lessonTitle: 'Prompts utiles',
          moduleTitle: 'Fundamentos',
          sourceType: 'manual',
          title: 'Mi nota',
          updatedAt: '2026-06-04T17:00:00.000Z',
        },
      ],
    });

    expect(section).toContain('Memoria academica reciente del usuario');
    expect(section).toContain('Idea clave sobre automatizacion con IA');
    expect(section).toContain('Notas recientes del usuario');
    expect(section).not.toContain('lia_messages');
  });
});
