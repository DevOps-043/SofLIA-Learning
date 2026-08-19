import { NextRequest } from 'next/server';

import {
  handleSsoExchange,
  ssoExchangeOptionsResponse,
} from '@/lib/auth/sso-exchange-route';

/** POST /api/auth/web/exchange — canje server-to-server para Project Hub. */
export async function OPTIONS() {
  return ssoExchangeOptionsResponse();
}

export async function POST(request: NextRequest) {
  return handleSsoExchange(request, 'error');
}
