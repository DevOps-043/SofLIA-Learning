import { describe, it, expect } from 'vitest';
import { SkillLevelService } from '../skillLevel.service';

// ─── calculateSkillLevel ──────────────────────────────────────────────────────

describe('SkillLevelService.calculateSkillLevel', () => {
  it('returns null for 0 courses', () => {
    expect(SkillLevelService.calculateSkillLevel(0)).toBeNull();
  });

  it('returns null for negative course count', () => {
    expect(SkillLevelService.calculateSkillLevel(-1)).toBeNull();
  });

  it('returns green for 1 course', () => {
    expect(SkillLevelService.calculateSkillLevel(1)).toBe('green');
  });

  it('returns bronze for 2 courses', () => {
    expect(SkillLevelService.calculateSkillLevel(2)).toBe('bronze');
  });

  it('returns silver for 3 courses', () => {
    expect(SkillLevelService.calculateSkillLevel(3)).toBe('silver');
  });

  it('returns gold for 4 courses', () => {
    expect(SkillLevelService.calculateSkillLevel(4)).toBe('gold');
  });

  it('returns diamond for 5 courses', () => {
    expect(SkillLevelService.calculateSkillLevel(5)).toBe('diamond');
  });

  it('returns diamond for more than 5 courses', () => {
    expect(SkillLevelService.calculateSkillLevel(10)).toBe('diamond');
    expect(SkillLevelService.calculateSkillLevel(100)).toBe('diamond');
  });

  it('levels progress from lower to higher as course count increases', () => {
    const levels = [1, 2, 3, 4, 5].map((n) => SkillLevelService.calculateSkillLevel(n));
    expect(levels).toEqual(['green', 'bronze', 'silver', 'gold', 'diamond']);
  });
});

// ─── getLevelInfo ─────────────────────────────────────────────────────────────

describe('SkillLevelService.getLevelInfo', () => {
  it('returns info for green level', () => {
    const info = SkillLevelService.getLevelInfo('green');
    expect(info).toBeDefined();
    expect(info.name).toBe('green');
    expect(info.displayName).toBe('Verde');
    expect(info.coursesRequired).toBe(1);
    expect(info.nextLevel).toBe('bronze');
  });

  it('returns info for diamond level', () => {
    const info = SkillLevelService.getLevelInfo('diamond');
    expect(info.name).toBe('diamond');
    expect(info.displayName).toBe('Diamante');
    expect(info.coursesRequired).toBe(5);
    expect(info.nextLevel).toBeUndefined();
  });

  it('all levels have color defined', () => {
    const levels: Array<'green' | 'bronze' | 'silver' | 'gold' | 'diamond'> = [
      'green', 'bronze', 'silver', 'gold', 'diamond',
    ];
    levels.forEach((level) => {
      const info = SkillLevelService.getLevelInfo(level);
      expect(info.color).toBeTruthy();
      expect(info.color).toMatch(/^#/);
    });
  });

  it('all levels have description defined', () => {
    const levels: Array<'green' | 'bronze' | 'silver' | 'gold' | 'diamond'> = [
      'green', 'bronze', 'silver', 'gold', 'diamond',
    ];
    levels.forEach((level) => {
      expect(SkillLevelService.getLevelInfo(level).description).toBeTruthy();
    });
  });

  it('courses required increases with each level', () => {
    expect(SkillLevelService.getLevelInfo('bronze').coursesRequired).toBeGreaterThan(
      SkillLevelService.getLevelInfo('green').coursesRequired,
    );
    expect(SkillLevelService.getLevelInfo('silver').coursesRequired).toBeGreaterThan(
      SkillLevelService.getLevelInfo('bronze').coursesRequired,
    );
  });
});

// ─── getBadgeFileName ─────────────────────────────────────────────────────────

describe('SkillLevelService.getBadgeFileName', () => {
  it('returns filename with slug and level', () => {
    expect(SkillLevelService.getBadgeFileName('javascript', 'gold')).toBe('javascript-gold.png');
  });

  it('returns filename with hyphenated slug', () => {
    expect(SkillLevelService.getBadgeFileName('machine-learning', 'diamond')).toBe(
      'machine-learning-diamond.png',
    );
  });

  it('uses correct level in filename', () => {
    const levels: Array<'green' | 'bronze' | 'silver' | 'gold' | 'diamond'> = [
      'green', 'bronze', 'silver', 'gold', 'diamond',
    ];
    levels.forEach((level) => {
      const filename = SkillLevelService.getBadgeFileName('skill', level);
      expect(filename).toBe(`skill-${level}.png`);
    });
  });
});

// ─── getBadgeUrl ──────────────────────────────────────────────────────────────

describe('SkillLevelService.getBadgeUrl', () => {
  it('returns filename when no baseUrl provided', () => {
    const result = SkillLevelService.getBadgeUrl('react', 'silver');
    expect(result).toBe('react-silver.png');
  });

  it('returns full URL when baseUrl is provided', () => {
    const result = SkillLevelService.getBadgeUrl('react', 'gold', 'https://storage.example.com/badges');
    expect(result).toBe('https://storage.example.com/badges/react-gold.png');
  });

  it('appends filename to baseUrl with separator', () => {
    const result = SkillLevelService.getBadgeUrl('python', 'diamond', 'https://cdn.example.com');
    expect(result).toContain('python-diamond.png');
    expect(result).toContain('https://cdn.example.com');
  });
});
