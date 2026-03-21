'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, MapPin } from 'lucide-react';
import type { Region, Zone, Team, ManagerInfo } from '../../types/hierarchy.types';
import { formatFullAddress, getManagerDisplayName } from '../../types/hierarchy.types';

async function geocodeAddress(data: { address?: string, city?: string, state?: string, country?: string, postal_code?: string }, orgSlug: string): Promise<{ lat: string; lon: string } | null> {
  const parts = [data.address, data.city, data.state, data.postal_code, data.country].filter(p => p && typeof p === 'string' && p.trim().length > 0);
  if (parts.length === 0) {
    console.warn('Geocoding: No hay datos suficientes para buscar coordenadas');
    return null;
  }
  
  try {
    console.log('🔍 Iniciando geocoding para:', parts.join(', '));
    
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
      console.log('✅ Geocoding exitoso:', json.coordinates);
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

function Section({ title, icon, children, defaultOpen = true }: SectionProps) {
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

export function RegionForm({ region, isOpen, onClose, onSave, isLoading, availableManagers = [] }: RegionFormProps) {
  const params = useParams();
  const orgSlug = params?.orgSlug as string;
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    code: '',
    // Ubicación
    address: '',
    city: '',
    state: '',
    country: 'México',
    postal_code: '',
    latitude: '',
    longitude: '',
    // Contacto
    phone: '',
    email: '',
    // Gerente
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
        console.log('✅ Coordenadas calculadas:', coords);
        console.log('📝 Actualizando formData con:', { 
          latitude: coords.lat, 
          longitude: coords.lon,
          latitudeType: typeof coords.lat,
          longitudeType: typeof coords.lon
        });
        
        setFormData(prev => {
          const updated = { ...prev, latitude: coords.lat, longitude: coords.lon };
          console.log('✅ formData actualizado:', {
            latitude: updated.latitude,
            longitude: updated.longitude
          });
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
    if (region) {
      setFormData({
        name: region.name || '',
        description: region.description || '',
        code: region.code || '',
        address: region.address || '',
        city: region.city || '',
        state: region.state || '',
        country: region.country || 'México',
        postal_code: region.postal_code || '',
        latitude: region.latitude?.toString() || '',
        longitude: region.longitude?.toString() || '',
        phone: region.phone || '',
        email: region.email || '',
        manager_id: region.manager_id || ''
      });
    } else {
      setFormData({
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
  }, [region, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('El nombre es requerido');
      return;
    }

    try {
      await onSave({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        code: formData.code.trim() || undefined,
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
        manager_id: formData.manager_id || undefined
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
    <Modal isOpen={isOpen} onClose={onClose} title={region ? 'Editar Región' : 'Nueva Región'} isLoading={isLoading} size="xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Información Básica */}
        <Section
          title="Información Básica"
          icon={<svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Región Norte"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Código
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => updateField('code', e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: REG-N01"
                disabled={isLoading}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Descripción de la región..."
              disabled={isLoading}
            />
          </div>
        </Section>

        {/* Ubicación */}
        <Section
          title="Ubicación"
          icon={<svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
          defaultOpen={false}
        >
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Dirección
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => updateField('address', e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Calle, número, colonia..."
              disabled={isLoading}
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Ciudad</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => updateField('city', e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ciudad"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Estado</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => updateField('state', e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Estado"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">C.P.</label>
              <input
                type="text"
                value={formData.postal_code}
                onChange={(e) => updateField('postal_code', e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="00000"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">País</label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => updateField('country', e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="País"
                disabled={isLoading}
              />
            </div>
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

        {/* Contacto */}
        <Section
          title="Contacto"
          icon={<svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
          defaultOpen={false}
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Teléfono</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+52 555 123 4567"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="region@empresa.com"
                disabled={isLoading}
              />
            </div>
          </div>
        </Section>

        {/* Gerente Regional */}
        <Section
          title="Gerente Regional"
          icon={<svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
          defaultOpen={false}
        >
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Asignar Gerente Regional
            </label>
            <select
              value={formData.manager_id}
              onChange={(e) => updateField('manager_id', e.target.value)}
              disabled={isLoading || availableManagers.length === 0}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                No hay usuarios disponibles para asignar. Los gerentes se asignan desde la sección de usuarios.
              </p>
            )}
          </div>
        </Section>

        <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg text-sm font-medium"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {isLoading ? 'Guardando...' : region ? 'Guardar cambios' : 'Crear región'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ==========================================
// FORMULARIO DE ZONA (Simplificado - misma estructura)
// ==========================================

interface ZoneFormProps {
  zone?: Zone | null;
  regions: Region[];
  selectedRegionId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Zone> & { region_id: string }) => Promise<void>;
  isLoading?: boolean;
  availableManagers?: ManagerInfo[];
}

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
        console.log('✅ Coordenadas calculadas:', coords);
        console.log('📝 Actualizando formData con:', { 
          latitude: coords.lat, 
          longitude: coords.lon,
          latitudeType: typeof coords.lat,
          longitudeType: typeof coords.lon
        });
        
        setFormData(prev => {
          const updated = { ...prev, latitude: coords.lat, longitude: coords.lon };
          console.log('✅ formData actualizado:', {
            latitude: updated.latitude,
            longitude: updated.longitude
          });
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
      
      console.log('📥 ZoneForm - Cargando zona:', {
        name: zone.name,
        latitude: zone.latitude,
        longitude: zone.longitude,
        latitudeStr,
        longitudeStr,
        latitudeType: typeof zone.latitude,
        longitudeType: typeof zone.longitude
      });

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

      console.log('💾 ZoneForm - Enviando datos:', {
        ...saveData,
        latitude: saveData.latitude,
        longitude: saveData.longitude,
        latitudeType: typeof saveData.latitude,
        longitudeType: typeof saveData.longitude
      });

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
        console.log('✅ Coordenadas calculadas:', coords);
        console.log('📝 Actualizando formData con:', { 
          latitude: coords.lat, 
          longitude: coords.lon,
          latitudeType: typeof coords.lat,
          longitudeType: typeof coords.lon
        });
        
        setFormData(prev => {
          const updated = { ...prev, latitude: coords.lat, longitude: coords.lon };
          console.log('✅ formData actualizado:', {
            latitude: updated.latitude,
            longitude: updated.longitude
          });
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

export function DeleteConfirmModal({ isOpen, onClose, onConfirm, title, message, itemName, isLoading }: DeleteConfirmProps) {
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setConfirmText('');
    setError(null);
  }, [isOpen]);

  const handleConfirm = async () => {
    if (confirmText !== itemName) {
      setError(`Escribe "${itemName}" para confirmar`);
      return;
    }

    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} isLoading={isLoading} size="md">
      <div className="space-y-4">
        <p className="text-neutral-600 dark:text-neutral-400">{message}</p>
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">
            Esta acción no se puede deshacer. Escribe <strong>{itemName}</strong> para confirmar.
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
          <button type="button" onClick={onClose} disabled={isLoading} className="px-4 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg text-sm font-medium">Cancelar</button>
          <button onClick={handleConfirm} disabled={isLoading || confirmText !== itemName} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">{isLoading ? 'Eliminando...' : 'Eliminar'}</button>
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
  if (!isOpen || !data) return null;

  const typeLabels = { region: 'Región', zone: 'Zona', team: 'Equipo' };
  const colorClasses = { region: 'bg-blue-500', zone: 'bg-emerald-500', team: 'bg-amber-500' };
  const managerLabels = { region: 'Gerente Regional', zone: 'Gerente de Zona', team: 'Líder de Equipo' };

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
              {data.is_active ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Descripción */}
          {data.description && (
            <div>
              <h4 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-2">Descripción</h4>
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
              <p className="text-neutral-500 dark:text-neutral-400 italic">Sin asignar</p>
            )}
          </div>

          {/* Estadísticas */}
          <div>
            <h4 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-3">Estadísticas</h4>
            <div className="grid grid-cols-2 gap-3">
              {type === 'region' && (
                <>
                  <div className="p-3 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg">
                    <p className="text-2xl font-bold text-neutral-900 dark:text-white">{(data as Region).zones_count || 0}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Zonas</p>
                  </div>
                  <div className="p-3 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg">
                    <p className="text-2xl font-bold text-neutral-900 dark:text-white">{(data as Region).teams_count || 0}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Equipos</p>
                  </div>
                  <div className="p-3 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg col-span-2">
                    <p className="text-2xl font-bold text-neutral-900 dark:text-white">{(data as Region).users_count || 0}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Usuarios asignados</p>
                  </div>
                </>
              )}
              {type === 'zone' && (
                <>
                  <div className="p-3 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg">
                    <p className="text-2xl font-bold text-neutral-900 dark:text-white">{(data as Zone).teams_count || 0}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Equipos</p>
                  </div>
                  <div className="p-3 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg">
                    <p className="text-2xl font-bold text-neutral-900 dark:text-white">{(data as Zone).users_count || 0}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Usuarios</p>
                  </div>
                </>
              )}
              {type === 'team' && (
                <>
                  <div className="p-3 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg">
                    <p className="text-2xl font-bold text-neutral-900 dark:text-white">{(data as Team).members_count || 0}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Miembros</p>
                  </div>
                  <div className="p-3 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg">
                    <p className="text-2xl font-bold text-neutral-900 dark:text-white">{(data as Team).max_members || '∞'}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Capacidad</p>
                  </div>
                  {(data as Team).target_goal && (
                    <div className="p-3 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg col-span-2">
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Objetivo</p>
                      <p className="text-sm text-neutral-900 dark:text-white">{(data as Team).target_goal}</p>
                    </div>
                  )}
                  {(data as Team).monthly_target && (
                    <div className="p-3 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg col-span-2">
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Meta Mensual</p>
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
              <h4 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-3">Ubicación</h4>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-neutral-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                <p className="text-neutral-700 dark:text-neutral-300">{formatFullAddress(data)}</p>
              </div>
            </div>
          )}

          {/* Contacto */}
          {hasContact && (
            <div>
              <h4 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-3">Contacto</h4>
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
            <h4 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-3">Información</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-500 dark:text-neutral-400">Creado</span>
                <span className="text-neutral-900 dark:text-white">
                  {new Date(data.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500 dark:text-neutral-400">Actualizado</span>
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
