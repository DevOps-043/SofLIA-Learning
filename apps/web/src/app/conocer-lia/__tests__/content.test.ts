import { describe, expect, it } from 'vitest';
import {
  liaCapabilities,
  liaMetaphors,
  liaPersonalityFeatures,
  liaStudyPlannerFeatures,
} from '../content';

describe('conocer-lia content', () => {
  it('keeps all landing sections populated', () => {
    expect(liaMetaphors).toHaveLength(5);
    expect(liaCapabilities.length).toBeGreaterThanOrEqual(4);
    expect(liaStudyPlannerFeatures).toHaveLength(6);
    expect(liaPersonalityFeatures).toHaveLength(4);
  });

  it('defines stable titles without duplicates per section', () => {
    const getTitles = (items: { title: string }[]) => items.map((item) => item.title);
    const assertUnique = (titles: string[]) => expect(new Set(titles).size).toBe(titles.length);

    assertUnique(getTitles(liaMetaphors));
    assertUnique(getTitles(liaCapabilities));
    assertUnique(getTitles(liaStudyPlannerFeatures));
    assertUnique(getTitles(liaPersonalityFeatures));
  });
});
