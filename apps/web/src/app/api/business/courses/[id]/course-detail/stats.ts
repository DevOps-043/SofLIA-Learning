import type { ModuleWithLessons } from './types'

export function calculateCourseContentStats(modules: ModuleWithLessons[]) {
  return {
    totalModules: modules.length,
    totalLessons: modules.reduce(
      (sum, module) => sum + (module.lessons?.length || 0),
      0,
    ),
    totalDuration: modules.reduce(
      (sum, module) =>
        sum +
        (module.calculated_duration_minutes ||
          module.module_duration_minutes ||
          0),
      0,
    ),
  }
}
