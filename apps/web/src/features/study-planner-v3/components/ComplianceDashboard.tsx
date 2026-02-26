'use client';

import React from 'react';
import useSWR from 'swr';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Fetch failed');
  return json;
};

export function ComplianceDashboard({ onOpenLia }: { onOpenLia?: () => void }) {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  
  const { data, error, isLoading } = useSWR('/api/planner/v3/dashboard', fetcher);

  const stats = data?.stats || { on_track: 0, due_soon: 0, overdue: 0, completed: 0, waived: 0 };
  const obligations = data?.data || [];

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen">
      <header className="mb-8 flex items-start sm:items-center gap-4">
        <button
          onClick={() => {
            const orgSlug = user?.organization?.slug || params?.orgSlug;
            if (orgSlug) {
              router.push(`/${orgSlug}/business-user/dashboard`);
            } else {
              router.back();
            }
          }}
          className="p-2 mt-1 sm:mt-0 rounded-full text-gray-500 hover:text-purple-600 hover:bg-purple-50 dark:text-gray-400 dark:hover:text-purple-400 dark:hover:bg-slate-800 transition-colors shrink-0"
          title="Volver al panel"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Panel de Cumplimiento B2B (V3)
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Visualiza tus obligaciones de aprendizaje de acuerdo a las políticas inmutables de tu organización.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Principal - Obligaciones */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/50">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Mis Obligaciones Activas</h2>
            
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mb-4"></div>
                <p>Calculando estado de cumplimiento...</p>
              </div>
            ) : error ? (
              <div className="p-4 bg-red-50 text-red-600 rounded-lg">
                Error al cargar el panel de cumplimiento: {error?.message || 'Error desconocido'}. Por favor, intenta de nuevo.
              </div>
            ) : obligations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-center max-w-sm">Estás al día. No tienes obligaciones pendientes asignadas bajo la nueva política del Motor V3.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {obligations.map((obl: any) => (
                  <div key={obl.id} className="p-4 rounded-xl border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{obl.courseTitle}</h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                        <span>Límite (Hard Due Date): {new Date(obl.hardDueDate).toLocaleDateString()}</span>
                        {obl.daysUntilDue !== null && (
                          <span className="bg-gray-200 dark:bg-slate-700 px-2 py-0.5 rounded text-xs">
                            {obl.daysUntilDue > 0 ? `Faltan ${obl.daysUntilDue} días` : `Venció hace ${Math.abs(obl.daysUntilDue)} días`}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center justify-end">
                      {obl.complianceState === 'completed' && <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">Completado</span>}
                      {obl.complianceState === 'waived' && <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-200 text-gray-700">Exento</span>}
                      {obl.complianceState === 'on_track' && <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">En plazo</span>}
                      {obl.complianceState === 'due_soon' && <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-700">Por vencer</span>}
                      {obl.complianceState === 'overdue' && <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700">Incumplimiento (Vencido)</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Estadísticas */}
        <div className="space-y-6">
          <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700/50">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Estado General de SLA</h3>
            <div className="space-y-4 mt-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400 text-sm">Al día (On Track)</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">{stats.on_track}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400 text-sm">Próximo a Vencer (Due Soon)</span>
                <span className="font-semibold text-yellow-600 dark:text-yellow-400">{stats.due_soon}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400 text-sm">Vencido (Overdue)</span>
                <span className="font-semibold text-red-600 dark:text-red-400">{stats.overdue}</span>
              </div>
              <div className="pt-4 mt-4 border-t border-gray-100 dark:border-slate-700 flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400 text-sm">Completado / Exento</span>
                <span className="font-semibold text-green-600 dark:text-green-400">{stats.completed + stats.waived}</span>
              </div>
            </div>
          </div>
          
          <div className="p-6 bg-purple-50 dark:bg-purple-900/10 rounded-2xl border border-purple-100 dark:border-purple-800/20">
            <h3 className="text-lg font-semibold mb-2 text-purple-900 dark:text-purple-300">Integración Opcional LIA</h3>
            <p className="text-sm text-purple-700 dark:text-purple-400 mb-4">
              La política de tu organización permite utilizar el asistente LLM Legacy para planificar estos items.
            </p>
            <button 
              onClick={onOpenLia}
              className="w-full py-2.5 px-4 bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 font-medium rounded-xl shadow-sm border border-purple-200 dark:border-purple-700/30 hover:bg-purple-50 dark:hover:bg-purple-900/40 transition-colors"
            >
              Generar Horario Sugerido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
