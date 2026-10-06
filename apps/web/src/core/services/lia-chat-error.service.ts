const GENERIC_CHAT_ERROR =
  'Lo siento, ocurrió un error al procesar tu mensaje. Por favor, intenta de nuevo.';

/** Only allowlisted messages may reach the chat; provider errors can contain secrets. */
export class LiaChatRequestError extends Error {
  constructor(
    readonly status: number,
    readonly code: string | null,
    message: string,
  ) {
    super(message);
    this.name = 'LiaChatRequestError';
  }
}

export async function readLiaChatRequestError(response: Response): Promise<LiaChatRequestError> {
  const payload: unknown = await response.json().catch(() => null);
  const rawCode = payload && typeof payload === 'object' && 'error' in payload
    ? payload.error
    : null;
  const code = typeof rawCode === 'string' && /^[A-Z_]{1,80}$/.test(rawCode)
    ? rawCode
    : null;

  let message = GENERIC_CHAT_ERROR;
  if (code === 'RATE_LIMIT_SERVICE_UNAVAILABLE') {
    message = 'SofLIA está temporalmente fuera de servicio. Intenta de nuevo en un minuto.';
  } else if (code === 'AI_PROVIDER_KEY_MISSING') {
    message = 'SofLIA necesita que un administrador revise su configuración para poder responder.';
  } else if (response.status === 429) {
    message = 'Has enviado muchos mensajes en poco tiempo. Espera un minuto antes de intentar de nuevo.';
  } else if (response.status === 401) {
    message = 'Tu sesión ha caducado. Inicia sesión de nuevo para conversar con SofLIA.';
  }

  return new LiaChatRequestError(response.status, code, message);
}

export function getLiaChatErrorMessage(error: unknown): string {
  return error instanceof LiaChatRequestError ? error.message : GENERIC_CHAT_ERROR;
}
