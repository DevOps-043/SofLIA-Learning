import type {
  OAuthProfile,
  OAuthTokens,
} from '../../types/oauth.types';
import type {
  MicrosoftProfile,
  MicrosoftTokens,
} from '../microsoft-oauth.service';
import type { NormalizedOAuthProfile } from './oauth-flow.types';

interface NameParts {
  firstName: string;
  lastName: string;
}

function splitDisplayName(displayName?: string): NameParts {
  const normalizedName = displayName?.trim();

  if (!normalizedName) {
    return {
      firstName: 'Usuario',
      lastName: '',
    };
  }

  const [firstName, ...rest] = normalizedName.split(/\s+/);

  return {
    firstName: firstName || 'Usuario',
    lastName: rest.join(' '),
  };
}

function buildFullName(firstName: string, lastName: string, fallback: string): string {
  const fullName = `${firstName} ${lastName}`.trim();

  return fullName || fallback;
}

export function normalizeGoogleOAuthProfile(
  profile: OAuthProfile
): NormalizedOAuthProfile {
  const email = profile.email?.trim().toLowerCase() || '';
  const googleNameParts = splitDisplayName(profile.name);
  const firstName = profile.given_name || googleNameParts.firstName;
  const lastName = profile.family_name || googleNameParts.lastName;
  const hasExplicitName = Boolean(
    profile.name?.trim() || profile.given_name?.trim() || profile.family_name?.trim()
  );

  return {
    email,
    firstName,
    fullName: hasExplicitName
      ? profile.name || buildFullName(firstName, lastName, email)
      : email,
    lastName,
    picture: profile.picture,
    providerAccountId: profile.id,
  };
}

export function normalizeMicrosoftOAuthProfile(
  profile: MicrosoftProfile
): NormalizedOAuthProfile {
  const email = (profile.mail || profile.userPrincipalName || '')
    .trim()
    .toLowerCase();
  const microsoftNameParts = splitDisplayName(profile.displayName);
  const firstName = profile.givenName || microsoftNameParts.firstName;
  const lastName = profile.surname || microsoftNameParts.lastName;

  return {
    email,
    firstName,
    fullName:
      profile.displayName || buildFullName(firstName, lastName, email),
    lastName,
    providerAccountId: profile.id,
  };
}

export function normalizeMicrosoftOAuthTokens(
  tokens: MicrosoftTokens
): OAuthTokens {
  return {
    access_token: tokens.access_token,
    expires_at: tokens.expires_in
      ? Date.now() + tokens.expires_in * 1000
      : undefined,
    refresh_token: tokens.refresh_token,
    scope: tokens.scope || '',
    token_type: tokens.token_type,
  };
}
