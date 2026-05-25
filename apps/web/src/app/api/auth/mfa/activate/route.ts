import { NextResponse } from 'next/server';

import { apiError } from '@/lib/api/errors';
import { withAuth } from '@/lib/api/with-auth';
import { activateMfaFactor, MfaError } from '@/lib/auth/mfa/mfa.service';

import { activateSchema } from '../schema';

export const POST = withAuth(
  async (request, auth) => {
    let json: unknown;
    try {
      json = await request.json();
    } catch {
      return apiError('INVALID_JSON', 'El cuerpo de la solicitud no es JSON valido.', 400);
    }

    const parsed = activateSchema.safeParse(json);
    if (!parsed.success) {
      return apiError('VALIDATION_ERROR', 'La solicitud no cumple el contrato esperado.', 422, {
        details: parsed.error.flatten(),
      });
    }

    try {
      await activateMfaFactor(
        { id: auth.userId, email: auth.email },
        parsed.data.factorId,
        parsed.data.token,
      );
      return NextResponse.json({ activated: true });
    } catch (error) {
      if (error instanceof MfaError) {
        const status =
          error.code === 'MFA_INVALID_TOKEN'
            ? 400
            : error.code === 'MFA_FACTOR_NOT_FOUND'
              ? 404
              : 500;
        return apiError(error.code, error.message, status);
      }
      return apiError('MFA_ACTIVATE_ERROR', 'Error al activar MFA.', 500);
    }
  },
  { roles: ['Admin', 'Business'] },
);
