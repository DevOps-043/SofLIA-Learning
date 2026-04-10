import { describe, expect, it, vi } from 'vitest';
import {
  fetchStudyPlannerUserContext,
  mapStudyPlannerAssignedCourses,
  mapStudyPlannerUserContext,
} from '../planner-user-context-client.service';

describe('planner-user-context-client.service', () => {
  it('maps and sorts assigned courses by due date', () => {
    const result = mapStudyPlannerAssignedCourses([
      {
        courseId: 'course-2',
        title: 'Sin fecha',
      },
      {
        course: {
          dueDate: '2026-05-10',
          id: 'course-3',
          title: 'Curso tardio',
        },
      },
      {
        dueDate: '2026-04-01',
        id: 'course-1',
        title: 'Curso urgente',
      },
      {
        title: 'Invalido',
      },
    ]);

    expect(result.map((course) => course.courseId)).toEqual([
      'course-1',
      'course-3',
      'course-2',
    ]);
  });

  it('maps user context with organization, role and teams', () => {
    const result = mapStudyPlannerUserContext({
      organization: { name: 'SofLIA Labs' },
      professionalProfile: {
        area: { nombre: 'Producto' },
        nivel: { nombre: 'Senior' },
        rol: { nombre: 'Manager' },
        tamanoEmpresa: {
          nombre: '51-200',
          minEmpleados: 51,
          maxEmpleados: 200,
        },
      },
      user: {
        firstName: 'Ana',
      },
      userType: 'b2b',
      workTeams: [{ name: 'Growth' }],
    });

    expect(result).toEqual({
      area: 'Producto',
      maxEmpleados: 200,
      minEmpleados: 51,
      nivel: 'Senior',
      organizationName: 'SofLIA Labs',
      rol: 'Manager',
      tamanoEmpresa: '51-200',
      userName: 'Ana',
      userType: 'b2b',
      workTeams: [{ name: 'Growth', role: 'member' }],
    });
  });

  it('returns an empty result when the API response is not ok', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
    });

    const result = await fetchStudyPlannerUserContext(fetchMock as unknown as typeof fetch);

    expect(result).toEqual({
      assignedCourses: [],
      rawProfile: null,
      success: false,
      userContext: null,
      userId: null,
    });
  });

  it('fetches, normalizes and returns the planner user context payload', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          userId: 'user-1',
          userType: 'b2c',
          user: { displayName: 'Ana Perez' },
          courses: [
            {
              course: {
                dueDate: '2026-04-10',
                id: 'course-1',
                title: 'Curso A',
              },
            },
          ],
        },
      }),
    });

    const result = await fetchStudyPlannerUserContext(fetchMock as unknown as typeof fetch);

    expect(result.userId).toBe('user-1');
    expect(result.success).toBe(true);
    expect(result.userContext?.userName).toBe('Ana Perez');
    expect(result.userContext?.userType).toBe('b2c');
    expect(result.assignedCourses).toEqual([
      expect.objectContaining({
        courseId: 'course-1',
        dueDate: '2026-04-10',
        title: 'Curso A',
      }),
    ]);
  });
});
