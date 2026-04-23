import {
  REPORT_PROBLEM_CATEGORIES,
  REPORT_PROBLEM_PRIORITIES,
} from '../../../../../core/reporting/report-problem.contract';

export function normalizeBugCategory(value: string | null): string {
  return value &&
    REPORT_PROBLEM_CATEGORIES.includes(
      value as (typeof REPORT_PROBLEM_CATEGORIES)[number]
    )
    ? value
    : 'bug';
}

export function normalizeBugPriority(value: string | null): string {
  return value &&
    REPORT_PROBLEM_PRIORITIES.includes(
      value as (typeof REPORT_PROBLEM_PRIORITIES)[number]
    )
    ? value
    : 'media';
}
