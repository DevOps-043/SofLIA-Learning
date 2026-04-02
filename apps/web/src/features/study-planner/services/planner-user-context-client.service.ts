import type {
  StudyPlannerAssignedCourse,
  StudyPlannerUserContext,
} from '../types/planner-ui.types';
import type { UserType } from '../types/user-context.types';

export interface StudyPlannerUserContextApiCourse {
  course?: {
    dueDate?: string | null;
    id?: string | null;
    title?: string | null;
  } | null;
  courseId?: string | null;
  dueDate?: string | null;
  id?: string | null;
  title?: string | null;
}

export interface StudyPlannerUserContextApiTeam {
  name?: string | null;
  role?: string | null;
}

export interface StudyPlannerUserContextApiData {
  courses?: StudyPlannerUserContextApiCourse[] | null;
  organization?: {
    name?: string | null;
  } | null;
  professionalProfile?: {
    area?: { nombre?: string | null } | null;
    nivel?: { nombre?: string | null } | null;
    rol?: { nombre?: string | null } | null;
    tamanoEmpresa?: {
      maxEmpleados?: number | null;
      minEmpleados?: number | null;
      nombre?: string | null;
    } | null;
  } | null;
  user?: {
    displayName?: string | null;
    firstName?: string | null;
    username?: string | null;
  } | null;
  userId?: string | null;
  userType?: string | null;
  workTeams?: StudyPlannerUserContextApiTeam[] | null;
}

export interface StudyPlannerUserContextApiResponse {
  data?: StudyPlannerUserContextApiData | null;
  success?: boolean;
}

export interface StudyPlannerFetchedUserContext {
  assignedCourses: StudyPlannerAssignedCourse[];
  rawProfile: StudyPlannerUserContextApiData | null;
  success: boolean;
  userContext: StudyPlannerUserContext | null;
  userId: string | null;
}

function normalizeUserType(userType: string | null | undefined): UserType | null {
  return userType === 'b2b' || userType === 'b2c' ? userType : null;
}

export function mapStudyPlannerAssignedCourses(
  courses: StudyPlannerUserContextApiCourse[] | null | undefined,
): StudyPlannerAssignedCourse[] {
  if (!Array.isArray(courses)) {
    return [];
  }

  return courses
    .map((course) => ({
      courseId: course.courseId || course.course?.id || course.id || '',
      dueDate: course.dueDate || course.course?.dueDate || null,
      title: course.course?.title || course.title || 'Curso',
    }))
    .filter((course) => Boolean(course.courseId))
    .sort((left, right) => {
      if (left.dueDate && right.dueDate) {
        return new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime();
      }

      if (left.dueDate && !right.dueDate) {
        return -1;
      }

      if (!left.dueDate && right.dueDate) {
        return 1;
      }

      return left.title.localeCompare(right.title);
    });
}

export function mapStudyPlannerUserContext(
  userProfile: StudyPlannerUserContextApiData | null | undefined,
): StudyPlannerUserContext | null {
  if (!userProfile) {
    return null;
  }

  const workTeams =
    userProfile.workTeams?.map((team) => ({
      name: team.name || 'Equipo',
      role: team.role || 'member',
    })) || null;

  return {
    area: userProfile.professionalProfile?.area?.nombre || null,
    maxEmpleados: userProfile.professionalProfile?.tamanoEmpresa?.maxEmpleados || null,
    minEmpleados: userProfile.professionalProfile?.tamanoEmpresa?.minEmpleados || null,
    nivel: userProfile.professionalProfile?.nivel?.nombre || null,
    organizationName: userProfile.organization?.name || null,
    rol: userProfile.professionalProfile?.rol?.nombre || null,
    tamanoEmpresa: userProfile.professionalProfile?.tamanoEmpresa?.nombre || null,
    userName:
      userProfile.user?.firstName ||
      userProfile.user?.displayName ||
      userProfile.user?.username ||
      null,
    userType: normalizeUserType(userProfile.userType),
    workTeams,
  };
}

export async function fetchStudyPlannerUserContext(
  fetchImpl: typeof fetch = fetch,
): Promise<StudyPlannerFetchedUserContext> {
  const emptyResult: StudyPlannerFetchedUserContext = {
    assignedCourses: [],
    rawProfile: null,
    success: false,
    userContext: null,
    userId: null,
  };

  try {
    const response = await fetchImpl('/api/study-planner/user-context');
    if (!response.ok) {
      return emptyResult;
    }

    const payload = (await response.json()) as StudyPlannerUserContextApiResponse;
    const rawProfile = payload.data || null;

    return {
      assignedCourses: mapStudyPlannerAssignedCourses(rawProfile?.courses),
      rawProfile,
      success: Boolean(payload.success && rawProfile),
      userContext: mapStudyPlannerUserContext(rawProfile),
      userId: rawProfile?.userId || null,
    };
  } catch {
    return emptyResult;
  }
}
