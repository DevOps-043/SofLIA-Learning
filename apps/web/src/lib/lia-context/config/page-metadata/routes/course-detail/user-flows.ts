import type { UserFlow } from '../../types';

export const courseDetailUserFlows: UserFlow[] = [
      {
        name: 'Ver curso y comprar',
        steps: ['1. Ver información del curso', '2. Revisar temario', '3. Click en "Comprar"', '4. Ir al checkout'],
        commonBreakpoints: ['Paso 3: Error de precio', 'Paso 4: Error de carrito']
      },
      {
        name: 'Empezar curso gratuito',
        steps: ['1. Ver información', '2. Click en "Empezar Gratis"', '3. Ir a primera lección'],
        commonBreakpoints: ['Paso 2: Error de inscripción']
      }
    ];
