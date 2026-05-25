import { activityCompletionsFixture } from "./activity-completions.fixture";
import {
  activityEvaluationsFixture,
  activitySubmissionsFixture,
  emptyActivityFixtures,
} from "./activity-submissions.fixture";
import { hierarchyFixture } from "./hierarchy.fixture";
import { assignmentsFixture, emptyLearningFixtures } from "./learning.fixture";
import { liaConversationsFixture, liaMessagesFixture } from "./lia.fixture";
import { organizationUsersFixture } from "./users.fixture";
import type { ReportsAnalyticsQueryData } from "./types";

export function buildReportsAnalyticsQueryData(): ReportsAnalyticsQueryData {
  return {
    ...hierarchyFixture,
    ...emptyActivityFixtures,
    ...emptyLearningFixtures,
    activityCompletions: activityCompletionsFixture,
    activityEvaluations: activityEvaluationsFixture,
    activitySubmissions: activitySubmissionsFixture,
    assignments: assignmentsFixture,
    liaConversations: liaConversationsFixture,
    liaMessages: liaMessagesFixture,
    organizationUsers: organizationUsersFixture,
  };
}
