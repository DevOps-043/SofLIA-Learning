import type { UserFlow } from '../../types';

export const adminCompaniesUserFlows: UserFlow[] = [
      {
        name: 'Crear nueva empresa',
        steps: [
          '1. Click en "Nueva Empresa"',
          '2. Completar formulario con datos',
          '3. Subir logo (opcional)',
          '4. Configurar permisos y cursos',
          '5. Guardar empresa'
        ],
        commonBreakpoints: [
          'Paso 2: Validación de slug falla',
          'Paso 3: Error subiendo imagen',
          'Paso 5: Error guardando'
        ]
      }
    ];
