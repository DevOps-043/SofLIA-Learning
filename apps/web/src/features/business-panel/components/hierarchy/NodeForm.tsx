'use client';

import React, { useEffect, useState } from 'react';
import { OrganizationNode, OrganizationNodeProperties } from '../../types/dynamicHierarchy.types';
import { HierarchyService } from '../../services/hierarchy.service';
import { Search, X, Loader2, User } from 'lucide-react';
import type { UserWithHierarchy } from '../../types/hierarchy.types';

type NodeManagerUser = UserWithHierarchy['user']

interface GeocodeResponse {
    coordinates?: {
        lat: string | number
        lon: string | number
    }
    error?: string
    success?: boolean
}

interface ReverseGeocodeAddress {
    city?: string
    country?: string
    house_number?: string
    municipality?: string
    neighbourhood?: string
    pedestrian?: string
    postcode?: string
    road?: string
    state?: string
    street?: string
    suburb?: string
    town?: string
    village?: string
}

interface ReverseGeocodeResponse {
    address?: ReverseGeocodeAddress
    display_name?: string
    error?: string
}

function getErrorMessage(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback;
}

function toManagerUser(manager: OrganizationNode['manager']): NodeManagerUser | null {
    if (!manager) {
        return null;
    }

    return {
        id: manager.id,
        first_name: manager.first_name,
        last_name: manager.last_name,
        email: manager.email,
        profile_picture_url: manager.profile_picture_url ?? null,
        username: manager.email,
    };
}

export interface NodeFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string, type: string, properties?: OrganizationNodeProperties, managerId?: string) => Promise<void>;
    mode: 'create' | 'edit';
    parentNode?: OrganizationNode; // Only for create mode
    nodeToEdit?: OrganizationNode; // Only for edit mode
}

