import type { buildReportsAnalyticsDataset } from "../../reports-analytics.server.service";

export type ReportsAnalyticsQueryData = Parameters<typeof buildReportsAnalyticsDataset>[0];
