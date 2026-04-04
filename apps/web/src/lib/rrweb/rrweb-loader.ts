/**
 * Cargador centralizado para módulos de rrweb
 * 
 * Este módulo centraliza la carga de rrweb y rrweb-player para evitar
 * cargas duplicadas y problemas de sincronización.
 */

import type { eventWithTime } from '@rrweb/types'

type DynamicImportModule = Record<string, unknown> & {
  default?: unknown
  record?: unknown
}

export interface RrwebPlayerInstance {
  pause?: () => void
  destroy?: () => void
  [key: string]: unknown
}

export interface RrwebPlayerConstructor {
  new (options: {
    target: HTMLElement
    props: Record<string, unknown>
  }): RrwebPlayerInstance
}

// Tipos personalizados para rrweb sin usar typeof import (evita análisis estático de webpack)
export interface RrwebRecordOptions {
  emit: (event: eventWithTime) => void;
  checkoutEveryNms?: number;
  checkoutEveryNth?: number;
  recordCanvas?: boolean;
  recordCrossOriginIframes?: boolean;
  collectFonts?: boolean;
  inlineStylesheet?: boolean;
  sampling?: {
    mousemove?: boolean;
    mousemoveCallback?: number;
    mouseInteraction?: {
      MouseUp?: boolean;
      MouseDown?: boolean;
      Click?: boolean;
      ContextMenu?: boolean;
      DblClick?: boolean;
      Focus?: boolean;
      Blur?: boolean;
      TouchStart?: boolean;
      TouchEnd?: boolean;
    };
    scroll?: number;
    media?: number;
    input?: 'last' | boolean;
  };
  ignoreClass?: string;
  maskTextClass?: string;
  maskTextSelector?: string;
  maskAllInputs?: boolean;
  slimDOMOptions?: Record<string, boolean>;
  blockClass?: string;
  blockSelector?: string | null;
  ignoreCSSAttributes?: Set<string>;
  maskInputFn?: (text: string, element: HTMLElement) => string;
  maskTextFn?: (text: string, element: HTMLElement | null) => string;
  maskInputOptions?: {
    password?: boolean;
    email?: boolean;
    tel?: boolean;
    text?: boolean;
    textarea?: boolean;
    search?: boolean;
    url?: boolean;
  };
}

export interface RrwebModule {
  record: (options: RrwebRecordOptions) => () => void;
  EventType?: Record<string, number>;
  [key: string]: unknown;
}

// Estado global para evitar cargas duplicadas
let rrwebModule: RrwebModule | null = null;
let rrwebPlayerModule: RrwebPlayerConstructor | null = null;
let isRrwebLoading = false;
let isRrwebPlayerLoading = false;
let rrwebLoadPromise: Promise<RrwebModule | null> | null = null;
let rrwebPlayerLoadPromise: Promise<RrwebPlayerConstructor | null> | null = null;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isRrwebModule(value: unknown): value is RrwebModule {
  return isRecord(value) && typeof value.record === 'function'
}

function isRrwebPlayerConstructor(value: unknown): value is RrwebPlayerConstructor {
  return typeof value === 'function'
}

/**
 * Verifica que estamos en un entorno de navegador válido
 */
function isBrowserEnvironment(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }

  try {
    return !!(window && document);
  } catch {
    return false;
  }
}

/**
 * Carga dinámicamente el módulo rrweb solo en el cliente
 * 
 * @returns Promise que resuelve con el módulo rrweb o null si falla
 */
export async function loadRrweb(): Promise<RrwebModule | null> {
  // Solo cargar en el cliente - verificación estricta
  if (!isBrowserEnvironment()) {
    return null;
  }

  // Si ya está cargado, retornarlo
  if (rrwebModule) {
    return rrwebModule;
  }

  // Si ya está en proceso de carga, esperar a que termine
  if (isRrwebLoading && rrwebLoadPromise) {
    return rrwebLoadPromise;
  }

  // Iniciar carga con manejo robusto de errores
  isRrwebLoading = true;
  rrwebLoadPromise = (async () => {
    try {
      // Usar import dinámico con verificación adicional
      const importedModule = await import('rrweb') as DynamicImportModule;
      
      // El módulo puede tener diferentes estructuras de exportación
      // Intentar acceder a record de diferentes maneras
      let module: RrwebModule | null = null;
      
      // Caso 1: Exportación nombrada directa { record, ... }
      if (isRrwebModule(importedModule)) {
        module = importedModule;
      }
      // Caso 2: Exportación por defecto con record
      else if (isRrwebModule(importedModule.default)) {
        module = importedModule.default;
      }
      
      // Verificar que el módulo tiene la función record
      if (!module || typeof module.record !== 'function') {
        console.error('❌ [rrweb-loader] rrweb module structure:', {
          hasModule: !!importedModule,
          hasDefault: !!importedModule?.default,
          hasRecord: typeof importedModule?.record,
          hasDefaultRecord: typeof importedModule?.default?.record,
          moduleKeys: Object.keys(importedModule),
          defaultKeys: isRecord(importedModule.default) ? Object.keys(importedModule.default) : [],
        });
        throw new Error('rrweb.record no está disponible en la estructura del módulo');
      }
      
      rrwebModule = module;
      isRrwebLoading = false;

      return module;
    } catch (error) {
      console.error('❌ [rrweb-loader] Error cargando rrweb:', error);
      isRrwebLoading = false;
      rrwebLoadPromise = null;
      rrwebModule = null;
      return null;
    }
  })();

  return rrwebLoadPromise;
}

