import 'server-only'

import { AdminCompaniesService } from '../adminCompanies.service'
import { AdminCoursesService } from '../adminCourses.service'
import { listAssignmentsForLearningPath } from './assignment-overview.service'
import { getLearningPathById } from './learning-paths.query'

/**
 * Bootstrap agregado de la página de gestión de un learning path (admin).
 *
 * Antes el cliente disparaba 4 GETs paralelos (ruta, catálogo de cursos,
 * empresas y asignaciones); cada uno pagaba middleware + requireAdmin +
 * invocación serverless por separado. Aquí se resuelven en una sola
 * invocación con las mismas queries en paralelo.
 *
 * Contrato all-or-nothing: la página no puede renderizarse sin cualquiera de
 * estas secciones (mismo comportamiento que tenía el cliente, que abortaba
 * ante el primer fallo), así que los errores burbujean al route handler.
 */

type LearningPathDetail = Awaited<ReturnType<typeof getLearningPathById>>
type CatalogCourses = Awaited<ReturnType<typeof AdminCoursesService.getAllCourses>>
type Companies = Awaited<ReturnType<typeof AdminCompaniesService.getCompanies>>
type AssignmentOverview = Awaited<ReturnType<typeof listAssignmentsForLearningPath>>

export interface LearningPathManagementBootstrap {
  learningPath: LearningPathDetail
  courses: CatalogCourses
  companies: Companies
  assignments: AssignmentOverview
}

export async function getLearningPathManagementBootstrap(
  learningPathId: string,
): Promise<LearningPathManagementBootstrap> {
  const [learningPath, courses, companies, assignments] = await Promise.all([
    getLearningPathById(learningPathId),
    AdminCoursesService.getAllCourses(),
    AdminCompaniesService.getCompanies(),
    listAssignmentsForLearningPath(learningPathId),
  ])

  return { learningPath, courses, companies, assignments }
}
