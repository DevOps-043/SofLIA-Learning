'use client';

import { logger as techDebtLogger } from '@/lib/utils/logger'
import { useState, useEffect, useMemo } from 'react';
import { FireIcon } from '@heroicons/react/24/outline';
import { HeatmapDetailModal } from './HeatmapDetailModal';

interface HeatmapData {
  dayOfWeek: number; // 0-6 (Domingo-Sábado)
  hour: number; // 0-23
  count: number;
  avgResponseTime?: number;
}

interface ActivityHeatmapWidgetProps {
  period?: string;
  isLoading?: boolean;
}

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function ActivityHeatmapWidget({ period = 'month', isLoading: externalLoading }: ActivityHeatmapWidgetProps) {
  const [data, setData] = useState<HeatmapData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredCell, setHoveredCell] = useState<{ day: number; hour: number } | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ day: number; hour: number } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [totalMessages, setTotalMessages] = useState(0);
  const [peakHour, setPeakHour] = useState<{ day: string; hour: string; count: number } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/admin/lia-analytics/heatmap?period=${period}`);
        const result = await response.json();

        if (result.success) {
          setData(result.data.heatmap);
          setTotalMessages(result.data.totalMessages);
          setPeakHour(result.data.peakHour);
        }
      } catch (error) {
        techDebtLogger.error('Error fetching heatmap data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [period]);

  // Crear matriz de datos para el heatmap
  const heatmapMatrix = useMemo(() => {
    const matrix: number[][] = Array(7).fill(null).map(() => Array(24).fill(0));
    let maxCount = 0;

    data.forEach(item => {
      matrix[item.dayOfWeek][item.hour] = item.count;
      if (item.count > maxCount) maxCount = item.count;
    });

    return { matrix, maxCount };
  }, [data]);

  // Función para obtener el color basado en la intensidad
  const getColor = (count: number, maxCount: number) => {
    if (count === 0) return 'bg-gray-100 dark:bg-gray-800';
    
    const intensity = count / maxCount;
    
    if (intensity < 0.2) return 'bg-emerald-100 dark:bg-emerald-900/30';
    if (intensity < 0.4) return 'bg-emerald-200 dark:bg-emerald-800/40';
    if (intensity < 0.6) return 'bg-emerald-300 dark:bg-emerald-700/50';
    if (intensity < 0.8) return 'bg-emerald-400 dark:bg-emerald-600/60';
    return 'bg-emerald-500 dark:bg-emerald-500';
  };

  // Obtener datos de una celda específica
  const getCellData = (day: number, hour: number) => {
    return data.find(d => d.dayOfWeek === day && d.hour === hour);
  };

  if (isLoading || externalLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <FireIcon className="w-5 h-5 text-orange-500" />
            Mapa de Actividad
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {totalMessages.toLocaleString()} mensajes en el período
          </p>
        </div>
        {peakHour && (
          <div className="text-right">
            <p className="text-xs text-gray-500 dark:text-gray-400">Hora pico</p>
            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              {peakHour.day} {peakHour.hour}
            </p>
            <p className="text-xs text-gray-500">{peakHour.count} msgs</p>
          </div>
        )}
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Hours header */}
          <div className="flex mb-1">
            <div className="w-10 flex-shrink-0"></div>
            <div className="flex-1 flex">
              {HOURS.filter((_, i) => i % 3 === 0).map(hour => (
                <div 
                  key={hour} 
                  className="flex-1 text-center text-xs text-gray-500 dark:text-gray-400"
                  style={{ minWidth: '24px' }}
                >
                  {hour}h
                </div>
              ))}
            </div>
          </div>

          {/* Grid rows */}
          {DAYS.map((day, dayIndex) => (
            <div key={day} className="flex items-center mb-1">
              <div className="w-10 flex-shrink-0 text-xs text-gray-500 dark:text-gray-400 pr-2 text-right">
                {day}
              </div>
              <div className="flex-1 flex gap-1">
                {HOURS.map(hour => {
                  const count = heatmapMatrix.matrix[dayIndex][hour];
                  const isHovered = hoveredCell?.day === dayIndex && hoveredCell?.hour === hour;
                  
                  return (
                    <div
                      key={hour}
                      className={`
                        w-4 h-4 sm:w-5 sm:h-5 rounded-sm cursor-pointer transition-all duration-150
                        ${getColor(count, heatmapMatrix.maxCount)}
                        ${isHovered ? 'ring-2 ring-emerald-500 ring-offset-1 dark:ring-offset-gray-800 scale-125 z-10' : ''}
                      `}
                      onMouseEnter={() => setHoveredCell({ day: dayIndex, hour })}
                      onMouseLeave={() => setHoveredCell(null)}
                      onClick={() => {
                        setSelectedCell({ day: dayIndex, hour });
                        setIsModalOpen(true);
                      }}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip */}
      {hoveredCell && (
        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {DAYS[hoveredCell.day]} a las {hoveredCell.hour}:00
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {heatmapMatrix.matrix[hoveredCell.day][hoveredCell.hour]} mensajes
              </p>
            </div>
            {getCellData(hoveredCell.day, hoveredCell.hour)?.avgResponseTime && (
              <div className="text-right">
                <p className="text-xs text-gray-500">Tiempo promedio</p>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  {Math.round(getCellData(hoveredCell.day, hoveredCell.hour)?.avgResponseTime || 0)}ms
                </p>
              </div>
            )}
          </div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">
            💡 Haz clic para ver detalles
          </p>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-between mt-4">
        <p className="text-xs text-gray-400 italic">Clic en celda = ver detalles</p>
        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
          <span>Menos</span>
          <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800"></div>
          <div className="w-3 h-3 rounded-sm bg-emerald-100 dark:bg-emerald-900/30"></div>
          <div className="w-3 h-3 rounded-sm bg-emerald-200 dark:bg-emerald-800/40"></div>
          <div className="w-3 h-3 rounded-sm bg-emerald-300 dark:bg-emerald-700/50"></div>
          <div className="w-3 h-3 rounded-sm bg-emerald-400 dark:bg-emerald-600/60"></div>
          <div className="w-3 h-3 rounded-sm bg-emerald-500 dark:bg-emerald-500"></div>
          <span>Más</span>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedCell && (
        <HeatmapDetailModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedCell(null);
          }}
          dayOfWeek={selectedCell.day}
          hour={selectedCell.hour}
          period={period}
        />
      )}
    </div>
  );
}
