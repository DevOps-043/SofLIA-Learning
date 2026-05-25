export interface PasswordChangeRpcResult {
  error?: string | null;
  success?: boolean;
}

export type LooseRpcClient = {
  rpc<T>(
    fn: string,
    params?: Record<string, unknown>
  ): Promise<{ data: T | null; error: { message: string } | null }>;
};

export interface PasswordResetTokenData {
  expires_at: string;
  used_at: string | null;
  user_id: string;
}

export interface PasswordResetUser {
  cargo_rol?: string | null;
  display_name?: string | null;
  email: string | null;
  email_verified?: boolean | null;
  first_name: string | null;
  id: string;
  last_name?: string | null;
  password_hash?: string | null;
  profile_picture_url?: string | null;
  username: string | null;
}
