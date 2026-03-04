'use client';

/**
 * useActiveComponents
 * 
 * Hook para detectar componentes React activos en la página.
 * Usa data-attributes para identificar componentes importantes.
 * 
 * Uso:
 * 1. Agregar data-lia-component="ComponentName" a componentes importantes
 * 2. Opcionalmente agregar data-lia-props="JSON" para incluir props
 * 3. El hook detectará automáticamente estos componentes
 * 
 * Ejemplo:
 * <div data-lia-component="BusinessAssignCourseModal" data-lia-props='{"courseId":"123"}'>
 *   ...
 * </div>
 */

import { useEffect, useState, useCallback, useRef } from 'react';

export interface ActiveComponent {
  /** Nombre del componente */
  name: string;
  /** Selector CSS para identificar el elemento */
  selector: string;
  /** Props del componente (opcional) */
  props?: Record<string, unknown>;
  /** Estado del componente (opcional) */
  state?: string;
  /** Si el componente es visible en el viewport */
  isVisible?: boolean;
  /** Timestamp de detección */
  detectedAt: Date;
}

interface UseActiveComponentsOptions {
  /** Selector base para buscar componentes (default: [data-lia-component]) */
  selector?: string;
  /** Si debe observar cambios en el DOM */
  observe?: boolean;
  /** Intervalo de polling en ms (si observe es false) */
  pollInterval?: number;
  /** Si debe detectar visibilidad en viewport */
  detectVisibility?: boolean;
}

const DEFAULT_OPTIONS: UseActiveComponentsOptions = {
  selector: '[data-lia-component]',
  observe: true,
  pollInterval: 2000,
  detectVisibility: true,
};

/**
 * Hook para detectar componentes activos en la página
 */
export function useActiveComponents(options: UseActiveComponentsOptions = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const [components, setComponents] = useState<ActiveComponent[]>([]);
  const observerRef = useRef<MutationObserver | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Escanea el DOM buscando componentes marcados
   */
  const scanComponents = useCallback(() => {
    if (typeof document === 'undefined') return;

    const elements = document.querySelectorAll(config.selector || '[data-lia-component]');
    const foundComponents: ActiveComponent[] = [];

    elements.forEach((element) => {
      const name = element.getAttribute('data-lia-component');
      if (!name) return;

      // Parsear props si existen
      let props: Record<string, unknown> | undefined;
      const propsAttr = element.getAttribute('data-lia-props');
      if (propsAttr) {
        try {
          props = JSON.parse(propsAttr);
        } catch {
          // Ignorar props inválidos
        }
      }

      // Obtener estado si existe
      const state = element.getAttribute('data-lia-state') || undefined;

      // Detectar visibilidad
      let isVisible = true;
      if (config.detectVisibility) {
        const rect = element.getBoundingClientRect();
        isVisible = (
          rect.top < window.innerHeight &&
          rect.bottom > 0 &&
          rect.left < window.innerWidth &&
          rect.right > 0
        );
      }

      // Generar selector único
      const id = element.id ? `#${element.id}` : '';
      const classes = element.className ? `.${element.className.split(' ').filter(c => c).join('.')}` : '';
      const selector = id || classes || `[data-lia-component="${name}"]`;

      foundComponents.push({
        name,
        selector,
        props,
        state,
        isVisible,
        detectedAt: new Date(),
      });
    });

    setComponents(foundComponents);
  }, [config.selector, config.detectVisibility]);

  /**
   * Obtiene nombres de componentes únicos
   */
  const getComponentNames = useCallback(() => {
    return [...new Set(components.map(c => c.name))];
  }, [components]);

  /**
   * Obtiene componentes visibles
   */
  const getVisibleComponents = useCallback(() => {
    return components.filter(c => c.isVisible);
  }, [components]);

  /**
   * Obtiene componentes en formato para LIA
   */
  const getComponentsForLia = useCallback(() => {
    return components.map(c => ({
      name: c.name,
      selector: c.selector,
      props: c.props,
      state: c.state,
    }));
  }, [components]);

  /**
   * Busca un componente específico
   */
  const findComponent = useCallback((name: string) => {
    return components.find(c => c.name.toLowerCase() === name.toLowerCase());
  }, [components]);

  /**
   * Verifica si un componente está activo
   */
  const hasComponent = useCallback((name: string) => {
    return components.some(c => c.name.toLowerCase() === name.toLowerCase());
  }, [components]);

  /**
   * Configura el observer o polling
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Escaneo inicial
    scanComponents();

    if (config.observe) {
      // Usar MutationObserver para detectar cambios
      observerRef.current = new MutationObserver((mutations) => {
        // Solo re-escanear si hay cambios relevantes
        const hasRelevantChanges = mutations.some(mutation => {
          // Cambios en atributos de componentes LIA
          if (mutation.type === 'attributes' && 
              (mutation.target as Element).hasAttribute?.('data-lia-component')) {
            return true;
          }
          // Nodos agregados o removidos
          if (mutation.type === 'childList') {
            return true;
          }
          return false;
        });

        if (hasRelevantChanges) {
          scanComponents();
        }
      });

      observerRef.current.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['data-lia-component', 'data-lia-props', 'data-lia-state'],
      });
    } else if (config.pollInterval) {
      // Usar polling si observe está deshabilitado
      intervalRef.current = setInterval(scanComponents, config.pollInterval);
    }

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [config.observe, config.pollInterval, scanComponents]);

  // Re-escanear cuando cambia la URL (para SPAs)
  useEffect(() => {
    const handleRouteChange = () => {
      // Pequeño delay para permitir que React renderice
      setTimeout(scanComponents, 100);
    };

    window.addEventListener('popstate', handleRouteChange);

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [scanComponents]);

  return {
    /** Lista de componentes activos */
    components,
    /** Número de componentes detectados */
    componentCount: components.length,
    /** Si hay componentes detectados */
    hasComponents: components.length > 0,
    /** Fuerza un re-escaneo */
    rescan: scanComponents,
    /** Obtiene nombres únicos de componentes */
    getComponentNames,
    /** Obtiene solo componentes visibles */
    getVisibleComponents,
    /** Obtiene componentes en formato para SofLIA */
    getComponentsForLia,
    /** Busca un componente por nombre */
    findComponent,
    /** Verifica si un componente existe */
    hasComponent,
  };
}

export default useActiveComponents;

// ============================================================================
// UTILIDADES PARA MARCAR COMPONENTES
// ============================================================================

/**
 * Props helper para agregar data-attributes de SofLIA a un componente
 * 
 * @example
 * <div {...liaComponentProps('MyModal', { isOpen: true })}>
 */
export function liaComponentProps(
  name: string, 
  props?: Record<string, unknown>,
  state?: string
) {
  const attrs: Record<string, string> = {
    'data-lia-component': name,
  };

  if (props) {
    try {
      attrs['data-lia-props'] = JSON.stringify(props);
    } catch {
      // Ignorar si no se puede serializar
    }
  }

  if (state) {
    attrs['data-lia-state'] = state;
  }

  return attrs;
}

/**
 * HOC para envolver un componente con data-attributes de LIA
 */
export function withLiaComponent<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  const WrappedComponent = (props: P) => {
    return (
      <div data-lia-component={componentName}>
        <Component {...props} />
      </div>
    );
  };

  WrappedComponent.displayName = `LiaComponent(${componentName})`;
  return WrappedComponent;
}









