export interface LegacySessionRecord {
  expires_at: string;
  ip: string;
  issued_at: string;
  jwt_id: string;
  revoked: boolean;
  user_agent: string;
  user_id: string;
}

export interface LegacySessionLookupRow {
  expires_at: string;
  revoked: boolean;
  user_id: string;
}

export interface SessionUserRecord {
  cargo_rol: string | null;
  display_name: string | null;
  email: string | null;
  first_name: string | null;
  id: string;
  is_banned: boolean | null;
  last_name: string | null;
  profile_picture_url: string | null;
  signature_name: string | null;
  signature_url: string | null;
  username: string | null;
}

export interface DynamicServerUsageError {
  digest?: string;
  message?: string;
  name?: string;
  stack?: string;
}