export const NodeForm: React.FC<NodeFormProps> = ({
    isOpen,
    onClose,
    onSave,
    mode,
    parentNode,
    nodeToEdit
}) => {
    const [name, setName] = useState('');
    const [type, setType] = useState('custom');
    const [customType, setCustomType] = useState('');

    // Detailed Address Properties
    const [street, setStreet] = useState('');
    const [externalNumber, setExternalNumber] = useState('');
    const [internalNumber, setInternalNumber] = useState('');
    const [neighborhood, setNeighborhood] = useState('');
    const [zipCode, setZipCode] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [country, setCountry] = useState('');

    // Coordinates
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');

    // Manager Assignment
    const [managerId, setManagerId] = useState<string | null>(null);
    const [managerSearch, setManagerSearch] = useState('');
    const [managerResults, setManagerResults] = useState<UserWithHierarchy['user'][]>([]);
    const [isSearchingManager, setIsSearchingManager] = useState(false);
    const [selectedManager, setSelectedManager] = useState<UserWithHierarchy['user'] | null>(null);

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (mode === 'edit' && nodeToEdit) {
                setName(nodeToEdit.name);
                if (['region', 'zone', 'team'].includes(nodeToEdit.type)) {
                    setType(nodeToEdit.type);
                    setCustomType('');
                } else {
                    setType('custom');
                    setCustomType(nodeToEdit.type);
                }

                // Load properties
                const props = nodeToEdit.properties || {};
                setStreet(props.street || '');
                setExternalNumber(props.external_number || '');
                setInternalNumber(props.internal_number || '');
                setNeighborhood(props.neighborhood || '');
                setZipCode(props.zip_code || '');
                setCity(props.city || '');
                setState(props.state || '');
                setCountry(props.country || '');

                // Fallback for legacy simple address if detailed missing
                if (!props.street && props.address) {
                    setStreet(props.address); // Dumping full string to street as fallback
                }

                setLatitude(props.latitude ? String(props.latitude) : '');
                setLongitude(props.longitude ? String(props.longitude) : '');

                if (nodeToEdit.manager_id) {
                    setManagerId(nodeToEdit.manager_id);
                    // Pre-fill display if manager object exists (requires checking if nodeToEdit includes manager relation data)
                    // Currently OrganizationNode interface has manager?: {...}
                    if (nodeToEdit.manager) {
                        setSelectedManager(toManagerUser(nodeToEdit.manager));
                    }
                } else {
                    setManagerId(null);
                    setSelectedManager(null);
                }

            } else {
                // Reset form
                setName('');
                setCustomType('');

                setManagerId(null);
                setSelectedManager(null);
                setManagerSearch('');
                setManagerResults([]);

                setStreet('');
                setExternalNumber('');
                setInternalNumber('');
                setNeighborhood('');
                setZipCode('');
                setCity('');
                setState('');
                setCountry('');

                setLatitude('');
                setLongitude('');

                // Suggest type based on parent
                if (parentNode) {
                    if (parentNode.type === 'root') setType('region');
                    else if (parentNode.type === 'region') setType('zone');
                    else if (parentNode.type === 'zone') setType('team');
                    else setType('custom');
                } else {
                    setType('custom');
                }
            }
            setLoading(false);
        }
    }, [isOpen, mode, nodeToEdit, parentNode]);

    // Search Managers Effect
    useEffect(() => {
        if (!isOpen) return;

        const searchUsers = async () => {
            setIsSearchingManager(true);
            try {
                const users = await HierarchyService.searchOrganizationUsers(managerSearch);
                setManagerResults(users);
            } catch (error) {
                console.error("Failed to search managers", error);
            } finally {
                setIsSearchingManager(false);
            }
        };

        const timeoutId = setTimeout(() => {
            if (managerSearch || !selectedManager) {
                searchUsers();
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [managerSearch, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setLoading(true);
        try {
            const finalType = type === 'custom' ? (customType.trim() || 'custom') : type;

            // Construct formatted address for simple display
            const addressParts = [
                street,
                externalNumber ? `#${externalNumber}` : '',
                internalNumber ? `Int. ${internalNumber}` : '',
                neighborhood ? `Col. ${neighborhood}` : '',
                city,
                state
            ].filter(Boolean).join(', ');

            const properties: OrganizationNodeProperties = {
                street,
                external_number: externalNumber,
                internal_number: internalNumber,
                neighborhood,
                zip_code: zipCode,
                city,
                state,
                country,
                address: addressParts, // Legacy/Display Field
                latitude: latitude ? parseFloat(latitude) : null,
                longitude: longitude ? parseFloat(longitude) : null
            };

            // Clean undefined/null params
            Object.keys(properties).forEach(key =>
                (properties[key] === null || properties[key] === '') && delete properties[key]
            );

            await onSave(name, finalType, properties, managerId || undefined);
            onClose();
        } catch (error) {
            console.error(error);
            alert('Error al guardar');
        } finally {
            setLoading(false);
        }
    };

    // Calculate coords from address fields
    const handleGeocode = async () => {
        const queryParts = [
            street,
            externalNumber,
            neighborhood,
            city,
            state,
            country
        ].filter(Boolean).join(', ');

        // Legacy API requires structured object or at least we should follow its pattern if possible,
        // but it accepts a constructed body. Let's send the structured fields to be precise as per the observed API.

        if (!queryParts && !city && !street) {
            alert('Por favor complete al menos Calle y Ciudad para buscar coordenadas.');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/business/hierarchy/geocode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    // Send cleaner address for better match (Street + Number only)
                    address: `${street} ${externalNumber || ''}`.trim(),
                    city,
                    state,
                    country,
                    postal_code: zipCode
                })
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || 'Error en servicio de geocodificación');
            }

            const data = await res.json() as GeocodeResponse;
            if (data.success && data.coordinates) {
                setLatitude(String(data.coordinates.lat));
                setLongitude(String(data.coordinates.lon));
            } else {
                alert('No se encontraron coordenadas para esta dirección');
            }
        } catch (e: unknown) {
            console.error(e);
            alert('Error: ' + getErrorMessage(e, 'Intente nuevamente'));
        } finally {
            setLoading(false);
        }
    };

    // Populate address fields from coords
    const handleReverseGeocode = async () => {
        if (!latitude || !longitude) return;
        setLoading(true);
        try {
            // Use legacy API extended with GET
            const res = await fetch(`/api/business/hierarchy/geocode?lat=${latitude}&lon=${longitude}`);

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`Error ${res.status}: ${errText}`);
            }

            const data = await res.json() as ReverseGeocodeResponse;

            if (data.error) throw new Error(data.error);

            if (data.address) {
                const addr = data.address;
                setStreet(addr.road || addr.pedestrian || addr.street || street);
                setExternalNumber(addr.house_number || externalNumber);
                setNeighborhood(addr.neighbourhood || addr.suburb || neighborhood);
                setCity(addr.city || addr.town || addr.village || addr.municipality || city);
                setState(addr.state || state);
                setCountry(addr.country || country);
                setZipCode(addr.postcode || zipCode);
            } else if (data.display_name) {
                // Fallback if structured address not clear
                setStreet(data.display_name);
            }
        } catch (e: unknown) {
            console.error(e);
            alert('Error al obtener dirección: ' + getErrorMessage(e, 'Intente nuevamente'));
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const title = mode === 'create'
        ? `Agregar sub-nivel a "${parentNode?.name}"`
        : 'Editar nodo';

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-neutral-800 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-neutral-800 sticky top-0 bg-white dark:bg-neutral-900 z-10">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-5">
                    {/* Basic Info Group */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Nombre
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ej: Ventas Norte"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-400"
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Tipo de Nivel
                            </label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                            >
                                <option value="region">Región</option>
                                <option value="zone">Zona</option>
                                <option value="team">Equipo</option>
                                <option value="custom">Personalizado / Otro</option>
                            </select>
                        </div>

                        {type === 'custom' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Nombre del Tipo (Ej: División, Squad)
                                </label>
                                <input
                                    type="text"
                                    value={customType}
                                    onChange={(e) => setCustomType(e.target.value)}
                                    placeholder="Especifique el tipo de nivel"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-400"
                                />
                            </div>
                        )}
                    </div>

                    <hr className="border-gray-200 dark:border-neutral-800" />

                    {/* Manager Selection */}
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Responsable / Encargado
                        </label>

                        {selectedManager ? (
                            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center overflow-hidden">
                                        {selectedManager.profile_picture_url ? (
                                            <img src={selectedManager.profile_picture_url} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-xs font-bold text-blue-600 dark:text-blue-300">
                                                {(selectedManager.first_name?.[0] || selectedManager.username?.[0] || '?').toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            {selectedManager.first_name} {selectedManager.last_name}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {selectedManager.email}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedManager(null);
                                        setManagerId(null);
                                        setManagerSearch('');
                                    }}
                                    className="p-1 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-full text-blue-500 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="relative">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={managerSearch}
                                        onChange={(e) => setManagerSearch(e.target.value)}
                                        placeholder="Buscar usuario..."
                                        className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-neutral-800 text-sm"
                                    />
                                    {isSearchingManager && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                                        </div>
                                    )}
                                </div>

                                {managerResults.length > 0 && managerSearch && (
                                    <div className="absolute z-50 mt-1 w-full bg-white dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                        {managerResults.map(user => (
                                            <button
                                                key={user.id}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedManager(user);
                                                    setManagerId(user.user_id || user.id); // Handle both id formats if inconsistent
                                                    setManagerSearch('');
                                                    setManagerResults([]);
                                                }}
                                                className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors text-left"
                                            >
                                                <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-neutral-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                    {user.profile_picture_url ? (
                                                        <img src={user.profile_picture_url} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-gray-500">
                                                            {(user.first_name?.[0] || '?').toUpperCase()}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                        {user.first_name} {user.last_name}
                                                    </p>
                                                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <hr className="border-gray-200 dark:border-neutral-800" />

                    {/* Address Group */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                <span className="text-xl">📍</span> Dirección
                            </h4>
                            {(latitude || longitude) && (
                                <button
                                    type="button"
                                    onClick={handleReverseGeocode}
                                    disabled={loading}
                                    className="text-xs text-blue-500 hover:text-blue-400 underline"
                                >
                                    Rellenar desde coordenadas
                                </button>
                            )}
                        </div>

                        {/* Street & Numbers */}
                        <div className="grid grid-cols-12 gap-3">
                            <div className="col-span-12 md:col-span-6">
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Calle / Avenida</label>
                                <input
                                    type="text"
                                    value={street}
                                    onChange={(e) => setStreet(e.target.value)}
                                    placeholder="Ej: Av. Reforma"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm"
                                />
                            </div>
                            <div className="col-span-6 md:col-span-3">
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">No. Ext</label>
                                <input
                                    type="text"
                                    value={externalNumber}
                                    onChange={(e) => setExternalNumber(e.target.value)}
                                    placeholder="123"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm"
                                />
                            </div>
                            <div className="col-span-6 md:col-span-3">
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">No. Int</label>
                                <input
                                    type="text"
                                    value={internalNumber}
                                    onChange={(e) => setInternalNumber(e.target.value)}
                                    placeholder="PB"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm"
                                />
                            </div>
                        </div>

                        {/* Neighborhood & Zip */}
                        <div className="grid grid-cols-12 gap-3">
                            <div className="col-span-8">
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Colonia / Barrio</label>
                                <input
                                    type="text"
                                    value={neighborhood}
                                    onChange={(e) => setNeighborhood(e.target.value)}
                                    placeholder="Ej: Juárez"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm"
                                />
                            </div>
                            <div className="col-span-4">
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">C.P.</label>
                                <input
                                    type="text"
                                    value={zipCode}
                                    onChange={(e) => setZipCode(e.target.value)}
                                    placeholder="06600"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm"
                                />
                            </div>
                        </div>

                        {/* City, State, Country */}
                        <div className="grid grid-cols-12 gap-3">
                            <div className="col-span-12 md:col-span-4">
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Ciudad / Municipio</label>
                                <input
                                    type="text"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    placeholder="Cuauhtémoc"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm"
                                />
                            </div>
                            <div className="col-span-6 md:col-span-4">
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Estado</label>
                                <input
                                    type="text"
                                    value={state}
                                    onChange={(e) => setState(e.target.value)}
                                    placeholder="CDMX"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm"
                                />
                            </div>
                            <div className="col-span-6 md:col-span-4">
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">País</label>
                                <input
                                    type="text"
                                    value={country}
                                    onChange={(e) => setCountry(e.target.value)}
                                    placeholder="México"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm"
                                />
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleGeocode}
                            disabled={loading || !street || !city}
                            className="w-full py-2 text-sm font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            🌍 Calcular coordenadas desde campos
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-2">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Latitud</label>
                            <input
                                type="number"
                                step={0.000001}
                                value={latitude}
                                onChange={(e) => setLatitude(e.target.value)}
                                placeholder="-34.6037"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm font-mono"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Longitud</label>
                            <input
                                type="number"
                                step={0.000001}
                                value={longitude}
                                onChange={(e) => setLongitude(e.target.value)}
                                placeholder="-58.3816"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm font-mono"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-neutral-800 mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !name.trim()}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
