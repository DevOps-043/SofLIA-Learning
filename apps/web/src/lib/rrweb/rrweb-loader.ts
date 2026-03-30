/**
 * Cargador centralizado para módulos de rrweb
 * 
 * Este módulo centraliza la carga de rrweb y rrweb-player para evitar
 * cargas duplicadas y problemas de sincronización.
 */

// Tipos personalizados para rrweb sin usar typeof import (evita análisis estático de webpack)
export interface RrwebRecordOptions {
  emit: (event: any) => void;
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
  maskAllInputs?: boolean;
  slimDOMOptions?: Record<string, boolean>;
  blockClass?: string;
  blockSelector?: string | null;
  ignoreCSSAttributes?: Set<string>;
  maskInputOptions?: {
    password?: boolean;
    email?: boolean;
    tel?: boolean;
  };
}

export interface RrwebModule {
  record: (options: RrwebRecordOptions) => () => void;
  EventType?: Record<string, number>;
  [key: string]: any;
}

export interface RrwebPlayerModule {
  default: any;
  [key: string]: any;
}

// Estado global para evitar cargas duplicadas
let rrwebModule: RrwebModule | null = null;
let rrwebPlayerModule: RrwebPlayerModule | null = null;
let isRrwebLoading = false;
let isRrwebPlayerLoading = false;
let rrwebLoadPromise: Promise<RrwebModule | null> | null = null;
let rrwebPlayerLoadPromise: Promise<RrwebPlayerModule | null> | null = null;

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
      // Usar 'any' para evitar que TypeScript intente analizar el módulo
      const importedModule = await import('rrweb') as any;
      
      // El módulo puede tener diferentes estructuras de exportación
      // Intentar acceder a record de diferentes maneras
      let module: RrwebModule | null = null;
      
      // Caso 1: Exportación nombrada directa { record, ... }
      if (importedModule && typeof importedModule.record === 'function') {
        module = importedModule as RrwebModule;
      }
      // Caso 2: Exportación por defecto con record
      else if (importedModule?.default && typeof importedModule.default.record === 'function') {
        module = importedModule.default as RrwebModule;
      }
      // Caso 3: El módulo mismo es el objeto con record
      else if (importedModule && typeof (importedModule as any).record === 'function') {
        module = importedModule as RrwebModule;
      }
      
      // Verificar que el módulo tiene la función record
      if (!module || typeof module.record !== 'function') {
        console.error('❌ [rrweb-loader] rrweb module structure:', {
          hasModule: !!importedModule,
          hasDefault: !!importedModule?.default,
          hasRecord: typeof importedModule?.record,
          hasDefaultRecord: typeof importedModule?.default?.record,
          moduleKeys: importedModule ? Object.keys(importedModule) : [],
          defaultKeys: importedModule?.default ? Object.keys(importedModule.default) : [],
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
export async function loadRrwebPlayer(): Promise<any | null> {
  // Solo cargar en el cliente - verificación estricta
  if (!isBrowserEnvironment()) {
    return null;
  }
  
  // Cargar estilos CSS primero
  await loadRrwebPlayerStyles();

  // Si ya está cargado, retornarlo
  if (rrwebPlayerModule) {
    return rrwebPlayerModule.default || rrwebPlayerModule;
  }

  // Si ya está en proceso de carga, esperar a que termine
  if (isRrwebPlayerLoading && rrwebPlayerLoadPromise) {
    const module = await rrwebPlayerLoadPromise;
    return module ? (module.default || module) : null;
  }

  // Iniciar carga con manejo robusto de errores
  isRrwebPlayerLoading = true;
  rrwebPlayerLoadPromise = (async () => {
    try {
      // Usar import dinámico
      const importedModule = await import('rrweb-player') as any;
      
      // El módulo puede tener diferentes estructuras de exportación
      let module: RrwebPlayerModule | null = null;
      
      // Caso 1: Exportación por defecto
      if (importedModule?.default) {
        module = importedModule;
      }
      // Caso 2: Exportación nombrada
      else if (importedModule) {
        module = importedModule;
      }
      
      if (!module) {
        console.error('❌ [rrweb-loader] rrweb-player module structure:', {
          hasModule: !!importedModule,
          hasDefault: !!importedModule?.default,
          moduleKeys: importedModule ? Object.keys(importedModule) : [],
        });
        throw new Error('rrweb-player no está disponible en la estructura del módulo');
      }
      
      rrwebPlayerModule = module;
      isRrwebPlayerLoading = false;

      return module;
    } catch (error) {
      console.error('❌ [rrweb-loader] Error cargando rrweb-player:', error);
      isRrwebPlayerLoading = false;
      rrwebPlayerLoadPromise = null;
      rrwebPlayerModule = null;
      return null;
    }
  })();

  const module = await rrwebPlayerLoadPromise;
  return module ? (module.default || module) : null;
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

