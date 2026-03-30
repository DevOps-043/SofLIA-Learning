'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Bell, Shield, Save, Loader2 } from 'lucide-react';
import { useAuth } from '../../features/auth/hooks/useAuth';

export default function AccountSettingsPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    marketing: false,
    courseUpdates: true,
    communityUpdates: false,
  });

  const [privacy, setPrivacy] = useState({
    profileVisibility: 'public',
    showEmail: false,
    showActivity: true,
  });

  // Cargar configuración actual
  useEffect(() => {
    const loadSettings = async () => {
      if (!user?.id) return;
      
      try {
        setIsLoading(true);
        const response = await fetch('/api/account-settings');
        if (response.ok) {
          const data = await response.json();
          if (data.privacy) {
            setPrivacy({
              profileVisibility: data.privacy.profileVisibility || 'public',
              showEmail: data.privacy.showEmail || false,
              showActivity: data.privacy.showActivity !== undefined ? data.privacy.showActivity : true,
            });
          }
          if (data.notifications) {
            setNotifications(data.notifications);
          }
        }
      } catch (error) {
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [user?.id]);

  // Guardar configuración
  const handleSave = async () => {
    if (!user?.id) return;

    try {
      setIsSaving(true);
      setSaveMessage(null);
      
      const response = await fetch('/api/account-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          privacy,
          notifications,
        }),
      });

      if (response.ok) {
        setSaveMessage({ type: 'success', text: 'Configuración guardada exitosamente' });
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        const error = await response.json();
        setSaveMessage({ type: 'error', text: error.error || 'Error al guardar la configuración' });
        setTimeout(() => setSaveMessage(null), 5000);
      }
    } catch (error) {
      setSaveMessage({ type: 'error', text: 'Error al guardar la configuración' });
      setTimeout(() => setSaveMessage(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0F1419] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#0A2540] dark:text-[#00D4B3] mx-auto mb-4" />
          <p className="text-[#0A2540] dark:text-white">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0F1419]">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#0A2540] dark:text-white mb-2">
              Configuración de la cuenta
            </h1>
            <p className="text-[#6C757D] dark:text-gray-400">
              Gestiona tu privacidad y preferencias de notificaciones
            </p>
          </div>

          {/* Mensaje de guardado */}
          {saveMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mb-6 p-4 rounded-lg ${
                saveMessage.type === 'success'
                  ? 'bg-green-500/10 border border-green-500/20 text-green-500'
                  : 'bg-red-500/10 border border-red-500/20 text-red-500'
              }`}
            >
              {saveMessage.text}
            </motion.div>
          )}

          {/* Sección de Privacidad */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-[#1E2329] rounded-xl p-6 mb-6 border border-[#E9ECEF] dark:border-[#6C757D]/30"
          >
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-6 h-6 text-[#0A2540] dark:text-[#00D4B3]" />
              <h2 className="text-xl font-semibold text-[#0A2540] dark:text-white">
                Privacidad
              </h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-[#0A2540] dark:text-white mb-2">
                  Visibilidad del perfil
                </label>
                <select
                  value={privacy.profileVisibility}
                  onChange={(e) =>
                    setPrivacy({
                      ...privacy,
                      profileVisibility: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-lg bg-white dark:bg-[#0F1419] text-[#0A2540] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0A2540]/50 focus:border-[#0A2540]/50"
                >
                  <option value="public">Público</option>
                  <option value="self">Yo</option>
                </select>
                <p className="text-xs text-[#6C757D] dark:text-gray-400 mt-1">
                  {privacy.profileVisibility === 'public'
                    ? 'Tu perfil será visible para todos los miembros de la comunidad'
                    : 'Solo tú podrás ver la información completa de tu perfil'}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#0A2540] dark:text-white">
                    Mostrar email en perfil
                  </p>
                  <p className="text-xs text-[#6C757D] dark:text-gray-400">
                    Permite que otros usuarios vean tu email
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={privacy.showEmail}
                    onChange={(e) =>
                      setPrivacy({ ...privacy, showEmail: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#E9ECEF] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#0A2540]/20 dark:peer-focus:ring-[#0A2540]/40 rounded-full peer dark:bg-[#0F1419] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#E9ECEF] after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-[#6C757D]/30 peer-checked:bg-[#0A2540] dark:peer-checked:bg-[#0A2540]"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#0A2540] dark:text-white">
                    Mostrar actividad
                  </p>
                  <p className="text-xs text-[#6C757D] dark:text-gray-400">
                    Muestra tu actividad reciente en tu perfil
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={privacy.showActivity}
                    onChange={(e) =>
                      setPrivacy({ ...privacy, showActivity: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#E9ECEF] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#0A2540]/20 dark:peer-focus:ring-[#0A2540]/40 rounded-full peer dark:bg-[#0F1419] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#E9ECEF] after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-[#6C757D]/30 peer-checked:bg-[#0A2540] dark:peer-checked:bg-[#0A2540]"></div>
                </label>
              </div>
            </div>
          </motion.div>

          {/* Sección de Notificaciones */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-[#1E2329] rounded-xl p-6 mb-6 border border-[#E9ECEF] dark:border-[#6C757D]/30"
          >
            <div className="flex items-center gap-3 mb-6">
              <Bell className="w-6 h-6 text-[#0A2540] dark:text-[#00D4B3]" />
              <h2 className="text-xl font-semibold text-[#0A2540] dark:text-white">
                Notificaciones
              </h2>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#0A2540] dark:text-white">
                    Notificaciones por email
                  </p>
                  <p className="text-xs text-[#6C757D] dark:text-gray-400">
                    Recibe notificaciones importantes por correo electrónico
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.email}
                    onChange={(e) =>
                      setNotifications({ ...notifications, email: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#E9ECEF] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#0A2540]/20 dark:peer-focus:ring-[#0A2540]/40 rounded-full peer dark:bg-[#0F1419] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#E9ECEF] after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-[#6C757D]/30 peer-checked:bg-[#0A2540] dark:peer-checked:bg-[#0A2540]"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#0A2540] dark:text-white">
                    Notificaciones push
                  </p>
                  <p className="text-xs text-[#6C757D] dark:text-gray-400">
                    Recibe notificaciones en tiempo real en tu dispositivo
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.push}
                    onChange={(e) =>
                      setNotifications({ ...notifications, push: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#E9ECEF] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#0A2540]/20 dark:peer-focus:ring-[#0A2540]/40 rounded-full peer dark:bg-[#0F1419] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#E9ECEF] after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-[#6C757D]/30 peer-checked:bg-[#0A2540] dark:peer-checked:bg-[#0A2540]"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#0A2540] dark:text-white">
                    Email de marketing
                  </p>
                  <p className="text-xs text-[#6C757D] dark:text-gray-400">
                    Recibe ofertas especiales y novedades
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.marketing}
                    onChange={(e) =>
                      setNotifications({
                        ...notifications,
                        marketing: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#E9ECEF] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#0A2540]/20 dark:peer-focus:ring-[#0A2540]/40 rounded-full peer dark:bg-[#0F1419] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#E9ECEF] after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-[#6C757D]/30 peer-checked:bg-[#0A2540] dark:peer-checked:bg-[#0A2540]"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#0A2540] dark:text-white">
                    Actualizaciones de cursos
                  </p>
                  <p className="text-xs text-[#6C757D] dark:text-gray-400">
                    Notificaciones cuando tus cursos se actualicen
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.courseUpdates}
                    onChange={(e) =>
                      setNotifications({
                        ...notifications,
                        courseUpdates: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#E9ECEF] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#0A2540]/20 dark:peer-focus:ring-[#0A2540]/40 rounded-full peer dark:bg-[#0F1419] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#E9ECEF] after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-[#6C757D]/30 peer-checked:bg-[#0A2540] dark:peer-checked:bg-[#0A2540]"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#0A2540] dark:text-white">
                    Actualizaciones de comunidad
                  </p>
                  <p className="text-xs text-[#6C757D] dark:text-gray-400">
                    Notificaciones sobre actividades en tus comunidades
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.communityUpdates}
                    onChange={(e) =>
                      setNotifications({
                        ...notifications,
                        communityUpdates: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#E9ECEF] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#0A2540]/20 dark:peer-focus:ring-[#0A2540]/40 rounded-full peer dark:bg-[#0F1419] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#E9ECEF] after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-[#6C757D]/30 peer-checked:bg-[#0A2540] dark:peer-checked:bg-[#0A2540]"></div>
                </label>
              </div>
            </div>
          </motion.div>

          {/* Botón de guardar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex justify-end"
          >
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 bg-[#0A2540] hover:bg-[#0d2f4d] disabled:bg-[#6C757D] disabled:cursor-not-allowed text-white font-medium px-6 py-3 rounded-lg transition-colors shadow-sm hover:shadow-md"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Guardar cambios
                </>
              )}
            </button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
