'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Loader2, MapPin } from 'lucide-react';
import type { Region, Zone, Team, ManagerInfo } from '../../types/hierarchy.types';
import { formatFullAddress, getManagerDisplayName } from '../../types/hierarchy.types';

export async function geocodeAddress(data: { address?: string, city?: string, state?: string, country?: string, postal_code?: string }, orgSlug: string): Promise<{ lat: string; lon: string } | null> {
  const parts = [data.address, data.city, data.state, data.postal_code, data.country].filter(p => p && typeof p === 'string' && p.trim().length > 0);
  if (parts.length === 0) {
    console.warn('Geocoding: No hay datos suficientes para buscar coordenadas');
    return null;
  }
  
  try {
    
    const res = await fetch(`/api/${orgSlug}/business/hierarchy/geocode`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country,
        postal_code: data.postal_code
      })
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: 'Error desconocido' }));
      console.error('❌ Geocoding API error:', errorData);
      throw new Error(errorData.error || `Error ${res.status}: ${res.statusText}`);
    }
    
    const json = await res.json();
    
    if (json.success && json.coordinates) {
      return { 
        lat: json.coordinates.lat.toString(), 
        lon: json.coordinates.lon.toString() 
      };
    }
    
    console.warn('⚠️ Geocoding: No se encontraron coordenadas');
    return null;
  } catch (e) {
    console.error('❌ Error en geocoding:', e);
    throw e; // Re-lanzar para que handleAutoLocate pueda manejarlo
  }
}

// ==========================================
// MODAL BASE
// ==========================================

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  isLoading?: boolean;
  size?: 'md' | 'lg' | 'xl';
}

export function Modal({ isOpen, onClose, title, children, isLoading, size = 'lg' }: ModalProps) {
  if (!isOpen) return null;

  const sizeClasses = {
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className={`bg-white dark:bg-neutral-800 rounded-lg p-6 w-full ${sizeClasses[size]} shadow-xl max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
            {title}
          </h3>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded"
          >
            <svg className="w-5 h-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ==========================================
// COMPONENTE DE SECCIÓN COLAPSABLE
// ==========================================

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function Section({ title, icon, children, defaultOpen = true }: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-700/50 hover:bg-neutral-100 dark:hover:bg-neutral-700"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium text-neutral-900 dark:text-white">{title}</span>
        </div>
        <svg
          className={`w-5 h-5 text-neutral-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && <div className="p-4 space-y-4">{children}</div>}
    </div>
  );
}

// ==========================================
// FORMULARIO DE REGIÓN
// ==========================================

interface RegionFormProps {
  region?: Region | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Region>) => Promise<void>;
  isLoading?: boolean;
  availableManagers?: ManagerInfo[];
}


export function DeleteConfirmModal({ isOpen, onClose, onConfirm, title, message, itemName, isLoading }: DeleteConfirmProps) {
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation('business');
  const { t: tc } = useTranslation('common');

  useEffect(() => {
    setConfirmText('');
    setError(null);
  }, [isOpen]);

  const handleConfirm = async () => {
    if (confirmText !== itemName) {
      setError(t('hierarchy.deleteConfirmError', { name: itemName }));
      return;
    }

    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('hierarchy.errorDelete'));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} isLoading={isLoading} size="md">
      <div className="space-y-4">
        <p className="text-neutral-600 dark:text-neutral-400">{message}</p>
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">
            {t('hierarchy.deleteWarning')} <strong>{itemName}</strong> {t('hierarchy.deleteWarningEnd')}
          </p>
        </div>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
          placeholder={itemName}
          disabled={isLoading}
        />
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} disabled={isLoading} className="px-4 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg text-sm font-medium">{tc('actions.cancel')}</button>
          <button onClick={handleConfirm} disabled={isLoading || confirmText !== itemName} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">{isLoading ? tc('actions.deleting') : tc('actions.delete')}</button>
        </div>
      </div>
    </Modal>
  );
}

// ==========================================
// PANEL DE DETALLES MEJORADO
// ==========================================

interface DetailsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'region' | 'zone' | 'team';
  data: Region | Zone | Team | null;
  onEdit?: () => void;
}

