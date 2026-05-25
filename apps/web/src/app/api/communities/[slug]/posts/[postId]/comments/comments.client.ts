import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { fromLoose } from '@/lib/supabase/looseQuery';
import type {
  CommunityCommentInsertRow,
  CommunityCommentRow,
  CommunityLookupRow,
} from './comments.types';

export function commentsTable(client: unknown) {
  return fromLoose<CommunityCommentRow, CommunityCommentInsertRow>(
    client,
    'community_comments',
  );
}

export function communitiesTable(client: unknown) {
  return fromLoose<CommunityLookupRow>(client, 'communities');
}

export async function createCommunityRouteClient() {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Variables de entorno de Supabase faltantes');
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Component - ignore
        }
      },
    },
  });
}
