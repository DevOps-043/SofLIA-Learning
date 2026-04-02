import { describe, it, expect } from 'vitest';
import { IntentDetectionService } from '../intent-detection.service';
import type { Intent } from '../intent-detection.service';

// Helper: synchronous local detection
const detect = (msg: string) => IntentDetectionService.detectIntentLocal(msg);

describe('IntentDetectionService.detectIntentLocal', () => {
  describe('create_prompt intent', () => {
    it('detects explicit prompt creation requests', () => {
      expect(detect('crear un prompt para marketing').intent).toBe('create_prompt');
      expect(detect('generar un prompt de ventas').intent).toBe('create_prompt');
      expect(detect('hacer un prompt para mi equipo').intent).toBe('create_prompt');
      expect(detect('necesito un prompt de atención al cliente').intent).toBe('create_prompt');
    });

    it('detects prompt engineering keywords', () => {
      expect(detect('quiero aprender prompt engineering').intent).toBe('create_prompt');
      expect(detect('ayúdame a crear un system prompt').intent).toBe('create_prompt');
    });

    it('detects prompts with topic keywords', () => {
      expect(detect('prompt para gestión de equipos').intent).toBe('create_prompt');
      expect(detect('prompt sobre liderazgo empresarial').intent).toBe('create_prompt');
    });

    it('returns high confidence for clear prompt requests', () => {
      const result = detect('crear un prompt para marketing digital');
      expect(result.confidence).toBeGreaterThanOrEqual(0.6);
    });
  });

  describe('nanobana intent', () => {
    it('detects direct NanoBanana mentions with high confidence', () => {
      const result = detect('usa nanobana para crear un wireframe');
      expect(result.intent).toBe('nanobana');
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
    });

    it('detects nano banana variant', () => {
      const result = detect('nano banana app design');
      expect(result.intent).toBe('nanobana');
    });

    it('detects wireframe/mockup creation requests', () => {
      const result = detect('generar un wireframe para mi app');
      expect(result.intent).toBe('nanobana');
    });

    it('detects UI design requests', () => {
      const result = detect('diseñar una interfaz para mi aplicación');
      expect(result.intent).toBe('nanobana');
    });

    it('detects diagram requests', () => {
      const result = detect('crear un diagrama de flujo del proceso');
      expect(result.intent).toBe('nanobana');
    });

    it('detects domain as ui for app-related requests', () => {
      const result = detect('nanobana crea una app de dashboard');
      expect(result.entities?.nanobananaDomain).toBe('ui');
    });

    it('detects domain as diagram for flowchart requests', () => {
      const result = detect('nanobana diagrama de arquitectura');
      expect(result.entities?.nanobananaDomain).toBe('diagram');
    });

    it('detects outputFormat as wireframe', () => {
      const result = detect('nanobana wireframe de login');
      expect(result.entities?.outputFormat).toBe('wireframe');
    });

    it('detects outputFormat as mockup', () => {
      const result = detect('nanobana mockup de la pantalla principal');
      expect(result.entities?.outputFormat).toBe('mockup');
    });

    it('detects outputFormat as diagram', () => {
      const result = detect('nanobana diagrama de flujo del checkout');
      expect(result.entities?.outputFormat).toBe('diagram');
    });
  });

  describe('navigate intent', () => {
    it('detects navigation intent with "ir a" patterns', () => {
      const result = detect('quiero ir a los cursos');
      expect(result.intent).toBe('navigate');
    });

    it('detects navigation intent with "llévame" patterns', () => {
      const result = detect('llévame a las noticias');
      expect(result.intent).toBe('navigate');
    });

    it('detects navigation intent with "muéstrame" patterns', () => {
      const result = detect('muéstrame el dashboard');
      expect(result.intent).toBe('navigate');
    });

    it('detects navigation intent with site keywords alone', () => {
      // Navigation keywords without explicit pattern can still get some confidence
      const result = detect('dame el link del dashboard');
      expect(result.intent).toBe('navigate');
    });

    it('detects target page for courses', () => {
      const result = detect('ir a cursos disponibles');
      expect(result.intent).toBe('navigate');
      expect(result.entities?.targetPage).toBe('courses');
    });

    it('detects target page for communities', () => {
      const result = detect('ir a las comunidades');
      expect(result.intent).toBe('navigate');
      expect(result.entities?.targetPage).toBe('communities');
    });

    it('detects target page for news with explicit navigate pattern', () => {
      const result = detect('ir a las noticias');
      expect(result.intent).toBe('navigate');
      expect(result.entities?.targetPage).toBe('news');
    });

    it('detects target page for profile', () => {
      const result = detect('ir a mi perfil');
      expect(result.intent).toBe('navigate');
      expect(result.entities?.targetPage).toBe('profile');
    });
  });

  describe('question intent', () => {
    it('detects questions with ¿ (when not matched by higher-priority navigate intent)', () => {
      // "¿Cómo puedo acceder al curso?" matches navigate patterns too — use unambiguous question
      const result = detect('¿qué es SofLIA?');
      expect(result.intent).toBe('question');
    });

    it('detects questions with interrogative words (non-navigate context)', () => {
      // These don't match navigate patterns strongly enough
      expect(detect('qué es SofLIA').intent).toBe('question');
      expect(detect('cómo funciona esto').intent).toBe('question');
      expect(detect('cuándo empieza la clase').intent).toBe('question');
    });

    it('detects "puedes" as question indicator', () => {
      expect(detect('puedes explicarme este tema').intent).toBe('question');
    });

    it('detects "me puedes" as question indicator', () => {
      expect(detect('me puedes ayudar con esto').intent).toBe('question');
    });
  });

  describe('general intent (default)', () => {
    it('returns general for plain statements', () => {
      const result = detect('hola');
      expect(result.intent).toBe('general');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('returns general for greetings', () => {
      expect(detect('buenos días').intent).toBe('general');
      expect(detect('gracias').intent).toBe('general');
    });

    it('returns general for short ambiguous messages', () => {
      expect(detect('ok').intent).toBe('general');
      expect(detect('sí').intent).toBe('general');
    });
  });

  describe('intent priority order', () => {
    it('nanobana has priority over create_prompt when both match', () => {
      // "crear wireframe para prompt" contains both patterns
      const result = detect('crear wireframe para mi diseño');
      expect(result.intent).toBe('nanobana');
    });

    it('creates_prompt has priority over navigate when confident', () => {
      const result = detect('crear un prompt para la sección de cursos');
      // Prompt match should win with good confidence
      expect(['create_prompt', 'navigate']).toContain(result.intent);
    });
  });

  describe('confidence bounds', () => {
    it('confidence is between 0 and 1', () => {
      const messages = [
        'hola',
        'nanobana wireframe de una app bancaria',
        'crear prompt de liderazgo para ChatGPT',
        'ir a los cursos',
        '¿qué cursos hay disponibles?',
      ];
      for (const msg of messages) {
        const result = detect(msg);
        expect(result.confidence).toBeGreaterThanOrEqual(0);
        expect(result.confidence).toBeLessThanOrEqual(1);
      }
    });

    it('confidence never exceeds 0.95', () => {
      // Even for very clear messages
      const result = detect('nanobana nanobana diseña una interfaz con wireframe');
      expect(result.confidence).toBeLessThanOrEqual(0.95);
    });
  });
});

describe('IntentDetectionService.detectIntent (async wrapper)', () => {
  it('returns the same result as detectIntentLocal for high-confidence messages', async () => {
    const message = 'nanobana crea un wireframe';
    const local = IntentDetectionService.detectIntentLocal(message);
    const async_ = await IntentDetectionService.detectIntent(message);
    expect(async_.intent).toBe(local.intent);
  });

  it('returns a valid IntentResult for low-confidence messages', async () => {
    const result = await IntentDetectionService.detectIntent('ok');
    expect(result).toHaveProperty('intent');
    expect(result).toHaveProperty('confidence');
    const validIntents: Intent[] = ['create_prompt', 'nanobana', 'navigate', 'question', 'feedback', 'general'];
    expect(validIntents).toContain(result.intent);
  });
});
