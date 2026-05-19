import { NextResponse } from 'next/server';

import { apiError } from '@/lib/api/errors';
import { withAuth } from '@/lib/api/with-auth';
import { MfaError, provisionMfaFactor } from '@/lib/auth/mfa/mfa.service';

export const POST = withAuth(
  async (_request, auth) => {
    try {
      const result = await provisionMfaFactor({ id: auth.userId, email: auth.email });
      return NextResponse.json({
        factorId: result.factorId,
        uri: result.uri,
        secret: result.secret,
        recoveryCodes: result.recoveryCodes,
      });
    } catch (error) {
      if (error instanceof MfaError) {
        return apiError(error.code, error.message, 500);
      }
      return apiError('MFA_SETUP_ERROR', 'No se pudo iniciar la configuracion de MFA.', 500);
    }
  },
  { roles: ['Admin', 'Business'] },
);
