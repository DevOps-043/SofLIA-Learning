import { Lightbulb } from 'lucide-react';
import { buildCourseManagementStudentInsight } from '../../CourseManagementStudentDetails.service';
import {
  COURSE_MANAGEMENT_INSIGHT_BANNER_CLASS,
  COURSE_MANAGEMENT_INSIGHT_ICON_CLASS,
  COURSE_MANAGEMENT_MUTED_TEXT_CLASS,
  COURSE_MANAGEMENT_PRIMARY_TEXT_CLASS,
} from '../../courseManagementTheme';
import type { StudentData } from './types';

export function InsightsBanner({ studySessions }: { studySessions: StudentData['studySessions'] }) {
  return (
    <div className={COURSE_MANAGEMENT_INSIGHT_BANNER_CLASS}>
      <div className="flex items-start gap-3">
        <div className={COURSE_MANAGEMENT_INSIGHT_ICON_CLASS}>
          <Lightbulb className="h-4 w-4 text-white" />
        </div>
        <div>
          <h5 className={`mb-1 text-sm font-bold ${COURSE_MANAGEMENT_PRIMARY_TEXT_CLASS}`}>Insights de SofLIA</h5>
          <p className={`text-xs leading-relaxed ${COURSE_MANAGEMENT_MUTED_TEXT_CLASS}`}>
            {buildCourseManagementStudentInsight(studySessions)}
          </p>
        </div>
      </div>
    </div>
  );
}