/**
 * Carga los estilos CSS de rrweb-player
 */
async function loadRrwebPlayerStyles(): Promise<void> {
  if (typeof document === 'undefined') return;
  
  // Verificar si ya se cargaron los estilos
  const existingStyle = document.getElementById('rrweb-player-styles');
  if (existingStyle) return;
  
  try {
    // Crear un elemento style con los estilos necesarios
    const styleElement = document.createElement('style');
    styleElement.id = 'rrweb-player-styles';
    styleElement.textContent = `
      /* Estilos mínimos */
      .rr-player { background: #0f0f23 !important; }
      .rr-player__frame { background: #1a1a2e !important; }
      .replayer-mouse { 
        width: 16px; height: 16px; border-radius: 50%;
        background: #ff6b6b; border: 2px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      }
    `;
    document.head.appendChild(styleElement);
  } catch (error) {
    console.warn('⚠️ Error cargando estilos de rrweb-player:', error);
  }
}

/**
 * Carga dinámicamente el módulo rrweb-player solo en el cliente
 * 
 * @returns Promise que resuelve con el módulo rrweb-player o null si falla
 */
export async function loadRrwebPlayer(): Promise<RrwebPlayerConstructor | null> {
  // Solo cargar en el cliente - verificación estricta
  if (!isBrowserEnvironment()) {
    return null;
  }
  
  // Cargar estilos CSS primero
  await loadRrwebPlayerStyles();

  // Si ya está cargado, retornarlo
  if (rrwebPlayerModule) {
    return rrwebPlayerModule;
  }

  // Si ya está en proceso de carga, esperar a que termine
  if (isRrwebPlayerLoading && rrwebPlayerLoadPromise) {
    return rrwebPlayerLoadPromise;
  }

  // Iniciar carga con manejo robusto de errores
  isRrwebPlayerLoading = true;
  rrwebPlayerLoadPromise = (async () => {
    try {
      // Usar import dinámico
      const importedModule = await import('rrweb-player') as DynamicImportModule;
      
      // El módulo puede tener diferentes estructuras de exportación
      let playerConstructor: RrwebPlayerConstructor | null = null;
      
      // Caso 1: Exportación por defecto
      if (isRrwebPlayerConstructor(importedModule.default)) {
        playerConstructor = importedModule.default;
      }
      // Caso 2: Exportación nombrada
      else if (isRrwebPlayerConstructor(importedModule)) {
        playerConstructor = importedModule;
      }
      
      if (!playerConstructor) {
        console.error('❌ [rrweb-loader] rrweb-player module structure:', {
          hasModule: !!importedModule,
          hasDefault: !!importedModule?.default,
          moduleKeys: Object.keys(importedModule),
        });
        throw new Error('rrweb-player no está disponible en la estructura del módulo');
      }
      
      rrwebPlayerModule = playerConstructor;
      isRrwebPlayerLoading = false;

      return playerConstructor;
    } catch (error) {
      console.error('❌ [rrweb-loader] Error cargando rrweb-player:', error);
      isRrwebPlayerLoading = false;
      rrwebPlayerLoadPromise = null;
      rrwebPlayerModule = null;
      return null;
    }
  })();

  return rrwebPlayerLoadPromise;
}

/**
 * Verifica si rrweb está disponible
 */
export function isRrwebAvailable(): boolean {
  return rrwebModule !== null;
}

/**
 * Verifica si rrweb-player está disponible
 */
export function isRrwebPlayerAvailable(): boolean {
  return rrwebPlayerModule !== null;
}

/**
 * Limpia el caché de módulos cargados (útil para testing)
 */
export function clearRrwebCache(): void {
  rrwebModule = null;
  rrwebPlayerModule = null;
  isRrwebLoading = false;
  isRrwebPlayerLoading = false;
  rrwebLoadPromise = null;
  rrwebPlayerLoadPromise = null;
}
