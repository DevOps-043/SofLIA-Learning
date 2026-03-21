import React from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Sector, RadialBarChart, RadialBar,
  ScatterChart, Scatter, ZAxis
} from 'recharts';
import { Users, Zap, Clock, Calendar, BarChart2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface EngagementAnalyticsProps {
  data?: any;
}

export function EngagementAnalytics({ data }: EngagementAnalyticsProps) {
  const { t } = useTranslation('business');
  // Extraer métricas reales o usar fallbacks vacíos
  const metrics = data?.engagement_metrics || {};
  
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
    primary: '#00D4B3',
    secondary: '#3B82F6',
    tertiary: '#8B5CF6',
    quaternary: '#F59E0B',
    grid: '#e5e7eb',
    text: '#6b7280'
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-[#00D4B3]/10 rounded-lg">
          <Zap className="w-6 h-6 text-[#00D4B3]" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#0A2540] dark:text-white">{t('analytics.engagement.title')}</h2>
          <p className="text-sm text-[#6C757D] dark:text-gray-400">{t('analytics.engagement.subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. DAU/WAU/MAU + Stickiness */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-[#1E2329] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800"
        >
          <h3 className="text-lg font-semibold text-[#0A2540] dark:text-white mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2 text-[#00D4B3]" />
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
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    labelStyle={{ color: '#0A2540', fontWeight: 'bold' }}
                  />
                  <Line yAxisId="left" type="monotone" dataKey="dau" name={t('analytics.engagement.stickiness.dau')} stroke={colors.primary} strokeWidth={3} dot={{ r: 4, fill: colors.primary }} activeDot={{ r: 6 }} />
                  <Line yAxisId="left" type="monotone" dataKey="mau" name={t('analytics.engagement.stickiness.mau')} stroke={colors.secondary} strokeWidth={3} dot={{ r: 4, fill: colors.secondary }} />
                  <Line yAxisId="right" type="monotone" dataKey="ratio" name={t('analytics.engagement.stickiness.ratio')} stroke={colors.quaternary} strokeWidth={2} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">
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
          className="bg-white dark:bg-[#1E2329] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800"
        >
          <h3 className="text-lg font-semibold text-[#0A2540] dark:text-white mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-[#3B82F6]" />
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
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="users" name={t('analytics.engagement.frequency.users')} fill={colors.secondary} radius={[6, 6, 0, 0]} barSize={40}>
                    {frequencyData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={[colors.primary, colors.secondary, colors.tertiary, colors.quaternary][index % 4]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">
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
          className="bg-white dark:bg-[#1E2329] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800"
        >
          <h3 className="text-lg font-semibold text-[#0A2540] dark:text-white mb-4 flex items-center">
            <Zap className="w-5 h-5 mr-2 text-[#F59E0B]" />
            {t('analytics.engagement.streaks.title')}
          </h3>
          <div className="flex flex-col md:flex-row items-center justify-between h-[300px]">
            <div className="w-full md:w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={streaksData}
                    nameKey="name"
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                  >
                    {streaksData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full md:w-1/2 flex flex-col justify-center space-y-4 pl-4">
              {streaksData.map((item: any, index: number) => (
                <div key={index} className="flex items-center">
                  <div className="w-4 h-4 rounded-full mr-3" style={{ backgroundColor: item.fill }}></div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{item.name} {t('analytics.engagement.streaks.inARow')}</p>
                    <p className="text-xl font-bold text-[#0A2540] dark:text-white">{item.value}% <span className="text-xs font-normal text-gray-400">{t('analytics.engagement.streaks.users')}</span></p>
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
          className="bg-white dark:bg-[#1E2329] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800"
        >
          <h3 className="text-lg font-semibold text-[#0A2540] dark:text-white mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-[#8B5CF6]" />
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
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Scatter name={t('analytics.engagement.heatmap.activity')} data={heatmapData} fill={colors.primary} />
                </ScatterChart>
              </ResponsiveContainer>
             ) : (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">
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
        className="bg-white dark:bg-[#1E2329] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-[#0A2540] dark:text-white flex items-center">
            <BarChart2 className="w-5 h-5 mr-2 text-rose-500" />
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
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="median" name={t('analytics.engagement.duration.median')} fill={colors.primary} radius={[0, 4, 4, 0]} />
                <Bar dataKey="max" name={t('analytics.engagement.duration.max')} fill={colors.text} opacity={0.3} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
             <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                {t('analytics.engagement.duration.noData')}
            </div>
          )}
        </div>
        <p className="text-xs text-center text-gray-500 mt-2">
          {t('analytics.engagement.duration.note')}
        </p>
      </motion.div>
    </div>
  );
}
