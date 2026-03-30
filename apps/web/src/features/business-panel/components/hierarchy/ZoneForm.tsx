'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, MapPin } from 'lucide-react';
import type { Zone, Region, ManagerInfo } from '../../types/hierarchy.types';
import { Modal, Section, geocodeAddress } from './HierarchyForms';

export function ZoneForm({ zone, regions, selectedRegionId, isOpen, onClose, onSave, isLoading, availableManagers = [] }: ZoneFormProps) {
  const params = useParams();
  const orgSlug = params?.orgSlug as string;
  const [formData, setFormData] = useState({
    region_id: '',
    name: '',
    description: '',
    code: '',
    address: '',
    city: '',
    state: '',
    country: 'México',
    postal_code: '',
    latitude: '',
    longitude: '',
    phone: '',
    email: '',
    manager_id: ''
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
    if (zone) {
      const latitudeStr = zone.latitude != null && !isNaN(Number(zone.latitude)) 
        ? Number(zone.latitude).toString() 
        : '';
      const longitudeStr = zone.longitude != null && !isNaN(Number(zone.longitude)) 
        ? Number(zone.longitude).toString() 
        : '';
      

      setFormData({
        region_id: zone.region_id || '',
        name: zone.name || '',
        description: zone.description || '',
        code: zone.code || '',
        address: zone.address || '',
        city: zone.city || '',
        state: zone.state || '',
        country: zone.country || 'México',
        postal_code: zone.postal_code || '',
        latitude: latitudeStr,
        longitude: longitudeStr,
        phone: zone.phone || '',
        email: zone.email || '',
        manager_id: zone.manager_id || ''
      });
    } else {
      setFormData({
        region_id: selectedRegionId || (regions[0]?.id || ''),
        name: '',
        description: '',
        code: '',
        address: '',
        city: '',
        state: '',
        country: 'México',
        postal_code: '',
        latitude: '',
        longitude: '',
        phone: '',
        email: '',
        manager_id: ''
      });
    }
    setError(null);
  }, [zone, isOpen, selectedRegionId, regions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.region_id) {
      setError('Selecciona una región');
      return;
    }
    if (!formData.name.trim()) {
      setError('El nombre es requerido');
      return;
    }

    try {
      const latitudeValue = formData.latitude && formData.latitude.trim() !== '' 
        ? (() => {
            const parsed = parseFloat(formData.latitude);
            return !isNaN(parsed) ? parsed : null;
          })()
        : null;
      
      const longitudeValue = formData.longitude && formData.longitude.trim() !== '' 
        ? (() => {
            const parsed = parseFloat(formData.longitude);
            return !isNaN(parsed) ? parsed : null;
          })()
        : null;

      const saveData = {
        region_id: formData.region_id,
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        code: formData.code.trim() || undefined,
        address: formData.address.trim() || undefined,
        city: formData.city.trim() || undefined,
        state: formData.state.trim() || undefined,
        country: formData.country.trim() || undefined,
        postal_code: formData.postal_code.trim() || undefined,
        latitude: latitudeValue,
        longitude: longitudeValue,
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        manager_id: formData.manager_id || undefined
      };


      await onSave(saveData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={zone ? 'Editar Zona' : 'Nueva Zona'} isLoading={isLoading} size="xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <Section
          title="Información Básica"
          icon={<svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        >
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Región *</label>
            <select
              value={formData.region_id}
              onChange={(e) => updateField('region_id', e.target.value)}
              disabled={isLoading || !!zone}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            >
              <option value="">Seleccionar región...</option>
              {regions.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Nombre *</label>
              <input type="text" value={formData.name} onChange={(e) => updateField('name', e.target.value)} className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Ej: Zona Centro" disabled={isLoading} />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Código</label>
              <input type="text" value={formData.code} onChange={(e) => updateField('code', e.target.value)} className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Ej: ZONE-C01" disabled={isLoading} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Descripción</label>
            <textarea value={formData.description} onChange={(e) => updateField('description', e.target.value)} rows={2} className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" disabled={isLoading} />
          </div>
        </Section>

        <Section title="Ubicación" icon={<svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>} defaultOpen={false}>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Dirección</label>
            <input type="text" value={formData.address} onChange={(e) => updateField('address', e.target.value)} className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white" disabled={isLoading} />
          </div>
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

        {/* Gerente de Zona */}
        <Section
          title="Gerente de Zona"
          icon={<svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
          defaultOpen={false}
        >
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Asignar Gerente de Zona
            </label>
            <select
              value={formData.manager_id}
              onChange={(e) => updateField('manager_id', e.target.value)}
              disabled={isLoading || availableManagers.length === 0}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="">Sin asignar</option>
              {availableManagers.map(m => (
                <option key={m.id} value={m.id}>
                  {getManagerDisplayName(m)} ({m.email})
                </option>
              ))}
            </select>
            {availableManagers.length === 0 && (
              <p className="text-xs text-neutral-500 mt-1">
                No hay usuarios disponibles para asignar.
              </p>
            )}
          </div>
        </Section>

        <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
          <button type="button" onClick={onClose} disabled={isLoading} className="px-4 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg text-sm font-medium">Cancelar</button>
          <button type="submit" disabled={isLoading} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">{isLoading ? 'Guardando...' : zone ? 'Guardar cambios' : 'Crear zona'}</button>
        </div>
      </form>
    </Modal>
  );
}

// ==========================================
// FORMULARIO DE EQUIPO
// ==========================================

interface TeamFormProps {
  team?: Team | null;
  zones: Zone[];
  selectedZoneId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Team> & { zone_id: string }) => Promise<void>;
  isLoading?: boolean;
  availableLeaders?: ManagerInfo[];
}

