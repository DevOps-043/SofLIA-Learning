export type RefreshTokenErrorCode =
  | 'MISSING_REFRESH_TOKEN'
  | 'INVALID_REFRESH_TOKEN'
  | 'INACTIVE_REFRESH_TOKEN'
  | 'REFRESH_TOKEN_LOOKUP_FAILED'
  | 'REFRESH_TOKEN_UPDATE_FAILED';

const AUTH_ERROR_CODES = new Set<RefreshTokenErrorCode>([
  'MISSING_REFRESH_TOKEN',
  'INVALID_REFRESH_TOKEN',
  'INACTIVE_REFRESH_TOKEN',
]);

const DEFAULT_ERROR_MESSAGES: Record<RefreshTokenErrorCode, string> = {
  MISSING_REFRESH_TOKEN: 'Refresh token no encontrado',
  INVALID_REFRESH_TOKEN: 'Token invalido o expirado',
  INACTIVE_REFRESH_TOKEN: 'Sesion expirada por inactividad',
  REFRESH_TOKEN_LOOKUP_FAILED: 'No se pudo consultar la sesion',
  REFRESH_TOKEN_UPDATE_FAILED: 'No se pudo actualizar la sesion',
};

export class RefreshTokenError extends Error {
  readonly code: RefreshTokenErrorCode;
  readonly status: 401 | 500;

  constructor(
    code: RefreshTokenErrorCode,
    message: string = DEFAULT_ERROR_MESSAGES[code]
  ) {
    super(message);
    this.name = 'RefreshTokenError';
    this.code = code;
    this.status = AUTH_ERROR_CODES.has(code) ? 401 : 500;
  }
}

export function isRefreshTokenAuthError(
  error: unknown
): error is RefreshTokenError {
  return error instanceof RefreshTokenError && error.status === 401;
}
