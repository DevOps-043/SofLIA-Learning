import { NextResponse } from 'next/server';

import { requireBusinessAccess } from './requireBusiness.shared';
import type {
  BusinessAccessStrategy,
  BusinessAuth,
  RequireBusinessOptions,
  RequireBusinessUserOptions,
} from './requireBusiness.types';

export type {
  BusinessAuth,
  RequireBusinessOptions,
  RequireBusinessUserOptions,
} from './requireBusiness.types';

const BUSINESS_ADMIN_STRATEGY: BusinessAccessStrategy = {
  fallbackRoleForPlatformAdmin: 'admin',
  successLogMessage: 'Business access granted',
  errorLogMessage: 'Error in requireBusiness middleware',
  invalidRoleLogMessage:
    'Non-business/admin user attempted to access business route',
  logPrefix: 'requireBusiness',
  invalidLegacySessionMessage:
    'Sesión inválida. Por favor, inicia sesión nuevamente.',
  revokedSessionMessage:
    'Sesión revocada. Por favor, inicia sesión nuevamente.',
};

const BUSINESS_USER_STRATEGY: BusinessAccessStrategy = {
  fallbackRoleForPlatformAdmin: 'member',
  successLogMessage: 'Business User access granted',
  errorLogMessage: 'Error in requireBusinessUser middleware',
  invalidRoleLogMessage: 'Unauthorized access attempt - invalid role',
  logPrefix: 'requireBusinessUser',
  invalidLegacySessionMessage: 'Sesión inválida o expirada.',
  revokedSessionMessage: 'Sesión inválida o expirada.',
};

export async function requireBusiness(
  options?: RequireBusinessOptions
): Promise<BusinessAuth | NextResponse> {
  return requireBusinessAccess(options, BUSINESS_ADMIN_STRATEGY);
}

export async function requireBusinessUser(
  options?: RequireBusinessUserOptions
): Promise<BusinessAuth | NextResponse> {
  return requireBusinessAccess(options, BUSINESS_USER_STRATEGY);
}
