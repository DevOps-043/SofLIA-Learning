import { fromLoose } from '@/lib/supabase/looseQuery';
import type {
  CommunityCommentInsertRow,
  CommunityCommentRow,
  CommunityLookupRow,
} from './types';

export function commentsTable(client: unknown) {
  return fromLoose<CommunityCommentRow, CommunityCommentInsertRow>(
    client,
    'community_comments'
  );
}

export function communitiesTable(client: unknown) {
  return fromLoose<CommunityLookupRow>(client, 'communities');
}
