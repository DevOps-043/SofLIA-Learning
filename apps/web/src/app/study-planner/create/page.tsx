'use client';

import React, { useState } from 'react';
import { StudyPlannerLIA } from '../../../features/study-planner/components/StudyPlannerLIA';
import { ComplianceDashboard } from '../../../features/study-planner-v3/components/ComplianceDashboard';
import { useFeatureFlags } from '../../../core/providers/FeatureFlagsProvider';

export default function CreateStudyPlanPage() {
  const { flags } = useFeatureFlags();
  const [showLegacyLia, setShowLegacyLia] = useState(false);

  return (
    <div className="min-h-screen" suppressHydrationWarning>
      {flags.planner_v3_ui && !showLegacyLia ? (
        <ComplianceDashboard onOpenLia={() => setShowLegacyLia(true)} />
      ) : (
        <StudyPlannerLIA onBack={() => setShowLegacyLia(false)} />
      )}
    </div>
  );
}
