import { NextResponse } from 'next/server';

export type ApiError = {
  error: string;
  message: string;
  details?: unknown;
  requestId?: string;
};

type ApiErrorInit = {
  details?: unknown;
  headers?: HeadersInit;
  requestId?: string;
};

export function apiError(
  code: string,
  message: string,
  status: number,
  init: ApiErrorInit = {},
): NextResponse<ApiError> {
  const payload: ApiError = {
    error: code,
    message,
  };

  if (init.requestId) {
    payload.requestId = init.requestId;
  }

  if (init.details !== undefined && status < 500) {
    payload.details = init.details;
  }

  return NextResponse.json(payload, { headers: init.headers, status });
}

export function internalServerError(requestId?: string): NextResponse<ApiError> {
  return apiError('INTERNAL_SERVER_ERROR', 'Error interno del servidor.', 500, { requestId });
}
