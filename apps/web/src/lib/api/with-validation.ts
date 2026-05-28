import type { NextRequest } from 'next/server';
import { apiError } from './errors';

export type ValidatedRouteHandler<TBody, TContext = unknown> = (
  request: NextRequest,
  body: TBody,
  context: TContext,
) => Promise<Response>;

type WithZodBodyOptions = {
  emptyBodyFallback?: unknown;
};

type RequestBodySchema<TBody> = {
  safeParse(data: unknown):
    | { success: true; data: TBody }
    | { success: false; error: { flatten(): unknown } };
};

export function withZodBody<TBody, TContext = unknown>(
  schema: RequestBodySchema<TBody>,
  handler: ValidatedRouteHandler<TBody, TContext>,
  options: WithZodBodyOptions = {},
) {
  return async (request: NextRequest, context: TContext): Promise<Response> => {
    let json: unknown;

    try {
      json = await request.json();
    } catch {
      if ('emptyBodyFallback' in options) {
        json = options.emptyBodyFallback;
      } else {
        return apiError('INVALID_JSON', 'El cuerpo de la solicitud no es JSON valido.', 400);
      }
    }

    const parsed = schema.safeParse(json);

    if (!parsed.success) {
      return apiError('VALIDATION_ERROR', 'La solicitud no cumple el contrato esperado.', 422, {
        details: parsed.error.flatten(),
      });
    }

    return handler(request, parsed.data, context);
  };
}
