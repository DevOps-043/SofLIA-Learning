'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Building2,
  Map,
  Users,
  UserCheck,
  UserX,
  Shield,
  Zap,
  ToggleLeft,
  ToggleRight,
  CheckCircle2,
  AlertTriangle,
  Settings,
  UserPlus,
  ClipboardCheck,
  Layers,
  Sparkles
} from 'lucide-react';
import { useHierarchy } from '../../hooks/useHierarchy';
import { ROLE_LABELS } from '../../types/hierarchy.types';
import type { HierarchyConfig } from '../../types/hierarchy.types';

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function HierarchySettings() {
  const { t } = useTranslation('common');
  const {
    config,
    stats,
    isLoading,
    isLoadingConfig,
    isLoadingStats,
    error,
    isHierarchyEnabled,
    hasStructure,
    hasUnassignedUsers,
    canEnableHierarchy,
    loadConfig,
    loadStats,
    updateConfig,
    enableHierarchy,
    disableHierarchy,
    seedDefaultStructure,
    clearError
  } = useHierarchy();

  const [showConfirmEnable, setShowConfirmEnable] = useState(false);
  const [showConfirmDisable, setShowConfirmDisable] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    loadConfig();
    loadStats();
  }, [loadConfig, loadStats]);

  const handleCreateStructure = async () => {
    setActionError(null);
    const result = await seedDefaultStructure();
    if (!result.success) {
      setActionError(result.error || 'Error al crear estructura');
    }
  };

  const handleEnableHierarchy = async () => {
    setActionError(null);
    const result = await enableHierarchy();
    if (result.success) {
      setShowConfirmEnable(false);
    } else {
      setActionError(result.error || 'Error al activar');
    }
  };

  const handleDisableHierarchy = async () => {
    setActionError(null);
    const result = await disableHierarchy();
    if (result.success) {
      setShowConfirmDisable(false);
    } else {
      setActionError(result.error || 'Error al desactivar');
    }
  };

  // Loading state
  if (isLoadingConfig || isLoadingStats) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-neutral-400 dark:text-neutral-500 text-sm">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Errores */}
      {(error || actionError) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl"
        >
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-400 flex-1">{error || actionError}</p>
          <button
            onClick={() => { clearError(); setActionError(null); }}
            className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded-lg hover:bg-red-500/10 transition-colors"
          >
            Cerrar
          </button>
        </motion.div>
      )}

      {/* Header Card - Estado y Estadísticas */}
      <div className="bg-white dark:bg-[#1E2329] border border-neutral-200 dark:border-white/5 rounded-2xl p-6 relative overflow-hidden">
        {/* Decorative gradient */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-500/5 dark:from-blue-500/10 to-transparent rounded-bl-full pointer-events-none" />

        <div className="relative">
          {/* Title row */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                  Estructura Jerárquica
                </h2>
                <p className="text-sm text-neutral-500 dark:text-white/40 mt-0.5">
                  Organiza tu equipo en niveles para segmentar acceso y datos
                </p>
              </div>
            </div>
            <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${isHierarchyEnabled
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                : 'bg-neutral-100 dark:bg-white/5 text-neutral-500 dark:text-white/40 border border-neutral-200 dark:border-white/10'
              }`}>
              {isHierarchyEnabled ? '● Activa' : '○ Inactiva'}
            </span>
          </div>

          {/* Stat cards grid */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
              <StatCard icon={Map} label="Regiones" value={stats.regions_count} color="blue" />
              <StatCard icon={Layers} label="Zonas" value={stats.zones_count} color="purple" />
              <StatCard icon={Users} label="Equipos" value={stats.teams_count} color="cyan" />
              <StatCard icon={UserCheck} label="Asignados" value={stats.users_assigned} color="emerald" />
              <StatCard
                icon={UserX}
                label="Sin asignar"
                value={stats.users_unassigned}
                color={stats.users_unassigned > 0 ? 'amber' : 'neutral'}
              />
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            {/* Seed button */}
            {!hasStructure && (
              <div className="flex items-center gap-4 p-4 bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/10 dark:border-blue-500/20 rounded-xl">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-neutral-900 dark:text-white">Comenzar con estructura básica</p>
                  <p className="text-xs text-neutral-500 dark:text-white/40">
                    Crea una región, zona y equipo inicial automáticamente
                  </p>
                </div>
                <button
                  onClick={handleCreateStructure}
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isLoading ? 'Creando...' : 'Crear'}
                </button>
              </div>
            )}

            {/* Enable / Disable */}
            {hasStructure && (
              <div className="flex items-center gap-4">
                {!isHierarchyEnabled ? (
                  <button
                    onClick={() => setShowConfirmEnable(true)}
                    disabled={!canEnableHierarchy || isLoading}
                    className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-emerald-500 to-teal-500 shadow-emerald-500/25"
                  >
                    <span className="flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Activar jerarquía
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={() => setShowConfirmDisable(true)}
                    disabled={isLoading}
                    className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-white/60 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 border border-neutral-200 dark:border-white/10 hover:border-red-200 dark:hover:border-red-500/20"
                  >
                    Desactivar jerarquía
                  </button>
                )}
              </div>
            )}

            {/* Warning: unassigned users */}
            {hasStructure && hasUnassignedUsers && !isHierarchyEnabled && (
              <div className="flex items-center gap-3 p-3 bg-amber-500/5 dark:bg-amber-500/10 rounded-xl border border-amber-500/10 dark:border-amber-500/20">
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  Hay <strong>{stats?.users_unassigned}</strong> usuario(s) sin equipo asignado. Asígnelos antes de activar.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Comportamiento de Usuarios */}
      <UserBehaviorSettings config={config} updateConfig={updateConfig} />

      {/* Roles y Permisos */}
      <RolesSection />

      {/* Modales de confirmación */}
      {showConfirmEnable && (
        <ConfirmModal
          title="Activar jerarquía"
          message="Al activar, los usuarios solo podrán ver datos dentro de su ámbito asignado (equipo, zona o región). ¿Desea continuar?"
          confirmLabel="Activar"
          confirmVariant="success"
          onConfirm={handleEnableHierarchy}
          onCancel={() => setShowConfirmEnable(false)}
          isLoading={isLoading}
        />
      )}
      {showConfirmDisable && (
        <ConfirmModal
          title="Desactivar jerarquía"
          message="Al desactivar, todos los usuarios podrán ver todos los datos. La estructura se mantiene pero no se aplican restricciones."
          confirmLabel="Desactivar"
          confirmVariant="danger"
          onConfirm={handleDisableHierarchy}
          onCancel={() => setShowConfirmDisable(false)}
          isLoading={isLoading}
        />
      )}
    </motion.div>
  );
}

// ============================================
// COMPONENTE: Comportamiento de Usuarios
// ============================================

function UserBehaviorSettings({
  config,
  updateConfig
}: {
  config: HierarchyConfig | null;
  updateConfig: (config: Partial<HierarchyConfig>) => Promise<boolean>;
}) {
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [savedField, setSavedField] = useState<string | null>(null);

  const handleToggle = async (field: 'auto_assign_new_users' | 'require_team_assignment', currentValue: boolean) => {
    setIsSaving(field);
    setSavedField(null);
    const success = await updateConfig({ [field]: !currentValue });
    setIsSaving(null);
    if (success) {
      setSavedField(field);
      setTimeout(() => setSavedField(null), 2000);
    }
  };

  const toggleItems = [
    {
      key: 'auto_assign_new_users' as const,
      icon: UserPlus,
      label: 'Auto-asignar nuevos usuarios',
      description: 'Los nuevos miembros se asignarán automáticamente al equipo predeterminado al unirse a la organización.',
      value: config?.auto_assign_new_users ?? false,
      color: 'blue'
    },
    {
      key: 'require_team_assignment' as const,
      icon: ClipboardCheck,
      label: 'Requerir equipo asignado',
      description: 'Los usuarios deben tener un equipo asignado para acceder a la plataforma. Los usuarios sin equipo verán un aviso.',
      value: config?.require_team_assignment ?? false,
      color: 'purple'
    },
  ];

  return (
    <div className="bg-white dark:bg-[#1E2329] border border-neutral-200 dark:border-white/5 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
          <Settings className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
            Comportamiento de Usuarios
          </h3>
          <p className="text-sm text-neutral-500 dark:text-white/40">
            Configura cómo se gestionan los usuarios dentro de la jerarquía
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {toggleItems.map(item => {
          const Icon = item.icon;
          const isActive = item.value;
          const isBusy = isSaving === item.key;
          const justSaved = savedField === item.key;

          return (
            <motion.div
              key={item.key}
              whileHover={{ scale: 1.005 }}
              transition={{ duration: 0.15 }}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 ${isActive
                  ? 'bg-blue-500/5 dark:bg-blue-500/5 border-blue-500/15 dark:border-blue-500/15'
                  : 'bg-neutral-50 dark:bg-white/[0.02] border-neutral-100 dark:border-white/5 hover:border-neutral-200 dark:hover:border-white/10'
                }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${isActive
                  ? 'bg-blue-500/10 dark:bg-blue-500/15'
                  : 'bg-neutral-100 dark:bg-white/5'
                }`}>
                <Icon className={`w-5 h-5 transition-colors ${isActive
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-neutral-400 dark:text-white/30'
                  }`} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                    {item.label}
                  </p>
                  {justSaved && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      Guardado
                    </motion.span>
                  )}
                </div>
                <p className="text-xs text-neutral-500 dark:text-white/40 mt-0.5 leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                role="switch"
                aria-checked={isActive}
                disabled={isBusy}
                onClick={() => handleToggle(item.key, isActive)}
                className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#1E2329] disabled:opacity-50 disabled:cursor-not-allowed ${isActive
                    ? 'bg-blue-600'
                    : 'bg-neutral-300 dark:bg-white/15'
                  }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition-transform duration-300 ease-in-out mt-1 ml-1 ${isActive ? 'translate-x-5' : 'translate-x-0'
                    }`}
                />
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// COMPONENTE: Roles y Permisos
// ============================================

function RolesSection() {
  const roleData = [
    { role: 'owner', icon: '👑', scope: 'Toda la organización', color: 'amber' },
    { role: 'admin', icon: '⚙️', scope: 'Según asignación', color: 'blue' },
    { role: 'regional_manager', icon: '🌍', scope: 'Región asignada', color: 'emerald' },
    { role: 'zone_manager', icon: '📍', scope: 'Zona asignada', color: 'purple' },
    { role: 'team_leader', icon: '🎯', scope: 'Equipo asignado', color: 'cyan' },
    { role: 'node_manager', icon: '🏢', scope: 'Nodo específico', color: 'indigo' },
    { role: 'member', icon: '👤', scope: 'Solo su equipo', color: 'neutral' },
  ];

  return (
    <div className="bg-white dark:bg-[#1E2329] border border-neutral-200 dark:border-white/5 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
            Roles y Permisos
          </h3>
          <p className="text-sm text-neutral-500 dark:text-white/40">
            Cada rol determina el alcance de acceso a datos dentro de la jerarquía
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {roleData.map(({ role, icon, scope }) => (
          <div
            key={role}
            className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-white/[0.02] border border-neutral-100 dark:border-white/5 hover:border-neutral-200 dark:hover:border-white/10 transition-colors"
          >
            <span className="text-lg flex-shrink-0">{icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                {ROLE_LABELS[role as keyof typeof ROLE_LABELS]}
              </p>
              <p className="text-xs text-neutral-500 dark:text-white/40">
                {scope}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// COMPONENTE: Stat Card
// ============================================

type StatColor = 'blue' | 'purple' | 'cyan' | 'emerald' | 'amber' | 'neutral';

function StatCard({
  icon: Icon,
  label,
  value,
  color = 'neutral'
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color?: StatColor;
}) {
  const colorMap: Record<StatColor, { bg: string; icon: string; value: string }> = {
    blue: {
      bg: 'bg-blue-500/5 dark:bg-blue-500/10 border-blue-500/10 dark:border-blue-500/15',
      icon: 'text-blue-500 dark:text-blue-400',
      value: 'text-blue-700 dark:text-blue-300'
    },
    purple: {
      bg: 'bg-purple-500/5 dark:bg-purple-500/10 border-purple-500/10 dark:border-purple-500/15',
      icon: 'text-purple-500 dark:text-purple-400',
      value: 'text-purple-700 dark:text-purple-300'
    },
    cyan: {
      bg: 'bg-cyan-500/5 dark:bg-cyan-500/10 border-cyan-500/10 dark:border-cyan-500/15',
      icon: 'text-cyan-500 dark:text-cyan-400',
      value: 'text-cyan-700 dark:text-cyan-300'
    },
    emerald: {
      bg: 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/10 dark:border-emerald-500/15',
      icon: 'text-emerald-500 dark:text-emerald-400',
      value: 'text-emerald-700 dark:text-emerald-300'
    },
    amber: {
      bg: 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/10 dark:border-amber-500/15',
      icon: 'text-amber-500 dark:text-amber-400',
      value: 'text-amber-700 dark:text-amber-300'
    },
    neutral: {
      bg: 'bg-neutral-50 dark:bg-white/5 border-neutral-100 dark:border-white/5',
      icon: 'text-neutral-400 dark:text-white/30',
      value: 'text-neutral-700 dark:text-white/60'
    },
  };

  const colors = colorMap[color];

  return (
    <div className={`rounded-xl p-3.5 border ${colors.bg}`}>
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className={`w-4 h-4 ${colors.icon}`} />
        <p className="text-[11px] font-semibold text-neutral-500 dark:text-white/40 uppercase tracking-wider">
          {label}
        </p>
      </div>
      <p className={`text-2xl font-bold ${colors.value}`}>
        {value}
      </p>
    </div>
  );
}

// ============================================
// COMPONENTE: Modal de Confirmación
// ============================================

function ConfirmModal({
  title,
  message,
  confirmLabel,
  confirmVariant = 'default',
  onConfirm,
  onCancel,
  isLoading
}: {
  title: string;
  message: string;
  confirmLabel: string;
  confirmVariant?: 'default' | 'success' | 'danger' | 'neutral';
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}) {
  const buttonStyles: Record<string, string> = {
    default: 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/25',
    success: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25',
    danger: 'bg-red-600 hover:bg-red-700 shadow-red-600/25',
    neutral: 'bg-neutral-600 hover:bg-neutral-700 shadow-neutral-600/25',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-white dark:bg-[#1E2329] rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl border border-neutral-200 dark:border-white/10"
      >
        <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">
          {title}
        </h3>
        <p className="text-neutral-600 dark:text-white/50 text-sm leading-relaxed mb-6">
          {message}
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2.5 text-neutral-600 dark:text-white/60 hover:bg-neutral-100 dark:hover:bg-white/5 rounded-xl text-sm font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-5 py-2.5 text-white rounded-xl text-sm font-bold disabled:opacity-50 shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] ${buttonStyles[confirmVariant]}`}
          >
            {isLoading ? 'Procesando...' : confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default HierarchySettings;
