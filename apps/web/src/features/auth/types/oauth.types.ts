/**
 * Tipos para autenticación OAuth
 */

export type OAuthProvider = 'google' | 'github' | 'facebook' | 'microsoft';

export interface OAuthProfile {
  id: string;
  email: string;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  email_verified?: boolean;
  locale?: string;
}

export interface OAuthTokens {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  token_type: string;
  scope: string;
}

export interface OAuthAccount {
  id: string;
  user_id: string;
  provider: OAuthProvider;
  provider_account_id: string;
  access_token?: string;
  refresh_token?: string;
  token_expires_at?: Date;
  scope?: string;
  token_type?: string;
  created_at: Date;
  updated_at: Date;
}

export interface OAuthUserRecord {
  platform_role?: string | null;
  email: string;
  email_verified?: boolean | null;
  first_name?: string | null;
  id: string;
  last_name?: string | null;
  username: string;
}

export interface OAuthCallbackParams {
  code?: string;
  state?: string;
  error?: string;
  error_description?: string;
}

export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}
