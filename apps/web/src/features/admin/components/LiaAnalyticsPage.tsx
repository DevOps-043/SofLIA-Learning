"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ArrowPathIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  CpuChipIcon,
  LightBulbIcon,
} from "@heroicons/react/24/outline";
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

const PERIOD_OPTIONS: { value: PeriodType; label: string }[] = [
  { value: "day", label: "Hoy" },
  { value: "week", label: "Última semana" },
  { value: "month", label: "Último mes" },
  { value: "year", label: "Último año" },
];

export function LiaAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodType>("month");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [chartType, setChartType] = useState<"area" | "bar">("area");
  const [provider, setProvider] = useState<"openai" | "gemini">("openai");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Agregar timestamp para evitar cache y forzar datos frescos
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

    // Crear CSV con los datos de costos por período
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
    <div className="p-6 max-w-[1800px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="p-2 bg-indigo-500/20 rounded-xl">
                <CpuChipIcon className="w-8 h-8 text-indigo-500" />
              </div>
              SofLIA Analytics Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Monitorea el uso, costos y rendimiento del asistente de IA
            </p>
            {lastUpdated && (
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Última actualización: {lastUpdated.toLocaleTimeString("es-ES")}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Selector de Proveedor */}
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 flex items-center justify-center pointer-events-none">
                {provider === "openai" ? (
                  <span className="text-lg">🤖</span> // Icono temporal para OpenAI
                ) : (
                  <span className="text-lg">✨</span> // Icono temporal para Gemini
                )}
              </div>
              <select
                value={provider}
                onChange={(e) =>
                  setProvider(e.target.value as "openai" | "gemini")
                }
                className="pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none cursor-pointer min-w-[140px]"
              >
                <option value="openai">OpenAI</option>
                <option value="gemini">Gemini</option>
              </select>
            </div>

            {/* Selector de período */}
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as PeriodType)}
                className="pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none cursor-pointer"
              >
                {PERIOD_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Tipo de gráfico */}
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
              <button
                onClick={() => setChartType("area")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  chartType === "area"
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                Área
              </button>
              <button
                onClick={() => setChartType("bar")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  chartType === "bar"
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                Barras
              </button>
            </div>

            {/* Botones de acción */}
            <button
              onClick={fetchData}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl transition-colors"
            >
              <ArrowPathIcon
                className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">Actualizar</span>
            </button>

            <button
              onClick={handleExportCSV}
              disabled={!data}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
              <span className="hidden sm:inline">Exportar CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-8">
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
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
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

      {/* Course Analytics Row */}
      <div className="mb-8">
        <CourseAnalyticsWidget period={period} isLoading={isLoading} />
      </div>

      {/* Secondary Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <TokenUsageWidget
          modelUsage={data?.modelUsage || []}
          totalTokens={data?.summary.totalTokens || 0}
          isLoading={isLoading}
        />
        <ActivityHeatmapWidget period={period} isLoading={isLoading} />
      </div>

      {/* Third Row - Top Questions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <TopQuestionsWidget period={period} limit={8} isLoading={isLoading} />
        <div className="lg:col-span-1">
          <TopUsersWidget period={period} limit={8} isLoading={isLoading} />
        </div>
      </div>

      {/* Fourth Row - Conversations Table */}
      <div className="mb-8">
        <ConversationsTableWidget period={period} />
      </div>

      {/* Info Footer */}
      <div className="mt-8 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-lg flex-shrink-0">
            <LightBulbIcon className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <h4 className="font-medium text-indigo-900 dark:text-indigo-300">
              Información sobre costos
            </h4>
            <p className="text-sm text-indigo-700 dark:text-indigo-400 mt-1">
              Los costos se calculan en tiempo real basados en las tarifas
              oficiales del modelo utilizado (OpenAI GPT-4o-mini o Google Gemini
              Flash) por cada millón de tokens. La proyección mensual se basa en
              el promedio diario del período seleccionado.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