export function DetailsPanel({ isOpen, onClose, type, data, onEdit }: DetailsPanelProps) {
  const { t } = useTranslation('business');

  if (!isOpen || !data) return null;

  const typeLabels = {
    region: t('hierarchy.types.region'),
    zone: t('hierarchy.types.zone'),
    team: t('hierarchy.types.team'),
  };
  const colorClasses = { region: 'bg-blue-500', zone: 'bg-emerald-500', team: 'bg-amber-500' };
  const managerLabels = {
    region: t('hierarchy.managers.region'),
    zone: t('hierarchy.managers.zone'),
    team: t('hierarchy.managers.team'),
  };

  const manager = type === 'team' ? (data as Team).leader : (data as Region | Zone).manager;
  const hasLocation = data.address || data.city || data.state || data.country;
  const hasContact = data.phone || data.email;

  return (
    <div className="fixed inset-y-0 right-0 w-[420px] bg-white dark:bg-neutral-800 shadow-xl z-50 transform transition-transform overflow-hidden">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className={`${colorClasses[type]} p-5`}>
          <div className="flex items-center justify-between">
            <span className="text-white/80 text-sm font-medium uppercase tracking-wide">{typeLabels[type]}</span>
            <div className="flex items-center gap-2">
              {onEdit && (
                <button onClick={onEdit} className="p-1.5 hover:bg-white/20 rounded text-white" title="Editar">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </button>
              )}
              <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded text-white">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-white mt-2">{data.name}</h3>
          <div className="flex items-center gap-2 mt-2">
            {data.code && <span className="px-2 py-0.5 bg-white/20 text-white text-xs rounded">{data.code}</span>}
            <span className={`px-2 py-0.5 text-xs rounded ${data.is_active ? 'bg-green-400/30 text-green-100' : 'bg-red-400/30 text-red-100'}`}>
              {data.is_active ? t('hierarchy.statusActive') : t('hierarchy.statusInactive')}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Descripción */}
          {data.description && (
            <div>
              <h4 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-2">{t('hierarchy.description')}</h4>
              <p className="text-neutral-700 dark:text-neutral-300">{data.description}</p>
            </div>
          )}

          {/* Gerente/Líder */}
          <div className="bg-neutral-50 dark:bg-neutral-700/50 rounded-lg p-4">
            <h4 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-3">{managerLabels[type]}</h4>
            {manager ? (
              <div className="flex items-center gap-3">
                {manager.profile_picture_url ? (
                  <img src={manager.profile_picture_url} alt="" className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-neutral-300 dark:bg-neutral-600 flex items-center justify-center">
                    <svg className="w-6 h-6 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </div>
                )}
                <div>
                  <p className="font-medium text-neutral-900 dark:text-white">{getManagerDisplayName(manager)}</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">{manager.email}</p>
                </div>
              </div>
            ) : (
              <p className="text-neutral-500 dark:text-neutral-400 italic">{t('hierarchy.unassigned')}</p>
            )}
          </div>

          {/* Estadísticas */}
          <div>
            <h4 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-3">{t('hierarchy.stats')}</h4>
            <div className="grid grid-cols-2 gap-3">
              {type === 'region' && (
                <>
                  <div className="p-3 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg">
                    <p className="text-2xl font-bold text-neutral-900 dark:text-white">{(data as Region).zones_count || 0}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('hierarchy.zones')}</p>
                  </div>
                  <div className="p-3 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg">
                    <p className="text-2xl font-bold text-neutral-900 dark:text-white">{(data as Region).teams_count || 0}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('hierarchy.teams')}</p>
                  </div>
                  <div className="p-3 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg col-span-2">
                    <p className="text-2xl font-bold text-neutral-900 dark:text-white">{(data as Region).users_count || 0}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('hierarchy.assignedUsers')}</p>
                  </div>
                </>
              )}
              {type === 'zone' && (
                <>
                  <div className="p-3 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg">
                    <p className="text-2xl font-bold text-neutral-900 dark:text-white">{(data as Zone).teams_count || 0}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('hierarchy.teams')}</p>
                  </div>
                  <div className="p-3 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg">
                    <p className="text-2xl font-bold text-neutral-900 dark:text-white">{(data as Zone).users_count || 0}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('hierarchy.users')}</p>
                  </div>
                </>
              )}
              {type === 'team' && (
                <>
                  <div className="p-3 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg">
                    <p className="text-2xl font-bold text-neutral-900 dark:text-white">{(data as Team).members_count || 0}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('hierarchy.members')}</p>
                  </div>
                  <div className="p-3 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg">
                    <p className="text-2xl font-bold text-neutral-900 dark:text-white">{(data as Team).max_members || '∞'}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('hierarchy.capacity')}</p>
                  </div>
                  {(data as Team).target_goal && (
                    <div className="p-3 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg col-span-2">
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('hierarchy.goal')}</p>
                      <p className="text-sm text-neutral-900 dark:text-white">{(data as Team).target_goal}</p>
                    </div>
                  )}
                  {(data as Team).monthly_target && (
                    <div className="p-3 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg col-span-2">
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('hierarchy.monthlyTarget')}</p>
                      <p className="text-lg font-semibold text-neutral-900 dark:text-white">${(data as Team).monthly_target?.toLocaleString()}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Ubicación */}
          {hasLocation && (
            <div>
              <h4 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-3">{t('hierarchy.location')}</h4>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-neutral-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                <p className="text-neutral-700 dark:text-neutral-300">{formatFullAddress(data)}</p>
              </div>
            </div>
          )}

          {/* Contacto */}
          {hasContact && (
            <div>
              <h4 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-3">{t('hierarchy.contact')}</h4>
              <div className="space-y-2">
                {data.phone && (
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    <a href={`tel:${data.phone}`} className="text-blue-600 dark:text-blue-400 hover:underline">{data.phone}</a>
                  </div>
                )}
                {data.email && (
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    <a href={`mailto:${data.email}`} className="text-blue-600 dark:text-blue-400 hover:underline">{data.email}</a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Información adicional */}
          <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
            <h4 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-3">{t('hierarchy.info')}</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-500 dark:text-neutral-400">{t('hierarchy.created')}</span>
                <span className="text-neutral-900 dark:text-white">
                  {new Date(data.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500 dark:text-neutral-400">{t('hierarchy.updated')}</span>
                <span className="text-neutral-900 dark:text-white">
                  {new Date(data.updated_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
