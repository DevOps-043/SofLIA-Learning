'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface PendingReview {
  log_id: string;
  user_id: string;
  username: string;
  email: string;
  content_type: string;
  content_preview: string;
  confidence_score: number;
  categories: string[];
  reasoning: string;
  created_at: string;
  user_warning_count: number;
}

interface Stats {
  total_analyzed: number;
  total_flagged: number;
  pending_review: number;
  average_confidence: number;
  average_processing_time_ms: number;
}

export default function AIModerationPanel() {
  const [pending, setPending] = useState<PendingReview[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'stats'>('pending');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    await Promise.all([
      loadPending(),
      loadStats()
    ]);
    setLoading(false);
  }

  async function loadPending() {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('ai_moderation_pending_review')
      .select('*')
      .order('confidence_score', { ascending: false })
      .limit(50);

    if (!error && data) {
      setPending(data);
    }
  }

  async function loadStats() {
    const supabase = createClient();
    
    try {
      const { data, error } = await (supabase as any).rpc('get_ai_moderation_stats', {
        p_days: 30
      });

      if (!error && data) {
        setStats(data);
      }
    } catch (error) {
    }
  }

  async function handleReview(logId: string, action: 'approve' | 'reject') {
    const supabase = createClient();
    
    // Si se rechaza, también registrar advertencia
    if (action === 'reject') {
      const item = pending.find(p => p.log_id === logId);
      if (item) {
        // Registrar advertencia
        const { registerWarning } = await import('@/lib/moderation');
        try {
          await registerWarning(item.user_id, item.content_preview, item.content_type as 'post' | 'comment', supabase);
        } catch (error) {
        }
      }
    }
    
    const { error } = await supabase
      .from('ai_moderation_logs')
      .update({
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewed_at: new Date().toISOString(),
      })
      .eq('log_id', logId);

    if (!error) {
      setPending(prev => prev.filter(p => p.log_id !== logId));
      loadStats(); // Recargar stats
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando panel de moderación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🤖 Moderación con IA
          </h1>
          <p className="text-gray-600">
            Panel de administración para revisar contenido flaggeado por inteligencia artificial
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'pending'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Pendientes de Revisión
                {pending.length > 0 && (
                  <span className="ml-2 bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs">
                    {pending.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('stats')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'stats'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Estadísticas
              </button>
            </nav>
          </div>

          {/* Contenido de Tabs */}
          <div className="p-6">
            {activeTab === 'pending' && (
              <div>
                {pending.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">✅</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      No hay contenido pendiente de revisión
                    </h3>
                    <p className="text-gray-600">
                      Todo el contenido flaggeado ha sido revisado o no hay nuevo contenido detectado
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pending.map((item) => (
                      <div 
                        key={item.log_id} 
                        className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-sm font-medium text-gray-900">
                                {item.username}
                              </span>
                              <span className="text-xs text-gray-500">
                                {item.email}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                item.content_type === 'post' 
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-purple-100 text-purple-700'
                              }`}>
                                {item.content_type === 'post' ? '📝 Post' : '💬 Comentario'}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {item.user_warning_count} advertencia(s) previa(s)
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <div className="text-2xl font-bold text-red-600 mb-1">
                              {(item.confidence_score * 100).toFixed(1)}%
                            </div>
                            <div className="text-xs text-gray-500">confianza IA</div>
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <div className="bg-gray-50 border border-gray-200 rounded p-4">
                            <p className="text-sm text-gray-800">
                              {item.content_preview}
                              {item.content_preview.length >= 100 && '...'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="mb-4 space-y-2">
                          <div className="flex flex-wrap gap-2">
                            <span className="text-xs text-gray-600 font-medium">Categorías:</span>
                            {item.categories && item.categories.length > 0 ? (
                              item.categories.map((cat, idx) => (
                                <span 
                                  key={idx}
                                  className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs font-medium"
                                >
                                  {cat}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-gray-400">Sin categorías</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-600">
                            <span className="font-medium">Análisis:</span> {item.reasoning}
                          </div>
                          <div className="text-xs text-gray-400">
                            {new Date(item.created_at).toLocaleString('es-ES')}
                          </div>
                        </div>
                        
                        <div className="flex gap-2 pt-4 border-t border-gray-200">
                          <button
                            onClick={() => handleReview(item.log_id, 'approve')}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                          >
                            ✅ Aprobar (Falso Positivo)
                          </button>
                          <button
                            onClick={() => handleReview(item.log_id, 'reject')}
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                          >
                            ❌ Rechazar y Advertir
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'stats' && stats && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Estadísticas de los últimos 30 días
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <div className="bg-blue-50 rounded-lg p-6">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {stats.total_analyzed}
                    </div>
                    <div className="text-sm text-blue-900 font-medium">
                      Total Analizados
                    </div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-6">
                    <div className="text-3xl font-bold text-red-600 mb-2">
                      {stats.total_flagged}
                    </div>
                    <div className="text-sm text-red-900 font-medium">
                      Flaggeados
                    </div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-6">
                    <div className="text-3xl font-bold text-yellow-600 mb-2">
                      {stats.pending_review}
                    </div>
                    <div className="text-sm text-yellow-900 font-medium">
                      Pendientes
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-6">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {stats.average_confidence ? (stats.average_confidence * 100).toFixed(1) : '0'}%
                    </div>
                    <div className="text-sm text-green-900 font-medium">
                      Confianza Promedio
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">
                    Rendimiento del Sistema
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Tiempo promedio de análisis:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {stats.average_processing_time_ms ? `${stats.average_processing_time_ms.toFixed(0)}ms` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Tasa de detección:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {stats.total_analyzed > 0 
                          ? `${((stats.total_flagged / stats.total_analyzed) * 100).toFixed(1)}%`
                          : 'N/A'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
