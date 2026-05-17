import type { createClient as createServiceClient } from '@supabase/supabase-js';
import type { SupportedLanguage } from '../../i18n/i18n';
import type { Database } from '@/lib/supabase/types';

export type EntityType = 'course' | 'module' | 'lesson' | 'activity' | 'material';

export interface ContentTranslations {
  [key: string]: string | string[];
}

export type ContentTranslationPayload = Record<string, unknown>;

export type TranslationLanguage = SupportedLanguage;

export type TranslationSupabaseClient = ReturnType<
  typeof createServiceClient<Database>
>;
