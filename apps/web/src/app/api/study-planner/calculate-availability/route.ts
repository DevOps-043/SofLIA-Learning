import { logger as techDebtLogger } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/api/errors';
import { withZodBody } from '@/lib/api/with-validation';
import { SessionService } from '../../../../features/auth/services/session.service';
import { UserContextService } from '../../../../features/study-planner/services/user-context.service';
import {
  calculateAvailabilitySchema,
  type CalculateAvailabilityBody,
} from '../_schemas';
import {
  buildAvailabilityPrompt,
  callLIAForAvailabilityAnalysis,
  type AvailabilityProfileData,
  type CalculateAvailabilityResponse,
} from './calculate-availability.service';

async function handlePost(
  _request: NextRequest,
  body: CalculateAvailabilityBody,
): Promise<NextResponse<CalculateAvailabilityResponse> | Response> {
  try {
    const user = await SessionService.getCurrentUser();

    if (!user) {
      return apiError('UNAUTHENTICATED', 'No autenticado', 401);
    }

    const userContext = await UserContextService.getFullUserContext(user.id);
    const profileData: AvailabilityProfileData = {
      userType: userContext.userType,
      rol: userContext.professionalProfile?.rol?.nombre || 'No especificado',
      area: userContext.professionalProfile?.area?.nombre || 'No especificada',
      nivel: userContext.professionalProfile?.nivel?.nombre || 'No especificado',
      tamanoEmpresa: userContext.professionalProfile?.tamanoEmpresa?.nombre || 'No especificado',
      minEmpleados: userContext.professionalProfile?.tamanoEmpresa?.minEmpleados,
      maxEmpleados: userContext.professionalProfile?.tamanoEmpresa?.maxEmpleados,
      sector: userContext.professionalProfile?.sector?.nombre || 'No especificado',
      organizacion: userContext.organization?.name,
      tieneCalendarioConectado: !!userContext.calendarIntegration?.isConnected,
      calendarEvents: body.calendarEvents || [],
      preferredDays: body.preferredDays,
      preferredTimeOfDay: body.preferredTimeOfDay,
    };

    const liaResponse = await callLIAForAvailabilityAnalysis(
      buildAvailabilityPrompt(profileData),
      profileData,
    );

    return NextResponse.json({
      success: true,
      data: liaResponse,
    });
  } catch (error) {
    techDebtLogger.error('Error calculando disponibilidad:', error);
    return apiError('CALCULATE_AVAILABILITY_FAILED', 'Error interno del servidor', 500);
  }
}

export const POST = withZodBody(calculateAvailabilitySchema, handlePost);
