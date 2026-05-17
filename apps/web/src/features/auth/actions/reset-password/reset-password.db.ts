import type { createClient } from '../../../../lib/supabase/server';
import type {
  LooseRpcClient,
  PasswordChangeRpcResult,
  PasswordResetTokenData,
} from './reset-password.types';

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export async function getPasswordResetToken(
  supabase: SupabaseServerClient,
  token: string
): Promise<PasswordResetTokenData | null> {
  const { data, error } = await supabase
    .from('password_reset_tokens')
    .select('user_id, expires_at, used_at')
    .eq('token', token)
    .single();

  return error || !data ? null : data;
}

export async function deletePasswordResetToken(
  supabase: SupabaseServerClient,
  token: string
): Promise<void> {
  await supabase.from('password_reset_tokens').delete().eq('token', token);
}

export async function changeUserPassword(
  supabase: SupabaseServerClient,
  userId: string,
  newPassword: string
): Promise<string | null> {
  const { data, error } = await (supabase as unknown as LooseRpcClient).rpc<PasswordChangeRpcResult>(
    'change_user_password',
    {
      p_new_password: newPassword,
      p_user_id: userId,
    }
  );

  if (error) {
    return 'Error actualizando contraseña.';
  }

  if (data && !data.success) {
    return data.error || 'Error actualizando contraseña.';
  }

  return null;
}

export async function markPasswordResetTokenUsed(
  supabase: SupabaseServerClient,
  token: string
): Promise<void> {
  await supabase
    .from('password_reset_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('token', token);
}

export async function revokeUserSessions(
  supabase: SupabaseServerClient,
  userId: string
): Promise<void> {
  await supabase.from('user_session').update({ revoked: true }).eq('user_id', userId);
}
