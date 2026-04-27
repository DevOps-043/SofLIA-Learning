"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ArrowPathIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  CpuChipIcon,
  LightBulbIcon,
} from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import {
  LiaStatsCards,
  CostOverviewWidget,
  TokenUsageWidget,
  ContextDistributionWidget,
  TopUsersWidget,
  ConversationsTableWidget,
  ActivityHeatmapWidget,
  TopQuestionsWidget,
  CourseAnalyticsWidget,
} from "./LiaAnalyticsWidgets";
import { useAdminTheme } from "../hooks/useAdminTheme";
import {
  AdminButton,
  AdminPageShell,
  AdminSectionHeader,
  AdminSelect,
  AdminSurface,
  AdminTabs,
} from "./ui";

interface AnalyticsData {
  period: {
    start: string;
    end: string;
    type: string;
  };
  summary: {
    totalConversations: number;
    totalMessages: number;
    totalTokens: number;
    totalCostUsd: number;
    avgResponseTimeMs: number;
    completedActivities: number;
  };
  today: {
    cost: number;
    tokens: number;
    messages: number;
    costChange: number;
    activeUsers: number;
    usersChange: number;
  };
  efficiency: {
    avgMessagesPerConversation: number;
    avgCostPerMessage: number;
  };
  projections: {
    dailyAvg: number;
    monthlyEstimate: number;
  };
  costsByPeriod: Array<{
    date: string;
    cost: number;
    tokens: number;
    messages: number;
  }>;
  contextDistribution: Array<{
    contextType: string;
    count: number;
    cost: number;
    tokens: number;
    percentage: number;
  }>;
  modelUsage: Array<{
    model: string;
    tokens: number;
    cost: number;
    count: number;
    percentage: number;
  }>;
}

type PeriodType = "day" | "week" | "month" | "year";

export function LiaAnalyticsPage() {
  const { t } = useTranslation("admin");
  const theme = useAdminTheme();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodType>("month");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [chartType, setChartType] = useState<"area" | "bar">("area");
  const [provider, setProvider] = useState<"openai" | "gemini">("openai");

  const periodOptions: { value: PeriodType; label: string }[] = [
    { value: "day", label: t("liaAnalyticsPage.periods.day") },
    { value: "week", label: t("liaAnalyticsPage.periods.week") },
    { value: "month", label: t("liaAnalyticsPage.periods.month") },
    { value: "year", label: t("liaAnalyticsPage.periods.year") },
  ];

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const timestamp = Date.now();
      const response = await fetch(
        `/api/admin/lia-analytics?period=${period}&provider=${provider}&_t=${timestamp}`,
        {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
        }
      );
      const result = await response.json();

      if (result.success) {
        setData(result.data);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setIsLoading(false);
    }
  }, [period, provider]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExportCSV = () => {
    if (!data) return;

    const headers = ["Fecha", "Costo (USD)", "Tokens", "Mensajes"];
    const rows = data.costsByPeriod.map((item) => [
      item.date,
      item.cost.toFixed(6),
      item.tokens.toString(),
      item.messages.toString(),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `lia-analytics-${period}-${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AdminPageShell maxWidth="wide">
      <div className="space-y-7">
        <AdminSectionHeader
          size="page"
          icon={CpuChipIcon}
          kicker={t("navigation.liaAnalytics")}
          title={t("liaAnalyticsPage.title")}
          description={t("liaAnalyticsPage.description")}
          actions={(
            <>
              <AdminSelect
                value={provider}
                onChange={(event) => setProvider(event.target.value as "openai" | "gemini")}
                className="min-w-[140px]"
              >
                <option value="openai">OpenAI</option>
                <option value="gemini">Gemini</option>
              </AdminSelect>

              <div className="relative">
                <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: theme.textMuted }} />
                <AdminSelect
                  value={period}
                  onChange={(event) => setPeriod(event.target.value as PeriodType)}
                  className="min-w-[170px] pl-9"
                >
                  {periodOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </AdminSelect>
              </div>

              <AdminTabs
                value={chartType}
                onChange={setChartType}
                tabs={[
                  { value: "area", label: t("liaAnalyticsPage.chartArea") },
                  { value: "bar", label: t("liaAnalyticsPage.chartBars") },
                ]}
              />

              <AdminButton onClick={fetchData} disabled={isLoading} icon={ArrowPathIcon} variant="secondary">
                {t("liaAnalyticsPage.refresh")}
              </AdminButton>

              <AdminButton onClick={handleExportCSV} disabled={!data} icon={ArrowDownTrayIcon}>
                {t("liaAnalyticsPage.exportCsv")}
              </AdminButton>
            </>
          )}
        />

        {lastUpdated ? (
          <p className="text-xs" style={{ color: theme.textMuted }}>
            {t("liaAnalyticsPage.lastUpdated", { time: lastUpdated.toLocaleTimeString("es-ES") })}
          </p>
        ) : null}

        <LiaStatsCards
          summary={
            data?.summary || {
              totalConversations: 0,
              totalMessages: 0,
              totalTokens: 0,
              totalCostUsd: 0,
              avgResponseTimeMs: 0,
              completedActivities: 0,
            }
          }
          today={
            data?.today || {
              cost: 0,
              tokens: 0,
              messages: 0,
              costChange: 0,
              activeUsers: 0,
              usersChange: 0,
            }
          }
          efficiency={
            data?.efficiency || {
              avgMessagesPerConversation: 0,
              avgCostPerMessage: 0,
            }
          }
          projectedMonthlyCost={data?.projections.monthlyEstimate || 0}
          isLoading={isLoading}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <CostOverviewWidget
            data={data?.costsByPeriod || []}
            isLoading={isLoading}
            chartType={chartType}
          />
          <ContextDistributionWidget
            data={data?.contextDistribution || []}
            isLoading={isLoading}
          />
        </div>

        <CourseAnalyticsWidget period={period} isLoading={isLoading} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <TokenUsageWidget
            modelUsage={data?.modelUsage || []}
            totalTokens={data?.summary.totalTokens || 0}
            isLoading={isLoading}
          />
          <ActivityHeatmapWidget period={period} isLoading={isLoading} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <TopQuestionsWidget period={period} limit={8} isLoading={isLoading} />
          <TopUsersWidget period={period} limit={8} isLoading={isLoading} />
        </div>

        <ConversationsTableWidget period={period} />

        <AdminSurface className="p-4" style={{ backgroundColor: theme.actionSurface }}>
          <div className="flex items-start gap-3">
            <div className="rounded-lg p-2" style={{ backgroundColor: theme.surface, color: theme.action }}>
              <LightBulbIcon className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-medium" style={{ color: theme.text }}>
                {t("liaAnalyticsPage.costInfoTitle")}
              </h4>
              <p className="mt-1 text-sm" style={{ color: theme.textMuted }}>
                {t("liaAnalyticsPage.costInfoDescription")}
              </p>
            </div>
          </div>
        </AdminSurface>
      </div>
    </AdminPageShell>
  );
}
