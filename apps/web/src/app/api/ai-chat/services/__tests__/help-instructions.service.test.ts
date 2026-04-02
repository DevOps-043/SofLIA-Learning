import { describe, it, expect } from 'vitest';
import { generateHelpInstructions } from '../help-instructions.service';

const EMPTY_CONTEXT: Record<string, unknown> = {};

describe('generateHelpInstructions', () => {
  describe('activity_guidance', () => {
    it('returns a non-empty string', () => {
      const result = generateHelpInstructions('activity_guidance', EMPTY_CONTEXT);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('mentions student inactivity context', () => {
      const result = generateHelpInstructions('activity_guidance', EMPTY_CONTEXT);
      expect(result.toLowerCase()).toMatch(/actividad|inactiv/i);
    });

    it('includes activity title when currentActivity is provided', () => {
      const context = {
        activitiesContext: {
          currentActivityFocus: {
            title: 'Quiz sobre liderazgo',
            type: 'quiz',
            isRequired: true,
            description: 'Evalúa conceptos clave de liderazgo',
          },
        },
      };
      const result = generateHelpInstructions('activity_guidance', context);
      expect(result).toContain('Quiz sobre liderazgo');
    });

    it('includes userRole when provided alongside an activity', () => {
      // userRole is only injected into the template when currentActivity is present
      const context = {
        userRole: 'Gerente de equipo',
        activitiesContext: {
          currentActivityFocus: {
            title: 'Test activity',
            type: 'quiz',
            isRequired: true,
            description: 'Test desc',
          },
        },
      };
      const result = generateHelpInstructions('activity_guidance', context);
      expect(result).toContain('Gerente de equipo');
    });
  });

  describe('content_explanation', () => {
    it('returns a non-empty string', () => {
      const result = generateHelpInstructions('content_explanation', EMPTY_CONTEXT);
      expect(result.length).toBeGreaterThan(0);
    });

    it('mentions content/inactivity strategy', () => {
      const result = generateHelpInstructions('content_explanation', EMPTY_CONTEXT);
      expect(result.toLowerCase()).toMatch(/inactiv|contenido|video|resumen/i);
    });

    it('includes userRole examples when provided', () => {
      const context = { userRole: 'Desarrollador' };
      const result = generateHelpInstructions('content_explanation', context);
      expect(result).toContain('Desarrollador');
    });
  });

  describe('content_navigation', () => {
    it('returns a non-empty string', () => {
      const result = generateHelpInstructions('content_navigation', EMPTY_CONTEXT);
      expect(result.length).toBeGreaterThan(0);
    });

    it('mentions scroll or navigation pattern', () => {
      const result = generateHelpInstructions('content_navigation', EMPTY_CONTEXT);
      expect(result.toLowerCase()).toMatch(/scroll|búsca|buscando|navegaci|seccione/i);
    });

    it('mentions Ctrl+F or search functionality', () => {
      const result = generateHelpInstructions('content_navigation', EMPTY_CONTEXT);
      expect(result).toContain('Ctrl+F');
    });
  });

  describe('activity_hints', () => {
    it('returns a non-empty string', () => {
      const result = generateHelpInstructions('activity_hints', EMPTY_CONTEXT);
      expect(result.length).toBeGreaterThan(0);
    });

    it('mentions multiple failed attempts', () => {
      const result = generateHelpInstructions('activity_hints', EMPTY_CONTEXT);
      expect(result.toLowerCase()).toMatch(/fallado|múltiples|intentos|dificultad/i);
    });

    it('includes progressive hint levels with activity title', () => {
      const context = {
        activitiesContext: {
          currentActivityFocus: {
            title: 'Ejercicio de análisis FODA',
            type: 'exercise',
            isRequired: false,
            description: 'Análisis estratégico',
          },
        },
      };
      const result = generateHelpInstructions('activity_hints', context);
      expect(result).toContain('Ejercicio de análisis FODA');
      expect(result.toLowerCase()).toMatch(/nivel|pista|estrategia/i);
    });
  });

  describe('activity_structure', () => {
    it('returns a non-empty string', () => {
      const result = generateHelpInstructions('activity_structure', EMPTY_CONTEXT);
      expect(result.length).toBeGreaterThan(0);
    });

    it('mentions writing/erasing pattern and structure', () => {
      const result = generateHelpInstructions('activity_structure', EMPTY_CONTEXT);
      expect(result.toLowerCase()).toMatch(/escrib|borr|estructur|plantilla/i);
    });

    it('includes activity title when provided', () => {
      const context = {
        activitiesContext: {
          currentActivityFocus: {
            title: 'Ensayo reflexivo',
            type: 'essay',
            isRequired: true,
            description: '',
          },
        },
      };
      const result = generateHelpInstructions('activity_structure', context);
      expect(result).toContain('Ensayo reflexivo');
    });
  });

  describe('concept_clarification', () => {
    it('returns a non-empty string', () => {
      const result = generateHelpInstructions('concept_clarification', EMPTY_CONTEXT);
      expect(result.length).toBeGreaterThan(0);
    });

    it('mentions repetitive navigation and conceptual confusion', () => {
      const result = generateHelpInstructions('concept_clarification', EMPTY_CONTEXT);
      expect(result.toLowerCase()).toMatch(/naveg|repet|confus|concept/i);
    });

    it('includes userRole context when provided', () => {
      const context = { userRole: 'Analista de datos' };
      const result = generateHelpInstructions('concept_clarification', context);
      expect(result).toContain('Analista de datos');
    });
  });

  describe('interface_guidance', () => {
    it('returns a non-empty string', () => {
      const result = generateHelpInstructions('interface_guidance', EMPTY_CONTEXT);
      expect(result.length).toBeGreaterThan(0);
    });

    it('mentions navigation and platform usage', () => {
      const result = generateHelpInstructions('interface_guidance', EMPTY_CONTEXT);
      expect(result.toLowerCase()).toMatch(/navegar|plataforma|interfaz|clic|click/i);
    });

    it('mentions tabs (video, transcripción, etc.)', () => {
      const result = generateHelpInstructions('interface_guidance', EMPTY_CONTEXT);
      expect(result.toLowerCase()).toMatch(/video|transcripci|resumen|actividad/i);
    });
  });

  describe('general', () => {
    it('returns a non-empty string', () => {
      const result = generateHelpInstructions('general', EMPTY_CONTEXT);
      expect(result.length).toBeGreaterThan(0);
    });

    it('includes diagnostic questions', () => {
      const result = generateHelpInstructions('general', EMPTY_CONTEXT);
      expect(result).toMatch(/\?/);
    });

    it('includes userRole when provided', () => {
      const context = { userRole: 'Product Manager' };
      const result = generateHelpInstructions('general', context);
      expect(result).toContain('Product Manager');
    });
  });

  describe('fallback to general', () => {
    it('returns general strategy for unknown helpType', () => {
      const result = generateHelpInstructions('unknown_type', EMPTY_CONTEXT);
      const general = generateHelpInstructions('general', EMPTY_CONTEXT);
      expect(result).toBe(general);
    });

    it('returns general strategy for empty string helpType', () => {
      const result = generateHelpInstructions('', EMPTY_CONTEXT);
      const general = generateHelpInstructions('general', EMPTY_CONTEXT);
      expect(result).toBe(general);
    });
  });

  describe('all types return strings with content', () => {
    const types = [
      'activity_guidance',
      'content_explanation',
      'content_navigation',
      'activity_hints',
      'activity_structure',
      'concept_clarification',
      'interface_guidance',
      'general',
    ];

    for (const type of types) {
      it(`"${type}" returns a non-empty string`, () => {
        const result = generateHelpInstructions(type, EMPTY_CONTEXT);
        expect(typeof result).toBe('string');
        expect(result.trim().length).toBeGreaterThan(20);
      });
    }
  });
});
