import type { EstimatedTimeRow } from './lesson-time.types';

export function getRelationRecord<T>(relation: T | T[] | null | undefined): T | null {
  if (Array.isArray(relation)) {
    return relation[0] || null;
  }

  return relation || null;
}

export function sumEstimatedMinutes(items: EstimatedTimeRow[] | null | undefined): number {
  return items?.reduce((sum, item) => sum + (item.estimated_time_minutes || 5), 0) || 0;
}
