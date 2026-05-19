import { NextRequest, NextResponse } from 'next/server';
import type { z } from 'zod';

import { logger } from '@/lib/utils/logger';
import { AdminUsersService } from '@/features/admin/services/adminUsers.service';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { CreateUserSchema } from '@/lib/schemas/user.schema';
import { withZodBody } from '@/lib/api/with-validation';
import { apiError } from '@/lib/api/errors';

type CreateUserInput = z.infer<typeof CreateUserSchema>;

async function handleCreateUser(request: NextRequest, body: CreateUserInput) {
  try {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;

    const adminUserId = auth.userId;
    const ip =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const newUser = await AdminUsersService.createUser(body, adminUserId, { ip, userAgent });

    return NextResponse.json({
      success: true,
      user: newUser,
    });
  } catch (error) {
    logger.error('Error in POST /api/admin/users/create:', error);
    return apiError('ADMIN_CREATE_USER_FAILED', 'Error al crear usuario.', 500);
  }
}

export const POST = withZodBody(CreateUserSchema, handleCreateUser);
