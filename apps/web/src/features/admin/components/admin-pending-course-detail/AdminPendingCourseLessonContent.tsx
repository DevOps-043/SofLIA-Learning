import type { PendingCourseModule } from "./types";
import { PendingCourseModuleCard } from "./lesson-content/PendingCourseModuleCard";

export function AdminPendingCourseLessonContent({ modules }: { modules?: PendingCourseModule[] }) {
  return (
    <div className="mb-8 space-y-4">
      {modules?.map((module) => (
        <PendingCourseModuleCard key={module.module_id} module={module} />
      ))}
    </div>
  );
}
