import { NextRequest, NextResponse } from 'next/server';
import { rateLimitMiddleware, RateLimitTier } from '@/lib/rate-limit/advanced-rate-limit';
import { handleLive, json } from '@/features/live/server';
import { verifiedHubUser, hubActorContext, readWorkspaceBody } from '@/features/live/hub-auth.server';
import { workspaceRequestSchema } from '@/features/live/workspace.contract';
import { executeWorkspace } from '@/features/live/workspace.service';

export async function POST(request: NextRequest) {
  return handleLive(async () => {
    const userId = await verifiedHubUser(request);
    const input = workspaceRequestSchema.parse(await readWorkspaceBody(request));
    const tier = input.operation.type === 'snapshot' ? RateLimitTier.API_READ : ['assist','suggest_pulse'].includes(input.operation.type) ? RateLimitTier.AI_GENERATION : RateLimitTier.API_MUTATION;
    const limited = rateLimitMiddleware(request, tier, userId);
    if (limited) {
      const response = new NextResponse(limited.body, { status: limited.status, headers: limited.headers });
      response.headers.set('Cache-Control', 'no-store');
      return response;
    }
    const context = await hubActorContext(userId, input.organization_slug);
    const response = json(await executeWorkspace(context, input.session_id, input.operation));
    response.headers.set('Referrer-Policy', 'no-referrer');
    return response;
  });
}
