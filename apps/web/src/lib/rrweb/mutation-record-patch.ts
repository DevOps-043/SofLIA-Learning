/**
 * Patch para MutationObserver - DEBE SER IMPORTADO PRIMERO
 * 
 * Este archivo aplica un patch al MutationObserver para hacer que las propiedades
 * de MutationRecord sean mutables, solucionando un bug conocido en rrweb alpha.
 * 
 * IMPORTANTE: Este archivo debe ser importado ANTES de cualquier otro módulo
 * que use rrweb o MutationObserver.
 */

declare global {
  interface Window {
    __mutationRecordPatchApplied?: boolean
    __mutationRecordErrorHandlerAdded?: boolean
  }
}

type MutableMutationData = Map<PropertyKey, unknown>

function isReadonlyMutationRecordError(error: unknown): error is TypeError {
  if (!(error instanceof TypeError) || !error.message) {
    return false
  }

  return (
    (error.message.includes('MutationRecord') ||
      error.message.includes('attributeName') ||
      error.message.includes('Cannot set property')) &&
    (error.message.includes('getter') ||
      error.message.includes('read-only') ||
      error.message.includes('which has only a getter'))
  )
}

if (typeof window !== 'undefined') {
  // Aplicar el patch inmediatamente al cargar el módulo
  // Usar una función auto-ejecutable para aplicar el patch antes de cualquier otra cosa
  (function() {
    // Solo aplicar si no se ha aplicado ya
    if (window.__mutationRecordPatchApplied) {
      return; // Ya está aplicado
    }

    // Guardar la implementación original
    const OriginalMutationObserver = window.MutationObserver;
    
    // Crear una versión parcheada que usa Proxy para hacer MutationRecords mutables
    window.MutationObserver = class PatchedMutationObserver extends OriginalMutationObserver {
      constructor(callback: MutationCallback) {
        const wrappedCallback: MutationCallback = (mutations, observer) => {
          try {
            // Crear proxies para cada MutationRecord que permitan escritura
            const proxiedMutations = mutations.map((mutation) => {
              // Crear un objeto mutable que almacene los valores originales
              const mutableData: MutableMutationData = new Map<PropertyKey, unknown>([
                ['type', mutation.type],
                ['target', mutation.target],
                ['addedNodes', mutation.addedNodes],
                ['removedNodes', mutation.removedNodes],
                ['previousSibling', mutation.previousSibling],
                ['nextSibling', mutation.nextSibling],
                ['attributeName', mutation.attributeName],
                ['attributeNamespace', mutation.attributeNamespace],
                ['oldValue', mutation.oldValue],
              ]);

              // Crear un Proxy más robusto que intercepte TODAS las operaciones
              return new Proxy(mutation, {
                get(target, prop, receiver) {
                  // Si la propiedad existe en los datos mutables, usar ese valor
                  if (mutableData.has(prop)) {
                    return mutableData.get(prop);
                  }
                  // De lo contrario, usar el valor original
                  const value = Reflect.get(target, prop, receiver);
                  return value;
                },
                set(target, prop, value, receiver) {
                  // SIEMPRE permitir escritura en los datos mutables
                  // Esto previene el error "Cannot set property attributeName"
                  if (mutableData.has(prop) || prop === 'attributeName' || prop === 'attributeNamespace' || prop === 'oldValue') {
                    mutableData.set(prop, value);
                    return true;
                  }
                  
                  // Para otras propiedades, intentar escribir en el target
                  // pero si falla (propiedad de solo lectura), guardar en mutableData
                  try {
                    const result = Reflect.set(target, prop, value, receiver);
                    if (result) {
                      // Si la escritura fue exitosa, también actualizar mutableData
                      mutableData.set(prop, value);
                    }
                    return result;
                  } catch {
                    // Si falla, guardar en mutableData para futuras lecturas
                    mutableData.set(prop, value);
                    return true;
                  }
                },
                has(target, prop) {
                  return mutableData.has(prop) || Reflect.has(target, prop);
                },
                ownKeys(target) {
                  const targetKeys = Reflect.ownKeys(target);
                  const mutableKeys = Array.from(mutableData.keys());
                  // Combinar y eliminar duplicados
                  return Array.from(new Set([...mutableKeys, ...targetKeys]));
                },
                getOwnPropertyDescriptor(target, prop) {
                  // Si la propiedad está en mutableData, devolver un descriptor mutable
                  if (mutableData.has(prop)) {
                    return {
                      enumerable: true,
                      configurable: true,
                      writable: true,
                      value: mutableData.get(prop),
                    };
                  }
                  // De lo contrario, usar el descriptor original
                  const descriptor = Reflect.getOwnPropertyDescriptor(target, prop);
                  // Si es una propiedad de solo lectura, hacerla mutable
                  if (descriptor && !descriptor.writable && (prop === 'attributeName' || prop === 'attributeNamespace')) {
                    return {
                      ...descriptor,
                      writable: true,
                      configurable: true,
                      value: mutableData.has(prop) ? mutableData.get(prop) : descriptor.value,
                    };
                  }
                  return descriptor;
                },
                defineProperty(target, prop, descriptor) {
                  // Permitir definir propiedades en mutableData
                  if (mutableData.has(prop) || prop === 'attributeName' || prop === 'attributeNamespace') {
                    if ('value' in descriptor) {
                      mutableData.set(prop, descriptor.value);
                    }
                    return true;
                  }
                  // Intentar definir en el target
                  try {
                    return Reflect.defineProperty(target, prop, descriptor);
                  } catch {
                    // Si falla, guardar en mutableData
                    if ('value' in descriptor) {
                      mutableData.set(prop, descriptor.value);
                    }
                    return true;
                  }
                },
              }) as MutationRecord;
            });

            // Llamar al callback con los proxies
            callback(proxiedMutations, observer);
          } catch {
            // Si el proxy falla, intentar con las mutaciones originales
            // pero capturar errores de solo lectura
            try {
              callback(mutations, observer);
            } catch (readOnlyError: unknown) {
              if (isReadonlyMutationRecordError(readOnlyError)) {
                // Ignorar este error específico - es un bug conocido de rrweb
                // No loguear en producción para evitar ruido
                if (process.env.NODE_ENV === 'development') {
                  console.warn('[MutationRecordPatch] Error de MutationRecord ignorado (bug conocido de rrweb):', readOnlyError.message);
                }
              } else {
                // Re-lanzar otros errores
                throw readOnlyError;
              }
            }
          }
        };

        super(wrappedCallback);
      }
    } as typeof MutationObserver;

    // Mantener compatibilidad con el prototipo original
    Object.setPrototypeOf(window.MutationObserver.prototype, OriginalMutationObserver.prototype);
    Object.setPrototypeOf(window.MutationObserver, OriginalMutationObserver);
    
    // Marcar como aplicado
    window.__mutationRecordPatchApplied = true;
    
    // Agregar handler global de errores para capturar errores no manejados
    if (!window.__mutationRecordErrorHandlerAdded) {
      const originalErrorHandler = window.onerror;
      window.onerror = function(message, source, lineno, colno, error) {
        // Capturar errores de MutationRecord que no fueron manejados
        if (isReadonlyMutationRecordError(error)) {
          // Ignorar este error - es un bug conocido de rrweb
          if (process.env.NODE_ENV === 'development') {
            console.warn('[MutationRecordPatch] Error global de MutationRecord capturado y suprimido:', error.message);
          }
          return true; // Indicar que el error fue manejado
        }
        
        // Llamar al handler original si existe
        if (originalErrorHandler) {
          return originalErrorHandler.call(this, message, source, lineno, colno, error);
        }
        return false;
      };
      
      // También capturar errores no manejados de promesas
      window.addEventListener('unhandledrejection', (event) => {
        const error = event.reason;
        if (isReadonlyMutationRecordError(error)) {
          // Prevenir que el error se propague
          event.preventDefault();
          if (process.env.NODE_ENV === 'development') {
            console.warn('[MutationRecordPatch] Error de promesa MutationRecord capturado y suprimido:', error.message);
          }
        }
      });
      
      window.__mutationRecordErrorHandlerAdded = true;
    }
  })();
}
