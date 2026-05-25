export async function deleteInappropriateComment(params: {
  supabase: unknown
  postId: string
  commentId: string
}) {
  const { supabase, postId, commentId } = params;
  const client = supabase as {
    from: (table: string) => {
      delete: () => {
        eq: (column: string, value: string) => Promise<{ error?: unknown }>
      }
    }
    rpc: (name: string, args: Record<string, string>) => Promise<{ error?: unknown }>
  };

  const { error: deleteError } = await client
    .from('community_comments')
    .delete()
    .eq('id', commentId);

  if (!deleteError) {
    await client.rpc('decrement_comment_count', { post_id: postId });
  }
}
