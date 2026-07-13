import 'server-only'

import { AdminCompaniesService } from '../adminCompanies.service'
import { AdminCoursesService } from '../adminCourses.service'
import { AdminLearningPathsService } from '../adminLearningPaths.service'
import { CourseDefaultsService } from '@/features/courses/services/course-defaults.server'
import { LearningPathDefaultsService } from '@/features/learning-paths/services/learning-path-defaults.server'
import { logger } from '@/lib/utils/logger'

/**
 * Bootstrap agregado de la pestaña "Cursos" del editor de empresa (admin).
 *
 * Antes el cliente disparaba 9 GETs paralelos (uno por sección). Cada request
 * pagaba middleware + requireAdmin + invocación serverless por separado, y el
 * trabajo se duplicaba entre endpoints: listLearningPaths se ejecutaba 3 veces
 * y organization_nodes se consultaba 4 veces por carga. Bajo concurrencia, los
 * requests excedentes provocaban cold starts de ~17-18 s.
 *
 * Este servicio resuelve todo en una sola invocación: primero carga el contexto
 * compartido (learning paths + nodos de jerarquía) y luego las 8 secciones en
 * paralelo reutilizándolo.
 *
 * Fail-soft por sección: una sección caída no aborta el resto; se devuelve su
 * fallback vacío y el nombre de la sección en `failedSections` para que el
 * cliente informe la degradación (mismo contrato de resiliencia que tenía el
 * hook con sus 9 fetches independientes).
 */

type CompanyCourses = Awaited<ReturnType<typeof AdminCompaniesService.getCompanyCourses>>
type UserCourseAssignments = Awaited<ReturnType<typeof AdminCompaniesService.getUserCourseAssignments>>
type CatalogCourses = Awaited<ReturnType<typeof AdminCoursesService.getAllCourses>>
type LearningPaths = Awaited<ReturnType<typeof AdminLearningPathsService.listLearningPaths>>
type OrganizationLpAssignments = Awaited<ReturnType<typeof AdminLearningPathsService.listOrganizationAssignments>>
type UserLpAssignments = Awaited<ReturnType<typeof AdminLearningPathsService.listUserAssignments>>
type HierarchyNodes = Awaited<ReturnType<typeof LearningPathDefaultsService.listHierarchyNodeOptions>>
type CourseDefaultRules = Awaited<ReturnType<typeof CourseDefaultsService.listDefaultRules>>
type LearningPathDefaultRules = Awaited<ReturnType<typeof LearningPathDefaultsService.listDefaultRules>>
type CompanyMembers = NonNullable<Awaited<ReturnType<typeof AdminCompaniesService.getCompanyById>>>['members']

export interface CompanyCoursesSectionData {
  companyCourses: CompanyCourses
  userCourseAssignments: UserCourseAssignments
  catalogCourses: CatalogCourses
  learningPaths: LearningPaths
  organizationLearningPathAssignments: OrganizationLpAssignments
  userLearningPathAssignments: UserLpAssignments
  members: CompanyMembers
  courseDefaults: { rules: CourseDefaultRules; nodes: HierarchyNodes }
  learningPathDefaults: { rules: LearningPathDefaultRules; nodes: HierarchyNodes }
  /** Secciones que fallaron y devolvieron su fallback vacío */
  failedSections: string[]
}

export async function getCompanyCoursesSection(
  organizationId: string,
): Promise<CompanyCoursesSectionData> {
  const failedSections: string[] = []

  const loadSection = async <T>(label: string, fallback: T, run: () => Promise<T>): Promise<T> => {
    try {
      return await run()
    } catch (error) {
      logger.error(`Error loading company courses section (${label}):`, error)
      failedSections.push(label)
      return fallback
    }
  }

  // Fase 1 — contexto compartido entre secciones (se consulta UNA sola vez)
  const [learningPaths, hierarchyNodes] = await Promise.all([
    loadSection<LearningPaths>('learning-paths', [], () =>
      AdminLearningPathsService.listLearningPaths(),
    ),
    loadSection<HierarchyNodes>('hierarchy-nodes', [], () =>
      LearningPathDefaultsService.listHierarchyNodeOptions(organizationId),
    ),
  ])

  // Fase 2 — secciones independientes en paralelo, reutilizando la fase 1
  const [
    companyCourses,
    userCourseAssignments,
    catalogCourses,
    organizationLearningPathAssignments,
    userLearningPathAssignments,
    company,
    courseDefaultRules,
    learningPathDefaultRules,
  ] = await Promise.all([
    loadSection<CompanyCourses>('org-courses', [], () =>
      AdminCompaniesService.getCompanyCourses(organizationId),
    ),
    loadSection<UserCourseAssignments>('user-assignments', [], () =>
      AdminCompaniesService.getUserCourseAssignments(organizationId),
    ),
    loadSection<CatalogCourses>('catalog-courses', [], () =>
      AdminCoursesService.getAllCourses(),
    ),
    loadSection<OrganizationLpAssignments>('org-learning-paths', [], () =>
      AdminLearningPathsService.listOrganizationAssignments(organizationId, learningPaths),
    ),
    loadSection<UserLpAssignments>('user-learning-paths', [], () =>
      AdminLearningPathsService.listUserAssignments(organizationId),
    ),
    loadSection('company-members', null, () =>
      AdminCompaniesService.getCompanyById(organizationId),
    ),
    loadSection<CourseDefaultRules>('course-defaults', [], () =>
      CourseDefaultsService.listDefaultRules(organizationId, { nodes: hierarchyNodes }),
    ),
    loadSection<LearningPathDefaultRules>('learning-path-defaults', [], () =>
      LearningPathDefaultsService.listDefaultRules(organizationId, {
        learningPaths,
        nodes: hierarchyNodes,
      }),
    ),
  ])

  return {
    companyCourses,
    userCourseAssignments,
    catalogCourses,
    learningPaths,
    organizationLearningPathAssignments,
    userLearningPathAssignments,
    members: company?.members ?? [],
    courseDefaults: { rules: courseDefaultRules, nodes: hierarchyNodes },
    learningPathDefaults: { rules: learningPathDefaultRules, nodes: hierarchyNodes },
    failedSections,
  }
}
