import type { Dispatch, SetStateAction } from 'react';
import type { StudyPlannerDashboardState } from './useStudyPlannerDashboardSofLIA';

export function refreshSofLIAPlanAfterAction(
  planQuery: string,
  setState: Dispatch<SetStateAction<StudyPlannerDashboardState>>,
) {
  setTimeout(() => {
    fetch(`/api/study-planner/dashboard/plan${planQuery}`)
      .then(response => response.json())
      .then(planData => {
        if (planData.success && planData.data) {
          setState(prev => ({ ...prev, activePlan: planData.data }));
        }
      })
      .catch(err => console.error('Error recargando plan:', err));
  }, 500);
}
