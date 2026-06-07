Reporte Parcial de Auditoría
SoftLIA – Panel de Administración de Empresa
Fecha: 06 de junio de 2026
Auditor: Israel Martínez
Estado de la auditoría: En progreso (interrumpida por error crítico de navegación)

Resumen Ejecutivo
Se realizó una revisión funcional de los módulos principales del Panel de Administración de Empresa de SoftLIA, incluyendo Usuarios, Rutas de Aprendizaje y Estructura Organizacional.
Durante la evaluación se identificaron incidencias de severidad alta y crítica que afectan procesos administrativos esenciales como la exportación de usuarios, la revocación de accesos, la gestión de estructuras organizacionales y la navegación interna de la plataforma.
La auditoría quedó temporalmente detenida debido a un error 404 que impide continuar el flujo de validación.
Resumen de Hallazgos
Severidad
Cantidad
Crítica
1
Alta
3
Media
2
Baja
1
Total
7


Hallazgo 1
Exportación de usuarios incompleta
Módulo: Usuarios
Severidad: Alta
Descripción
La exportación de usuarios no genera un archivo completo con la información de todos los miembros de la organización.
Resultado esperado
El archivo exportado debe contener la totalidad de usuarios registrados y todos los campos definidos por el sistema.
Resultado observado
El sistema muestra 7 usuarios registrados.
La exportación únicamente contiene información de un usuario.
Existen campos incompletos o vacíos.
La información exportada no coincide con la visible en pantalla.
Impacto
Generación de reportes administrativos incorrectos y pérdida de confiabilidad en la funcionalidad de exportación.
Recomendación
Validar la consulta de extracción de datos y el mapeo de columnas durante el proceso de exportación.

Hallazgo 2
Revocación de rutas no funcional
Módulo: Rutas de Aprendizaje
Severidad: Alta
Descripción
La opción de revocar rutas asignadas no elimina efectivamente el acceso del usuario.
Resultado esperado
Al revocar una asignación, el usuario debe perder acceso a la ruta y a sus contenidos asociados.
Resultado observado
Después de ejecutar la acción de revocación, el usuario continúa teniendo acceso a la ruta.
Impacto
Imposibilidad de administrar correctamente permisos y accesos dentro de la plataforma.
Recomendación
Verificar la actualización de relaciones usuario-ruta y la sincronización de permisos.

Hallazgo 3
Botón "Inicializar general" sin funcionamiento
Módulo: Estructura Organizacional
Severidad: Media
Descripción
El botón no ejecuta ninguna acción visible.
Resultado esperado
La acción debe ejecutarse o mostrar una notificación al usuario.
Resultado observado
No ocurre ninguna acción ni se presenta retroalimentación.
Impacto
Confusión respecto al estado y disponibilidad de la funcionalidad.
Recomendación
Revisar la implementación y agregar mensajes de estado.

Hallazgo 4
Flujo confuso en acceso a miembros
Módulo: Estructura Organizacional
Severidad: Media
Descripción
La funcionalidad de gestión de miembros parece depender de pasos previos que no son evidentes para el usuario.
Resultado esperado
El flujo debe ser intuitivo o indicar claramente los prerrequisitos.
Resultado observado
El botón parece no funcionar hasta que se crea una estructura organizacional.
Impacto
Curva de aprendizaje innecesaria y posible percepción de error.
Recomendación
Implementar estados guiados y mensajes informativos.

Hallazgo 5
Error visual en ficha de estructura
Módulo: Estructura Organizacional
Severidad: Baja
Descripción
El nombre comercial se sobrepone sobre elementos gráficos de la interfaz.
Resultado esperado
Todos los elementos deben mantener una separación visual adecuada.
Resultado observado
Existe superposición entre texto e iconografía.
Impacto
Afectación menor de la experiencia visual.
Recomendación
Ajustar espaciados y comportamiento responsive.

Hallazgo 6
Error NODE_NOT_FOUND al asignar miembros
Módulo: Estructura Organizacional
Severidad: Alta
Descripción
No es posible asignar usuarios a una estructura recién creada.
Resultado esperado
La asignación debe completarse exitosamente.
Resultado observado
El sistema devuelve el mensaje:
NODE_NOT_FOUND
La asignación no se realiza.
Impacto
Bloquea completamente la configuración de equipos y jerarquías organizacionales.
Recomendación
Revisar la generación, persistencia y consulta de identificadores de nodos.

Hallazgo 7
Error 404 que bloquea la auditoría
Módulo: Navegación / Dashboard Usuario Empresarial
Severidad: Crítica
Descripción
La plataforma redirige a una página inexistente durante la navegación.
Resultado esperado
Todas las rutas internas deben dirigir a páginas funcionales.
Resultado observado
Se muestra una página con el mensaje:
404 - Página no encontrada
Impacto
Interrupción total de la auditoría.
Imposibilidad de validar módulos posteriores.
Posible afectación a usuarios finales.
Recomendación
Revisar configuración de rutas, permisos y redirecciones del sistema.

Observaciones de Experiencia de Usuario
Flujo de creación de estructura organizacional
El proceso termina siendo funcional una vez comprendido, sin embargo inicialmente resulta poco intuitivo porque algunas funcionalidades dependen de la existencia previa de una estructura y esto no se comunica claramente al usuario.
Recomendación:
Implementar mensajes de ayuda, estados vacíos guiados o un flujo de onboarding para administradores.

Conclusión Parcial
La plataforma presenta una base funcional adecuada en los módulos revisados; sin embargo, existen incidencias importantes relacionadas con gestión de permisos, estructuras organizacionales y navegación interna. Particularmente preocupantes son el error de revocación de rutas, el fallo NODE_NOT_FOUND y el error 404 que actualmente impide continuar con la auditoría.
Estado actual: Auditoría suspendida temporalmente por incidencia crítica de navegación.
Próxima fase: Validación de módulos restantes una vez restablecido el acceso al flujo de usuario empresarial.

https://chatgpt.com/share/6a246cb3-bd74-83e8-8a65-1e428a0aef30
