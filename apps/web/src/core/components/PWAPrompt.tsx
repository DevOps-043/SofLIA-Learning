'use client';

import { useEffect, useState } from 'react';
import { Download, Wifi, WifiOff } from 'lucide-react';

/**
 * PWA Install Prompt
 * 
 * Muestra botón de instalación cuando la app es instalable
 * y notificación de estado offline/online
 */
export function PWAPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [showOfflineNotice, setShowOfflineNotice] = useState(false);

  useEffect(() => {
    // Detectar evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    // Detectar cuando se instala la app
    const handleAppInstalled = () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    // Detectar estado de conexión
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineNotice(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineNotice(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Estado inicial
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
    }
    
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  return (
    <>
      {/* Botón de instalación */}
      {isInstallable && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom">
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-2 px-4 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg shadow-lg transition-all hover:scale-105"
          >
            <Download className="w-5 h-5" />
            <span className="font-medium">Instalar App</span>
          </button>
        </div>
      )}

      {/* Notificación de estado offline */}
      {showOfflineNotice && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top">
          <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 rounded-lg backdrop-blur-sm">
            <WifiOff className="w-4 h-4" />
            <span className="text-sm font-medium">Sin conexión - Usando cache</span>
          </div>
        </div>
      )}

      {/* Notificación cuando vuelve online */}
      {!isOnline && isOnline !== undefined && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top">
          <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 text-green-500 rounded-lg backdrop-blur-sm">
            <Wifi className="w-4 h-4" />
            <span className="text-sm font-medium">Conexión restaurada</span>
          </div>
        </div>
      )}
    </>
  );
}
