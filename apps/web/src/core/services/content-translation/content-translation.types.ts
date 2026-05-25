import type { SupabaseClient } from '@supabase/supabase-js';
import type { SupportedLanguage } from '../../i18n/i18n';
import type { Database } from '@/lib/supabase/types';

export type ContentTranslationEntityType =
  | 'course'
  | 'module'
  | 'lesson'
  | 'activity'
  | 'material';

export type ContentTranslationLanguage = SupportedLanguage;
export type ContentTranslationClient = SupabaseClient<Database>;

export interface ContentTranslations {
  [key: string]: string | string[];
}
