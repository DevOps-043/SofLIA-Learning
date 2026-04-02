import { describe, it, expect } from 'vitest';
import {
  detectContextFromURL,
  getPageContextInfo,
} from '../AIChatAgent.utils';

describe('detectContextFromURL', () => {
  it('detects communities context', () => {
    expect(detectContextFromURL('/communities')).toBe('communities');
    expect(detectContextFromURL('/communities/my-group')).toBe('communities');
  });

  it('detects courses context', () => {
    expect(detectContextFromURL('/courses')).toBe('courses');
    expect(detectContextFromURL('/courses/intro-to-ai/learn')).toBe('courses');
  });

  it('detects workshops context', () => {
    expect(detectContextFromURL('/workshops')).toBe('workshops');
    expect(detectContextFromURL('/workshops/advanced')).toBe('workshops');
  });

  it('detects news context', () => {
    expect(detectContextFromURL('/news')).toBe('news');
    expect(detectContextFromURL('/news/article-123')).toBe('news');
  });

  it('detects dashboard context', () => {
    expect(detectContextFromURL('/dashboard')).toBe('dashboard');
    expect(detectContextFromURL('/user/dashboard/home')).toBe('dashboard');
  });

  it('detects prompts context from prompt-directory', () => {
    expect(detectContextFromURL('/prompt-directory')).toBe('prompts');
    expect(detectContextFromURL('/prompt-directory/marketing')).toBe('prompts');
  });

  it('detects business context from business-panel', () => {
    expect(detectContextFromURL('/business-panel')).toBe('business');
    expect(detectContextFromURL('/business-panel/analytics')).toBe('business');
  });

  it('detects profile context', () => {
    expect(detectContextFromURL('/profile')).toBe('profile');
    expect(detectContextFromURL('/profile/settings')).toBe('profile');
  });

  it('returns general for unknown paths', () => {
    expect(detectContextFromURL('/')).toBe('general');
    expect(detectContextFromURL('/unknown')).toBe('general');
    expect(detectContextFromURL('')).toBe('general');
    expect(detectContextFromURL('/my-courses')).toBe('general');
  });

  it('is case-sensitive (paths are lowercase)', () => {
    expect(detectContextFromURL('/COURSES')).toBe('general');
    expect(detectContextFromURL('/Dashboard')).toBe('general');
  });
});

describe('getPageContextInfo', () => {
  it('returns exact match for known paths', () => {
    const result = getPageContextInfo('/communities');
    expect(result).toContain('comunidades');
  });

  it('returns courses description for /courses', () => {
    const result = getPageContextInfo('/courses');
    expect(result).toMatch(/cursos/i);
  });

  it('returns workshops description for /workshops', () => {
    const result = getPageContextInfo('/workshops');
    expect(result).toMatch(/talleres/i);
  });

  it('returns news description for /news', () => {
    const result = getPageContextInfo('/news');
    expect(result).toMatch(/noticias/i);
  });

  it('returns dashboard description for /dashboard', () => {
    const result = getPageContextInfo('/dashboard');
    expect(result).toMatch(/panel|dashboard/i);
  });

  it('returns prompt-directory description', () => {
    const result = getPageContextInfo('/prompt-directory');
    expect(result).toMatch(/prompt/i);
  });

  it('returns business-panel description', () => {
    const result = getPageContextInfo('/business-panel');
    expect(result).toMatch(/negocios|business/i);
  });

  it('returns profile description', () => {
    const result = getPageContextInfo('/profile');
    expect(result).toMatch(/perfil/i);
  });

  it('uses partial match for sub-paths', () => {
    const result = getPageContextInfo('/courses/intro-to-ai');
    expect(result).toMatch(/cursos/i);
  });

  it('returns default description for unknown paths', () => {
    const result = getPageContextInfo('/unknown-page');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    expect(result).toMatch(/plataforma/i);
  });

  it('returns default description for root path', () => {
    const result = getPageContextInfo('/');
    expect(result).toMatch(/plataforma/i);
  });

  it('always returns a non-empty string', () => {
    const paths = ['/', '/unknown', '/courses', '/profile', '/business-panel/users'];
    for (const path of paths) {
      const result = getPageContextInfo(path);
      expect(result.length).toBeGreaterThan(0);
    }
  });
});
