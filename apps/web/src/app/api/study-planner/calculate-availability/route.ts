import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '../../../../features/auth/services/session.service';
import { UserContextService } from '../../../../features/study-planner/services/user-context.service';
import {
  buildAvailabilityPrompt,
  callLIAForAvailabilityAnalysis,
  type AvailabilityProfileData,
  type CalculateAvailabilityRequest,
  type CalculateAvailabilityResponse,
} from './calculate-availability.service';

export async function POST(request: NextRequest): Promise<NextResponse<CalculateAvailabilityResponse>> {
  try {
    const user = await SessionService.getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 },
      );
    }

    const body: CalculateAvailabilityRequest = await request.json();
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
    console.error('Error calculando disponibilidad:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error interno del servidor',
      },
      { status: 500 },
    );
  }
}
