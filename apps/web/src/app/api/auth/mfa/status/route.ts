import { NextResponse } from 'next/server';

import { apiError } from '@/lib/api/errors';
import { withAuth } from '@/lib/api/with-auth';
import { getMfaStatus, MfaError } from '@/lib/auth/mfa/mfa.service';

export const GET = withAuth(async (_request, auth) => {
  try {
    const status = await getMfaStatus(auth.userId);
    return NextResponse.json(status);
  } catch (error) {
    if (error instanceof MfaError) {
      return apiError(error.code, error.message, 500);
    }
    return apiError('MFA_STATUS_ERROR', 'Error al consultar el estado MFA.', 500);
  }
});
