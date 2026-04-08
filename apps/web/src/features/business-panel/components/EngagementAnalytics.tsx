import { motion } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Sector, RadialBarChart, RadialBar,
  ScatterChart, Scatter, ZAxis
} from 'recharts';
import { Users, Zap, Clock, Calendar, BarChart2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useBusinessPanelTheme } from '../hooks/useBusinessPanelTheme';
import type {
  BusinessAnalyticsData,
  BusinessAnalyticsEngagementMetrics,
  BusinessAnalyticsFrequencyPoint,
  BusinessAnalyticsStreakPoint,
} from '../types/analytics.types';

interface StickinessDatum {
  name: string;
  dau: number;
  mau: number;
  ratio: number;
}

type FrequencyDatum = BusinessAnalyticsFrequencyPoint;
type StreakDatum = BusinessAnalyticsStreakPoint;

interface HeatmapDatum {
  day: string;
  hour: string;
  value: number;
}

interface DurationDatum {
  role: string;
  median: number;
  max: number;
}

type EngagementMetrics = Partial<BusinessAnalyticsEngagementMetrics>;

interface EngagementAnalyticsProps {
  data?: Pick<BusinessAnalyticsData, 'engagement_metrics'>;
}

export function EngagementAnalytics({ data }: EngagementAnalyticsProps) {
  const { t } = useTranslation('business');
  const panelTheme = useBusinessPanelTheme();
  // Extraer métricas reales o usar fallbacks vacíos
  const metrics: EngagementMetrics = data?.engagement_metrics || {};
  
  const stickinessData = metrics.stickiness || [];
  const frequencyData = metrics.frequency || [];
  const streaksData = metrics.streaks || [];
  const heatmapData = metrics.heatmap || [];
  const durationData = metrics.duration || [];

  const hasStickiness = stickinessData.length > 0;
  const hasFrequency = frequencyData.length > 0;
  // Streaks siempre tiene datos (0,0,0) o valores reales
  const hasHeatmap = heatmapData.length > 0;
  const hasDuration = durationData.length > 0;

  // Colores del tema
  const colors = {
    primary: panelTheme.actionColor,
    secondary: panelTheme.accentColor,
    tertiary: panelTheme.secondaryColor,
    quaternary: panelTheme.warningColor,
    grid: panelTheme.dividerColor,
    text: panelTheme.subtextColor
  };

  const surfaceStyle = {
    backgroundColor: panelTheme.cardBg,
    borderColor: panelTheme.borderColor,
  };

  const tooltipStyle = {
    backgroundColor: panelTheme.panelBg,
    borderRadius: '12px',
    border: `1px solid ${panelTheme.borderColor}`,
    boxShadow: '0 12px 28px rgba(0,0,0,0.18)',
    color: panelTheme.textColor,
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center space-x-3 mb-6">
        <div
          className="p-2 rounded-xl border"
          style={{
            backgroundColor: panelTheme.actionSurface,
            borderColor: `${panelTheme.actionColor}24`,
          }}
        >
          <Zap className="w-6 h-6" style={{ color: panelTheme.actionColor }} />
        </div>
        <div>
          <h2 className="text-xl font-bold" style={{ color: panelTheme.textColor }}>{t('analytics.engagement.title')}</h2>
          <p className="text-sm" style={{ color: panelTheme.subtextColor }}>{t('analytics.engagement.subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. DAU/WAU/MAU + Stickiness */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="p-6 rounded-3xl shadow-sm border"
          style={surfaceStyle}
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center" style={{ color: panelTheme.textColor }}>
            <Users className="w-5 h-5 mr-2" style={{ color: panelTheme.actionColor }} />
            {t('analytics.engagement.stickiness.title')}
          </h3>
          <div className="h-[300px]">
            {hasStickiness ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stickinessData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.grid} />
                  <XAxis dataKey="name" stroke={colors.text} fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" stroke={colors.text} fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="right" orientation="right" stroke={colors.text} fontSize={12} tickLine={false} axisLine={false} unit="%" />
                  <Tooltip 
                    contentStyle={tooltipStyle}
                    labelStyle={{ color: panelTheme.textColor, fontWeight: 'bold' }}
                  />
                  <Line yAxisId="left" type="monotone" dataKey="dau" name={t('analytics.engagement.stickiness.dau')} stroke={colors.primary} strokeWidth={3} dot={{ r: 4, fill: colors.primary }} activeDot={{ r: 6 }} />
                  <Line yAxisId="left" type="monotone" dataKey="mau" name={t('analytics.engagement.stickiness.mau')} stroke={colors.secondary} strokeWidth={3} dot={{ r: 4, fill: colors.secondary }} />
                  <Line yAxisId="right" type="monotone" dataKey="ratio" name={t('analytics.engagement.stickiness.ratio')} stroke={colors.quaternary} strokeWidth={2} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
                <div className="flex items-center justify-center h-full text-sm" style={{ color: panelTheme.subtextColor }}>
                    {t('analytics.engagement.stickiness.noData')}
                </div>
            )}
          </div>
        </motion.div>

        {/* 2. Distribución de Frecuencia */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="p-6 rounded-3xl shadow-sm border"
          style={surfaceStyle}
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center" style={{ color: panelTheme.textColor }}>
            <Calendar className="w-5 h-5 mr-2" style={{ color: panelTheme.actionColor }} />
            {t('analytics.engagement.frequency.title')}
          </h3>
          <div className="h-[300px]">
            {hasFrequency ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={frequencyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.grid} />
                  <XAxis dataKey="name" stroke={colors.text} fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke={colors.text} fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={tooltipStyle}
                  />
                  <Bar dataKey="users" name={t('analytics.engagement.frequency.users')} fill={colors.secondary} radius={[6, 6, 0, 0]} barSize={40}>
                    {frequencyData.map((entry: FrequencyDatum, index: number) => (
                      <Cell key={`cell-${index}`} fill={[colors.primary, colors.secondary, colors.tertiary, colors.quaternary][index % 4]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
                <div className="flex items-center justify-center h-full text-sm" style={{ color: panelTheme.subtextColor }}>
                    {t('analytics.engagement.frequency.noData')}
                </div>
            )}
          </div>
        </motion.div>

        {/* 3. Streaks (Rachas) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="p-6 rounded-3xl shadow-sm border"
          style={surfaceStyle}
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center" style={{ color: panelTheme.textColor }}>
            <Zap className="w-5 h-5 mr-2" style={{ color: panelTheme.warningColor }} />
            {t('analytics.engagement.streaks.title')}
          </h3>
          <div className="flex flex-col md:flex-row items-center justify-between h-[300px]">
            <div className="w-full md:w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={streaksData as unknown as Array<Record<string, string | number>>}
                    nameKey="name"
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                  >
                    {streaksData.map((entry: StreakDatum, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full md:w-1/2 flex flex-col justify-center space-y-4 pl-4">
              {streaksData.map((item: StreakDatum, index: number) => (
                <div key={index} className="flex items-center">
                  <div className="w-4 h-4 rounded-full mr-3" style={{ backgroundColor: item.fill }}></div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: panelTheme.subtextColor }}>{item.name} {t('analytics.engagement.streaks.inARow')}</p>
                    <p className="text-xl font-bold" style={{ color: panelTheme.textColor }}>{item.value}% <span className="text-xs font-normal" style={{ color: panelTheme.mutedTextColor }}>{t('analytics.engagement.streaks.users')}</span></p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* 4. Heatmap Día/Hora */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="p-6 rounded-3xl shadow-sm border"
          style={surfaceStyle}
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center" style={{ color: panelTheme.textColor }}>
            <Clock className="w-5 h-5 mr-2" style={{ color: panelTheme.actionColor }} />
            {t('analytics.engagement.heatmap.title')}
          </h3>
          <div className="h-[300px]">
             {hasHeatmap ? (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                  <XAxis dataKey="day" type="category" name={t('analytics.engagement.heatmap.day')} stroke={colors.text} interval={0} />
                  <YAxis dataKey="hour" type="category" name={t('analytics.engagement.heatmap.hour')} stroke={colors.text} reversed />
                  <ZAxis dataKey="value" range={[50, 400]} name={t('analytics.engagement.heatmap.activity')} />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }} 
                    contentStyle={tooltipStyle}
                  />
                  <Scatter name={t('analytics.engagement.heatmap.activity')} data={heatmapData} fill={colors.primary} />
                </ScatterChart>
              </ResponsiveContainer>
             ) : (
                <div className="flex items-center justify-center h-full text-sm" style={{ color: panelTheme.subtextColor }}>
                    {t('analytics.engagement.heatmap.noData')}
                </div>
             )}
          </div>
        </motion.div>
      </div>

      {/* 5. Duración por Sesión (Boxplot simplificado con BarChart) */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="p-6 rounded-3xl shadow-sm border"
        style={surfaceStyle}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold flex items-center" style={{ color: panelTheme.textColor }}>
            <BarChart2 className="w-5 h-5 mr-2" style={{ color: panelTheme.actionColor }} />
            {t('analytics.engagement.duration.title')}
          </h3>
        </div>
        
        <div className="h-[300px]">
          {hasDuration ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={durationData} layout="vertical" barGap={0} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={true} stroke={colors.grid} />
                <XAxis type="number" unit=" min" stroke={colors.text} />
                <YAxis dataKey="role" type="category" stroke={colors.text} width={100} />
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  contentStyle={tooltipStyle}
                />
                <Bar dataKey="median" name={t('analytics.engagement.duration.median')} fill={colors.primary} radius={[0, 4, 4, 0]} />
                <Bar dataKey="max" name={t('analytics.engagement.duration.max')} fill={colors.text} opacity={0.3} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
             <div className="flex items-center justify-center h-full text-sm" style={{ color: panelTheme.subtextColor }}>
                {t('analytics.engagement.duration.noData')}
            </div>
          )}
        </div>
        <p className="text-xs text-center mt-2" style={{ color: panelTheme.subtextColor }}>
          {t('analytics.engagement.duration.note')}
        </p>
      </motion.div>
    </div>
  );
}
