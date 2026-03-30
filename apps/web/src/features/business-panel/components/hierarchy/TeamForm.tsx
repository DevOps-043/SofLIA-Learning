'use client';

import { useState } from 'react';
import type { Team, Zone, ManagerInfo } from '../../types/hierarchy.types';
import { Modal, Section } from './HierarchyForms';

export function TeamForm({ team, zones, selectedZoneId, isOpen, onClose, onSave, isLoading, availableLeaders = [] }: TeamFormProps) {
  const params = useParams();
  const orgSlug = params?.orgSlug as string;
  const [formData, setFormData] = useState({
    zone_id: '',
    name: '',
    description: '',
    code: '',
    max_members: '',
    target_goal: '',
    monthly_target: '',
    address: '',
    city: '',
    state: '',
    country: 'México',
    postal_code: '',
    latitude: '',
    longitude: '',
    phone: '',
    email: '',
    leader_id: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

  const handleAutoLocate = async () => {
    setIsGeocoding(true);
    setError(null);
    
    // Validar que hay al menos ciudad o dirección
    if (!formData.city && !formData.address) {
      setError('Por favor, ingresa al menos una ciudad o dirección.');
      setIsGeocoding(false);
      return;
    }
    
    try {
      const coords = await geocodeAddress(formData, orgSlug);
      if (coords) {
        
        setFormData(prev => {
          const updated = { ...prev, latitude: coords.lat, longitude: coords.lon };
          return updated;
        });
        setError(null);
      } else {
        setError('No se pudo encontrar la ubicación. Intenta con una dirección más específica o verifica la ortografía.');
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Error desconocido';
      console.error('❌ Error en handleAutoLocate:', e);
      setError(`Error al buscar coordenadas: ${errorMessage}. Por favor, intenta de nuevo.`);
    } finally {
      setIsGeocoding(false);
    }
  };

  useEffect(() => {
    if (team) {
      setFormData({
        zone_id: team.zone_id || '',
        name: team.name || '',
        description: team.description || '',
        code: team.code || '',
        max_members: team.max_members?.toString() || '',
        target_goal: team.target_goal || '',
        monthly_target: team.monthly_target?.toString() || '',
        address: team.address || '',
        city: team.city || '',
        state: team.state || '',
        country: team.country || 'México',
        postal_code: team.postal_code || '',
        latitude: team.latitude?.toString() || '',
        longitude: team.longitude?.toString() || '',
        phone: team.phone || '',
        email: team.email || '',
        leader_id: team.leader_id || ''
      });
    } else {
      setFormData({
        zone_id: selectedZoneId || (zones[0]?.id || ''),
        name: '',
        description: '',
        code: '',
        max_members: '',
        target_goal: '',
        monthly_target: '',
        address: '',
        city: '',
        state: '',
        country: 'México',
        postal_code: '',
        latitude: '',
        longitude: '',
        phone: '',
        email: '',
        leader_id: ''
      });
    }
    setError(null);
  }, [team, isOpen, selectedZoneId, zones]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.zone_id) {
      setError('Selecciona una zona');
      return;
    }
    if (!formData.name.trim()) {
      setError('El nombre es requerido');
      return;
    }

    try {
      await onSave({
        zone_id: formData.zone_id,
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        code: formData.code.trim() || undefined,
        max_members: formData.max_members ? parseInt(formData.max_members) : undefined,
        target_goal: formData.target_goal.trim() || undefined,
        monthly_target: formData.monthly_target ? parseFloat(formData.monthly_target) : undefined,
        address: formData.address.trim() || undefined,
        city: formData.city.trim() || undefined,
        state: formData.state.trim() || undefined,
        country: formData.country.trim() || undefined,
        postal_code: formData.postal_code.trim() || undefined,
        latitude: formData.latitude && formData.latitude.trim() !== '' 
          ? (() => {
              const parsed = parseFloat(formData.latitude);
              return !isNaN(parsed) ? parsed : null;
            })()
          : null,
        longitude: formData.longitude && formData.longitude.trim() !== '' 
          ? (() => {
              const parsed = parseFloat(formData.longitude);
              return !isNaN(parsed) ? parsed : null;
            })()
          : null,
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        leader_id: formData.leader_id || undefined
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={team ? 'Editar Equipo' : 'Nuevo Equipo'} isLoading={isLoading} size="xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <Section title="Información Básica" icon={<svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Zona *</label>
            <select value={formData.zone_id} onChange={(e) => updateField('zone_id', e.target.value)} disabled={isLoading || !!team} className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white disabled:opacity-50">
              <option value="">Seleccionar zona...</option>
              {zones.map(z => (
                <option key={z.id} value={z.id}>{z.name} {z.region?.name ? `(${z.region.name})` : ''}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Nombre *</label><input type="text" value={formData.name} onChange={(e) => updateField('name', e.target.value)} className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white" placeholder="Ej: Equipo Ventas" disabled={isLoading} /></div>
            <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Código</label><input type="text" value={formData.code} onChange={(e) => updateField('code', e.target.value)} className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white" placeholder="Ej: TEAM-V01" disabled={isLoading} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Máx. miembros</label><input type="number" min="1" value={formData.max_members} onChange={(e) => updateField('max_members', e.target.value)} className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white" placeholder="Sin límite" disabled={isLoading} /></div>
            <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Líder de Equipo</label>
              <select value={formData.leader_id} onChange={(e) => updateField('leader_id', e.target.value)} disabled={isLoading} className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white">
                <option value="">Sin asignar</option>
                {availableLeaders.map(l => (
                  <option key={l.id} value={l.id}>{getManagerDisplayName(l)}</option>
                ))}
              </select>
            </div>
          </div>
          <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Descripción</label><textarea value={formData.description} onChange={(e) => updateField('description', e.target.value)} rows={2} className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white resize-none" disabled={isLoading} /></div>
        </Section>

        <Section title="Objetivos y Metas" icon={<svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>} defaultOpen={false}>
          <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Objetivo/Meta</label><textarea value={formData.target_goal} onChange={(e) => updateField('target_goal', e.target.value)} rows={2} className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white resize-none" placeholder="Descripción del objetivo del equipo..." disabled={isLoading} /></div>
          <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Meta mensual (numérica)</label><input type="number" step="0.01" value={formData.monthly_target} onChange={(e) => updateField('monthly_target', e.target.value)} className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white" placeholder="Ej: 100000" disabled={isLoading} /></div>
        </Section>

        <Section title="Ubicación" icon={<svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>} defaultOpen={false}>
          <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Dirección</label><input type="text" value={formData.address} onChange={(e) => updateField('address', e.target.value)} className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white" disabled={isLoading} /></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Ciudad</label><input type="text" value={formData.city} onChange={(e) => updateField('city', e.target.value)} className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white" disabled={isLoading} /></div>
            <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Estado</label><input type="text" value={formData.state} onChange={(e) => updateField('state', e.target.value)} className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white" disabled={isLoading} /></div>
            <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">C.P.</label><input type="text" value={formData.postal_code} onChange={(e) => updateField('postal_code', e.target.value)} className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white" disabled={isLoading} /></div>
            <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">País</label><input type="text" value={formData.country} onChange={(e) => updateField('country', e.target.value)} className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white" disabled={isLoading} /></div>
          </div>
          <div className="mt-4 pt-4 border-t border-dashed border-neutral-200 dark:border-neutral-700">
            <div className="flex justify-end mb-2">
              <button 
                type="button" 
                onClick={handleAutoLocate}
                disabled={isGeocoding || (!formData.address && !formData.city)}
                className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
              >
                {isGeocoding ? <Loader2 className="w-3 h-3 animate-spin"/> : <MapPin className="w-3 h-3"/>}
                Calcular coordenadas desde dirección
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Latitud</label>
               <input
                 type="number"
                 step="any"
                 value={formData.latitude}
                 onChange={(e) => updateField('latitude', e.target.value)}
                 className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                 placeholder="Ej: 19.4326"
                 disabled={isLoading}
               />
             </div>
             <div>
               <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Longitud</label>
               <input
                 type="number"
                 step="any"
                 value={formData.longitude}
                 onChange={(e) => updateField('longitude', e.target.value)}
                 className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                 placeholder="Ej: -99.1332"
                 disabled={isLoading}
               />
             </div>
            </div>
          </div>
        </Section>

        <Section title="Contacto" icon={<svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>} defaultOpen={false}>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Teléfono</label><input type="tel" value={formData.phone} onChange={(e) => updateField('phone', e.target.value)} className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white" disabled={isLoading} /></div>
            <div><label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Email</label><input type="email" value={formData.email} onChange={(e) => updateField('email', e.target.value)} className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white" disabled={isLoading} /></div>
          </div>
        </Section>

        <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
          <button type="button" onClick={onClose} disabled={isLoading} className="px-4 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg text-sm font-medium">Cancelar</button>
          <button type="submit" disabled={isLoading} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">{isLoading ? 'Guardando...' : team ? 'Guardar cambios' : 'Crear equipo'}</button>
        </div>
      </form>
    </Modal>
  );
}

// ==========================================
// MODAL DE CONFIRMACIÓN DE ELIMINACIÓN
// ==========================================

interface DeleteConfirmProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  message: string;
  itemName: string;
  isLoading?: boolean;
}

