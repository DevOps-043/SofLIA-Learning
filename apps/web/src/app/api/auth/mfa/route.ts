import { NextResponse } from 'next/server';

import { apiError } from '@/lib/api/errors';
import { withAuth } from '@/lib/api/with-auth';
import {
  disableMfaFactor,
  MfaError,
  regenerateRecoveryCodes,
} from '@/lib/auth/mfa/mfa.service';

import { tokenSchema } from './schema';

export const DELETE = withAuth(
  async (request, auth) => {
    let json: unknown;
    try {
      json = await request.json();
    } catch {
      return apiError('INVALID_JSON', 'El cuerpo de la solicitud no es JSON valido.', 400);
    }

    const parsed = tokenSchema.safeParse(json);
    if (!parsed.success) {
      return apiError('VALIDATION_ERROR', 'La solicitud no cumple el contrato esperado.', 422, {
        details: parsed.error.flatten(),
      });
    }

    try {
      await disableMfaFactor({ id: auth.userId, email: auth.email }, parsed.data.token);
      return NextResponse.json({ disabled: true });
    } catch (error) {
      if (error instanceof MfaError) {
        const status = error.code === 'MFA_INVALID_TOKEN' ? 400 : 500;
        return apiError(error.code, error.message, status);
      }
      return apiError('MFA_DISABLE_ERROR', 'Error al deshabilitar MFA.', 500);
    }
  },
  { roles: ['Admin', 'Business'] },
);

export const PUT = withAuth(
  async (request, auth) => {
    let json: unknown;
    try {
      json = await request.json();
    } catch {
      return apiError('INVALID_JSON', 'El cuerpo de la solicitud no es JSON valido.', 400);
    }

    const parsed = tokenSchema.safeParse(json);
    if (!parsed.success) {
      return apiError('VALIDATION_ERROR', 'La solicitud no cumple el contrato esperado.', 422, {
        details: parsed.error.flatten(),
      });
    }

    try {
      const recoveryCodes = await regenerateRecoveryCodes(
        { id: auth.userId, email: auth.email },
        parsed.data.token,
      );
      return NextResponse.json({ recoveryCodes });
    } catch (error) {
      if (error instanceof MfaError) {
        const status = error.code === 'MFA_INVALID_TOKEN' ? 400 : 500;
        return apiError(error.code, error.message, status);
      }
      return apiError('MFA_REGENERATE_ERROR', 'Error al regenerar codigos de recuperacion.', 500);
    }
  },
  { roles: ['Admin', 'Business'] },
);
