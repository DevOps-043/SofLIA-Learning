import { describe, it, expect } from 'vitest';
import {
  normalizeLanguage,
  detectMessageLanguage,
  SUPPORTED_LANGUAGES,
  LANGUAGE_CONFIG,
} from '../language-detection.service';

describe('normalizeLanguage', () => {
  it('returns es by default when no language given', () => {
    expect(normalizeLanguage()).toBe('es');
    expect(normalizeLanguage(undefined)).toBe('es');
  });

  it('returns es for empty string', () => {
    expect(normalizeLanguage('')).toBe('es');
  });

  it('accepts supported languages', () => {
    expect(normalizeLanguage('es')).toBe('es');
    expect(normalizeLanguage('en')).toBe('en');
    expect(normalizeLanguage('pt')).toBe('pt');
  });

  it('is case-insensitive', () => {
    expect(normalizeLanguage('ES')).toBe('es');
    expect(normalizeLanguage('EN')).toBe('en');
    expect(normalizeLanguage('PT')).toBe('pt');
  });

  it('falls back to es for unknown languages', () => {
    expect(normalizeLanguage('fr')).toBe('es');
    expect(normalizeLanguage('de')).toBe('es');
    expect(normalizeLanguage('zh')).toBe('es');
    expect(normalizeLanguage('invalid')).toBe('es');
  });

  it('SUPPORTED_LANGUAGES contains exactly 3 languages', () => {
    expect(SUPPORTED_LANGUAGES).toHaveLength(3);
    expect(SUPPORTED_LANGUAGES).toContain('es');
    expect(SUPPORTED_LANGUAGES).toContain('en');
    expect(SUPPORTED_LANGUAGES).toContain('pt');
  });
});

describe('detectMessageLanguage', () => {
  describe('English detection', () => {
    it('detects English from question starters', () => {
      expect(detectMessageLanguage('What is this course about?')).toBe('en');
      expect(detectMessageLanguage('How do I access my lessons?')).toBe('en');
      expect(detectMessageLanguage('Where can I find my certificate?')).toBe('en');
      expect(detectMessageLanguage('When does the course start?')).toBe('en');
      expect(detectMessageLanguage('Why is this important?')).toBe('en');
      expect(detectMessageLanguage('Can you help me?')).toBe('en');
      expect(detectMessageLanguage('Could you explain this?')).toBe('en');
      expect(detectMessageLanguage('Would you recommend this course?')).toBe('en');
      expect(detectMessageLanguage('Should I start with module 1?')).toBe('en');
    });

    it('detects English from "I want/need" starters', () => {
      expect(detectMessageLanguage('I want to learn more about this topic')).toBe('en');
      expect(detectMessageLanguage('I need help with the quiz')).toBe('en');
      expect(detectMessageLanguage("I'm having trouble with these exercises")).toBe('en');
    });

    it('detects English from "tell/show" starters with enough patterns', () => {
      // These require at least 2 pattern hits — checking messages that match multiple patterns
      expect(detectMessageLanguage('What can I do with these courses?')).toBe('en');
      expect(detectMessageLanguage('How do I access my account and what are the options?')).toBe('en');
    });
  });

  describe('Portuguese detection', () => {
    it('detects Portuguese from question starters', () => {
      expect(detectMessageLanguage('O que é este curso?')).toBe('pt');
      expect(detectMessageLanguage('Qual é o conteúdo?')).toBe('pt');
      expect(detectMessageLanguage('Como posso acessar?')).toBe('pt');
      expect(detectMessageLanguage('Quando começa o curso?')).toBe('pt');
      expect(detectMessageLanguage('Onde encontro o certificado?')).toBe('pt');
      expect(detectMessageLanguage('Você pode me ajudar?')).toBe('pt');
      expect(detectMessageLanguage('Pode me explicar isso?')).toBe('pt');
    });

    it('detects Portuguese from common words with multiple pattern hits', () => {
      // Needs 2+ pattern matches or a strong starter match
      expect(detectMessageLanguage('Você pode me ajudar com os cursos?')).toBe('pt');
      expect(detectMessageLanguage('Como posso acessar e qual é o conteúdo?')).toBe('pt');
    });

    it('detects Portuguese articles and prepositions', () => {
      expect(detectMessageLanguage('Me ajuda com os exercícios do curso')).toBe('pt');
    });
  });

  describe('Spanish detection (default)', () => {
    it('defaults to es for Spanish messages', () => {
      expect(detectMessageLanguage('Hola, necesito ayuda')).toBe('es');
      expect(detectMessageLanguage('¿Cómo puedo acceder al curso?')).toBe('es');
      expect(detectMessageLanguage('Tengo una pregunta sobre la lección')).toBe('es');
    });

    it('returns es for ambiguous or empty messages', () => {
      expect(detectMessageLanguage('')).toBe('es');
      expect(detectMessageLanguage('   ')).toBe('es');
      expect(detectMessageLanguage('ok')).toBe('es');
      expect(detectMessageLanguage('123')).toBe('es');
    });
  });
});

describe('LANGUAGE_CONFIG', () => {
  it('has entries for all supported languages', () => {
    for (const lang of SUPPORTED_LANGUAGES) {
      expect(LANGUAGE_CONFIG[lang]).toBeDefined();
      expect(LANGUAGE_CONFIG[lang].instruction).toBeTruthy();
      expect(LANGUAGE_CONFIG[lang].fallback).toBeTruthy();
    }
  });

  it('es config is in Spanish', () => {
    expect(LANGUAGE_CONFIG.es.instruction).toMatch(/español/i);
  });

  it('en config is in English', () => {
    expect(LANGUAGE_CONFIG.en.instruction).toMatch(/english/i);
  });

  it('pt config is in Portuguese', () => {
    expect(LANGUAGE_CONFIG.pt.instruction).toMatch(/português/i);
  });
});
