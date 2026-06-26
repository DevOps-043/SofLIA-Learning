export const FALLBACK_TEXT_EN = {
  // Section titles
  learningTitle: 'Learning and completion',
  adoptionTitle: 'AI and notes adoption',
  qualityTitle: 'Operational quality and assessments',

  // Metric labels
  metricProgress: 'Progress and closure',
  metricSoflia: 'SofLIA adoption',
  metricQuality: 'Operational quality',
  metricAtRisk: 'At-risk users',
  metricActiveLearners: 'Active learners',
  metricCompliance: 'Org. compliance',

  // Action plan section titles
  actionPlanTitle: 'Immediate priorities',
  actionPlanAtRiskTitle: 'Recovery and study habits',

  // Empty / no data messages
  noHierarchy: 'There is not enough hierarchy data to compare regions, zones, or areas.',
  noRiskCourse: 'No course shows critical risk signals in the filtered period.',
  noSegment: 'There are not enough segments to compare quality for this period.',
  noAgeBandData: 'The age band data does not have enough information for this period.',

  // Recommendations (5)
  recommendSoflia: 'Increase SofLIA adoption in lower-adoption segments and cross-reference it with course progress.',
  recommendHierarchy: 'Use the regional, zone, and area leaderboard to identify and replicate the practices of top-scoring teams.',
  recommendQuality: 'Review low-quality activities with high help usage to adjust instructions, examples, and evaluation criteria.',
  recommendPlanner: 'Enable session reminders for learners with low study planner adherence.',
  recommendInactive: 'Directly contact learners with no recent activity using a personalized re-engagement message.',

  // Action plan items
  actionPlanSegment: 'Prioritize segments with low quality or low progress before expanding new assignments.',
  actionPlanCourse: 'Review the highest-risk courses and cross-check progress, overdue work, and help requests.',
  actionPlanData: 'Complete missing demographic data to improve HR statistical precision.',
  actionPlanAtRiskUsers: 'Assign personalized follow-up to each learner identified as high or medium risk.',
  actionPlanPlannerLow: 'Run study planner onboarding sessions with the lowest-adherence teams.',

  // Summary — richer, no "Automatic read" framing
  summary: (quality: number, progress: number, atRisk: number, compliance: number) =>
    `The organization records an average progress of ${progress}% with a compliance rate of ${compliance}%. Operational quality reaches ${quality}%${atRisk > 0 ? ` and ${atRisk} learners are at risk and require priority attention` : ''}.`,

  // Metric detail functions
  metricProgressDetail: (completion: number, days: number) =>
    `Completion ${completion}% and median closure ${days} days.`,
  metricSofliaDetail: (conversations: number, messages: number) =>
    `${conversations} conversations and ${messages} messages analyzed.`,
  metricQualityDetail: (quiz: number, activity: number, soflia: number) =>
    `Assessments ${quiz}%, activities ${activity}%, and SofLIA ${soflia}%.`,
  metricAtRiskDetail: (count: number, rate: number) =>
    `${count} learners (${rate}%) with overdue work, inactivity, or critical progress.`,
  metricActiveLearnerDetail: (count: number, rate: number) =>
    `${count} active learners represent ${rate}% of assigned users.`,
  metricComplianceDetail: (rate: number) =>
    `${rate}% of assigned users show no risk signals in the analyzed period.`,

  // Finding point functions
  learningPoint: (completion: number, days: number) =>
    `Overall completion is ${completion}% and average closing time is ${days} days.`,
  riskCourse: (title: string, overdue: number) =>
    `"${title}" concentrates operational risk with ${overdue} accumulated overdue assignments.`,
  adoptionPoint: (soflia: number, notes: number) =>
    `SofLIA adoption is ${soflia}% and notes adoption is ${notes}%.`,
  bestRegion: (name: string, score: number) =>
    `${name} leads the regional ranking with a ${score}% score.`,
  qualityPoint: (quality: number, offTopic: number) =>
    `Quality score is ${quality}% and the off-topic response rate is ${offTopic}%.`,
  segmentPoint: (label: string, score: number) =>
    `The "${label}" age band shows a quality score of ${score}% and needs review.`,

  // Risk functions (5)
  riskQuality: (help: number) =>
    `${help}% of users request activity help, which may indicate unclear instructions or poorly calibrated evaluation criteria.`,
  riskData: (completion: number) =>
    `Only ${completion}% of demographic profiles are complete. Missing data reduces segment-level analytical precision.`,
  riskInactive: (count: number) =>
    `${count} assigned learners have not recorded any activity in the last 14 days and are at risk of dropping out.`,
  riskOverdue: (count: number) =>
    `${count} overdue assignments accumulated in the period, with potential compliance implications.`,
  riskLowPlanner: (rate: number) =>
    `Study planner adherence is ${rate}%, below the recommended threshold of 60%.`,

  // Urgent action text
  urgentAtRiskTitle: 'At-risk learners without active follow-up',
  urgentAtRiskDesc: (count: number) =>
    `${count} learners show overdue work, prolonged inactivity, or critical progress. They need a recovery plan and direct contact within the next few days.`,
  urgentAtRiskTimeline: '1-2 days',
  urgentOverdueTitle: 'Unresolved accumulated overdue assignments',
  urgentOverdueDesc: (count: number) =>
    `${count} overdue assignments detected in the period. Prioritize contact with area leads to agree on recovery timelines.`,
  urgentOverdueTimeline: '3-5 days',

  // Segment highlight text
  bestRegionHighlight: (name: string, score: number) =>
    `${name} leads the regional ranking with ${score}% score. Document its practices as a model for the rest of the organization.`,
  worstRegionHighlight: (name: string, score: number) =>
    `${name} has the lowest regional score (${score}%). Specialized support and workload review are recommended.`,
  bestTeamHighlight: (name: string, score: number) =>
    `Team "${name}" is the top-ranked team with ${score}% score and can serve as an internal best-practice reference.`,
  worstTeamHighlight: (name: string, score: number) =>
    `Team "${name}" records the lowest score (${score}%) and requires direct intervention from the area lead.`,

  // Kudos text
  kudoCompletionTitle: 'Outstanding completion rate',
  kudoCompletionDesc: (rate: number) =>
    `With a completion rate of ${rate}%, the organization exceeds the healthy threshold of 70%. This is an achievement worth recognizing with the teams.`,
  kudoQualityTitle: 'Solid operational quality',
  kudoQualityDesc: (score: number) =>
    `A quality score of ${score}% reflects genuine commitment to learning and rigorous evaluation across the organization.`,
  kudoAdoptionTitle: 'High SofLIA adoption',
  kudoAdoptionDesc: (rate: number) =>
    `${rate}% SofLIA adoption shows that learners are actively using AI to reinforce and deepen their learning.`,
}
