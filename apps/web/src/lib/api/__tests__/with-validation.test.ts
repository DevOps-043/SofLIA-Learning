import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { withZodBody } from '../with-validation';

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
});

function requestWithBody(body: string): NextRequest {
  return new Request('http://localhost/api/test', {
    body,
    method: 'POST',
  }) as NextRequest;
}

describe('withZodBody', () => {
  it('passes parsed body to the route handler', async () => {
    const handler = vi.fn(async (_request: NextRequest, body: z.infer<typeof schema>) =>
      NextResponse.json({ email: body.email, ok: true }),
    );
    const route = withZodBody(schema, handler);

    const response = await route(
      requestWithBody(JSON.stringify({ email: 'user@soflia.com', name: 'Lia' })),
      undefined,
    );

    await expect(response.json()).resolves.toEqual({ email: 'user@soflia.com', ok: true });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('returns INVALID_JSON for malformed payloads', async () => {
    const handler = vi.fn();
    const route = withZodBody(schema, handler);

    const response = await route(requestWithBody('{malformed'), undefined);

    await expect(response.json()).resolves.toMatchObject({
      error: 'INVALID_JSON',
      message: 'El cuerpo de la solicitud no es JSON valido.',
    });
    expect(response.status).toBe(400);
    expect(handler).not.toHaveBeenCalled();
  });

  it('uses the configured fallback for empty or malformed optional bodies', async () => {
    const optionalBodySchema = z.object({
      courseId: z.string().min(1).optional(),
    });
    const handler = vi.fn(async (_request: NextRequest, body: z.infer<typeof optionalBodySchema>) =>
      NextResponse.json({ body }),
    );
    const route = withZodBody(optionalBodySchema, handler, { emptyBodyFallback: {} });

    const response = await route(requestWithBody(''), undefined);

    await expect(response.json()).resolves.toEqual({ body: {} });
    expect(handler).toHaveBeenCalledWith(expect.any(Request), {}, undefined);
  });

  it('returns VALIDATION_ERROR with flattened details', async () => {
    const handler = vi.fn();
    const route = withZodBody(schema, handler);

    const response = await route(requestWithBody(JSON.stringify({ email: 'bad', name: '' })), undefined);

    await expect(response.json()).resolves.toMatchObject({
      error: 'VALIDATION_ERROR',
      details: {
        fieldErrors: {
          email: expect.any(Array),
          name: expect.any(Array),
        },
      },
    });
    expect(response.status).toBe(422);
    expect(handler).not.toHaveBeenCalled();
  });
});
