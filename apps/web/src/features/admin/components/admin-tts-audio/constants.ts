import type {
  ReadingAudioJobStatus,
  ReadingAudioLanguage,
  ReadingAudioResource,
  ReadingAudioSourceType,
} from './types';

export const REFRESH_INTERVAL_MS = 7_500;

export const STATUS_KEYS: ReadingAudioJobStatus[] = ['pending', 'generating', 'ready', 'failed'];
export const LANGUAGE_KEYS: Array<ReadingAudioLanguage | 'all'> = ['all', 'es', 'en', 'pt'];
export const SOURCE_TYPE_KEYS: Array<ReadingAudioSourceType | 'all'> = [
  'all',
  'activity_reading',
  'material_reading',
  'lesson_transcript',
  'lesson_summary',
];
export const RESOURCE_KEYS: ReadingAudioResource[] = ['all', 'activities', 'lessons', 'materials'];

export const STATUS_STYLES: Record<ReadingAudioJobStatus, string> = {
  failed: 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300',
  generating:
    'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300',
  pending:
    'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300',
  ready:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300',
};
