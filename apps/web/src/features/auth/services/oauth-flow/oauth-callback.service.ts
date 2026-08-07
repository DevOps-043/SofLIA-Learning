import validator from 'validator';
import { logger } from '../../../../lib/logger';
import { createAdminClient } from '../../../../lib/supabase/admin';
import { AuthService } from '../../services/auth.service';
import { OAuthService } from '../../services/oauth.service';
import {
  createServerAuthSession,
  notifyLoginSuccessWithTimeout,
  type RequestMetadata,
  updateLastLoginAt,
} from '../auth-session.service';
import {
  linkOAuthUserToOrganization,
  resolveOAuthInvitationContext,
} from './oauth-invitation.service';
import { resolveOAuthDashboardDestination } from './oauth-redirect.service';
import {
  parseOAuthOrganizationContext,
  validateOAuthState,
} from './oauth-state.service';
import type {
  OAuthCallbackParamsLike,
  OAuthProviderAdapter,
  ProcessOAuthCallbackResult,
} from './oauth-flow.types';
import type { TablesUpdate } from '../../../../lib/supabase/types';

interface ProcessOAuthCallbackInput<TProviderTokens> {
  orgContextCookie?: string;
  params: OAuthCallbackParamsLike;
  provider: OAuthProviderAdapter<TProviderTokens>;
  requestMetadata: RequestMetadata;
  storedState?: string;
}

export async function processOAuthCallback<TProviderTokens>({
  orgContextCookie,
  params,
  provider,
  requestMetadata,
  storedState,
}: ProcessOAuthCallbackInput<TProviderTokens>): Promise<ProcessOAuthCallbackResult> {
  try {
    if (params.error) {
      return {
        error: params.error_description || 'Error de autenticacion',
      };
    }

    if (!params.code) {
      return {
        error: 'Codigo de autorizacion no recibido',
      };
    }

    const stateValidation = validateOAuthState({
      receivedState: params.state,
      storedState,
    });

    if (!stateValidation.valid) {
      logger.error(`${provider.providerLabel} OAuth: CSRF invalido`, undefined, {
        hasReceivedState: Boolean(params.state),
        hasStoredState: Boolean(storedState),
      });
      return { error: stateValidation.error };
    }

    const tokens = await provider.exchangeCodeForTokens(params.code);
    const normalizedProfile = await provider.getProfile(tokens);

    if (!normalizedProfile.email || !validator.isEmail(normalizedProfile.email)) {
      return {
        error: 'Email invalido o no disponible',
      };
    }

    const supabase = createAdminClient();
    const initialOrgContext = parseOAuthOrganizationContext(orgContextCookie);
    const existingUser = await OAuthService.findUserByEmail(
      normalizedProfile.email,
      initialOrgContext.orgId
    );

    const invitationContextResult = await resolveOAuthInvitationContext({
      email: normalizedProfile.email,
      existingUserId: existingUser?.id,
      orgContext: initialOrgContext,
      providerLabel: provider.providerLabel,
      supabase,
    });

    if (invitationContextResult.error || !invitationContextResult.value) {
      return { error: invitationContextResult.error };
    }

    const {
      bulkInviteLink,
      invitedPosition,
      invitedRole,
      orgContext,
    } = invitationContextResult.value;

    let userId: string;
    let isNewUser = false;

    if (existingUser) {
      userId = existingUser.id;

      const profileUpdates: TablesUpdate<'users'> = {};

      if (orgContext.orgId && invitedRole) {
        profileUpdates.platform_role = 'Business';
      }

      if (normalizedProfile.picture) {
        profileUpdates.profile_picture_url = normalizedProfile.picture;
      }

      if (Object.keys(profileUpdates).length > 0) {
        const { error: updateError } = await supabase
          .from('users')
          .update(profileUpdates)
          .eq('id', userId);

        if (updateError) {
          logger.error(
            `${provider.providerLabel} OAuth: No se pudo actualizar perfil`,
            updateError,
            { userId }
          );
        }
      }
    } else {
      userId = await OAuthService.createUserFromOAuth(
        normalizedProfile.email,
        normalizedProfile.firstName,
        normalizedProfile.lastName,
        normalizedProfile.picture,
        orgContext.orgId && invitedRole ? 'Business' : 'Usuario',
        undefined
      );
      isNewUser = true;
    }

    await linkOAuthUserToOrganization({
      bulkInviteLink,
      email: normalizedProfile.email,
      invitedPosition,
      invitedRole,
      orgContext,
      supabase,
      userId,
    });

    await OAuthService.upsertOAuthAccount(
      userId,
      provider.provider,
      normalizedProfile.providerAccountId,
      provider.toOAuthTokens(tokens)
    );

    await updateLastLoginAt(supabase, userId);

    const session = await createServerAuthSession({
      rememberMe: false,
      requestMetadata,
      userId,
    });

    try {
      await AuthService.clearExpiredSessions();
    } catch (clearExpiredSessionsError) {
      logger.error(
        `${provider.providerLabel} OAuth: Error limpiando sesiones expiradas`,
        clearExpiredSessionsError,
        { userId }
      );
    }

    if (provider.shouldNotifyLoginSuccess) {
      await notifyLoginSuccessWithTimeout({
        isNewUser,
        isOAuth: true,
        requestMetadata,
        userId,
      });
    }

    return {
      destination: await resolveOAuthDashboardDestination(supabase, userId),
      isNewUser,
      session,
      userId,
    };
  } catch (error) {
    logger.error(`Error en callback ${provider.providerLabel} OAuth`, error);

    return {
      error: 'Error procesando autenticacion. Intentalo de nuevo.',
    };
  }
}
