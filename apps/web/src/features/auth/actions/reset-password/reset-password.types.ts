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
  email: string | null;
  first_name: string | null;
  id: string;
  username: string | null;
}
