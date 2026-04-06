Resumen ejecutivo

La reunión se centró en revisar el comportamiento actual del planificador de la plataforma y alinear su lógica con el modelo de producto y negocio B2B, especialmente para usuarios tipo C-level y para esquemas de asignación gestionados por recursos humanos / capacitación. El problema central identificado fue que el sistema está planificando automáticamente todos los cursos asignados al iniciar la conversación con Soflía, cuando la expectativa funcional es que la planificación sea por curso y que la lógica de rutas de aprendizaje todavía no está implementada ni suficientemente reflejada en el flujo actual.

Como resultado general, se acordó replantear el planificador para que contemple dos dimensiones clave: estructura organizacional y rutas de estudio / learning paths. También se detectó un error técnico relevante en la vinculación con Google/Microsoft que reinicia la página y rompe el hilo conversacional. La liberación se perfila para martes, condicionada a pruebas adicionales por parte de Israel y a que los ajustes críticos del planificador queden resueltos.

Objetivo de la reunión

Alinear el diseño funcional del planificador con:

la lógica real del producto de cursos,
la diferencia entre curso individual y ruta de aprendizaje,
el modelo de asignación y control en contexto B2B,
la necesidad de equilibrar flexibilidad para el usuario con control administrativo y capacidad de reporte.
Hechos relevantes
Fernando estuvo trabajando principalmente en el planificador y detectó errores funcionales y de flujo.
Existe un error al vincular cuenta de Google o Microsoft: la página se refresca / reinicia y se pierde el hilo de la conversación con Soflía (aprox. 00:00:20–00:00:50).
El planificador ya genera una propuesta en función del calendario del usuario (aprox. 00:00:50–00:01:10).
Actualmente, al iniciar la conversación, Soflía muestra los cursos asignados y planifica los tres cursos directamente, en lugar de partir de una selección explícita del curso a planificar (aprox. 00:01:10–00:01:40).
La lógica de rutas de aprendizaje todavía está pendiente de construcción / formalización dentro del sistema (aprox. 00:01:40–00:02:30 y 00:19:00–00:20:10).
El producto está pensado para clientes B2B, con participación de recursos humanos / capacitación y foco en C-levels en México.
Se asume un diseño instruccional de tipo microlearning, donde un C-level probablemente tomaría 1 o máximo 2 lecciones por día (aprox. 00:02:20–00:03:30).
La configuración empresarial debe considerar horarios laborales, días hábiles, festivos y excepciones propias de cada organización (aprox. 00:07:00–00:08:40).
Israel debe probar antes de liberar; la fecha estimada de liberación se movió a martes (aprox. 00:20:50–00:21:55).
Problemas detectados

1. Reinicio de sesión / pérdida de contexto al vincular Google o Microsoft
   Descripción: Al conectar una cuenta de Google o Microsoft, la página se refresca o reinicia, provocando la pérdida del hilo de conversación.
   Área afectada: Integraciones, autenticación, UX conversacional.
   Impacto: Interrumpe la experiencia, rompe continuidad del flujo y puede invalidar la interacción previa con el planificador.
   Evidencia: Fernando lo reporta al inicio de su intervención (aprox. 00:00:20–00:00:50).
2. El planificador intenta planificar todos los cursos asignados al mismo tiempo
   Descripción: Soflía muestra los cursos asignados y procede a planificar los tres cursos, sin pedir al usuario que seleccione cuál desea planificar.
   Área afectada: Planificador, UX, lógica de negocio.
   Impacto: Genera un flujo inconsistente con la definición del producto, aumenta complejidad innecesaria y puede saturar o confundir al usuario.
   Evidencia: Fernando señala que esperaba que el usuario escogiera el curso a planificar (aprox. 00:01:00–00:01:40).
3. La lógica de rutas de aprendizaje no está modelada en el flujo actual
   Descripción: Se reconoce que faltan los learning paths / rutas de aprendizaje que agrupan cursos por categoría y eventualmente definen secuencias.
   Área afectada: Producto, arquitectura funcional, planificador.
   Impacto: El sistema no distingue entre cursos independientes y rutas secuenciales; esto provoca comportamientos erróneos al tener varios cursos asignados.
   Evidencia: Ernesto explica que este pendiente ya existía y que antes solo tenían un curso, por lo que el problema no se había manifestado igual (aprox. 00:01:40–00:04:10 y 00:18:50–00:20:10).
4. Inconsistencia entre flexibilidad del usuario y control administrativo B2B
   Descripción: Existe tensión entre permitir al usuario —en especial a C-levels— tomar el curso con flexibilidad, y mantener ventanas de inicio/fin definidas por la empresa.
   Área afectada: Lógica de negocio, configuración empresarial, UX, reporting.
   Impacto: Si se controla demasiado, puede afectar adopción; si se flexibiliza demasiado, puede afectar cumplimiento, trazabilidad y valor comercial B2B.
   Evidencia: Debate entre Fernando y Ernesto sobre fechas, horarios y diferencias entre C-levels y otros empleados (aprox. 00:06:00–00:16:30).
5. Reglas incompletas sobre horarios permitidos y validez de reportes
   Descripción: Se menciona que, por cumplimiento laboral y certificación, los cursos deberían relacionarse con horarios laborales; al mismo tiempo, se explora permitir consumo fuera de horario y conservar una capa de reporte compatible.
   Área afectada: Cumplimiento, reportes, lógica empresarial.
   Impacto: Riesgo legal/comercial si el reporte no refleja lo que el cliente necesita o si el sistema no soporta la política acordada con la empresa.
   Evidencia: Ernesto menciona horarios laborales, Ley Federal del Trabajo, STPS y la necesidad de flexibilidad competitiva, pero sin una definición cerrada (aprox. 00:07:00–00:12:50).
6. Granularidad de configuración empresarial todavía ambigua
   Descripción: Se habla de configurar fechas por estructura, área o departamento, y en algún momento también se menciona la posibilidad de granularidad más fina. No queda totalmente cerrado si será por empresa, área, departamento, jerarquía o individuo.
   Área afectada: Configuración B2B, modelo de datos, administración.
   Impacto: Sin esta definición, el diseño del planificador y del panel administrativo puede quedar incompleto o rehacerse más adelante.
   Evidencia: Conversación sobre fechas por “estructura”, “área”, “departamento” y el rechazo parcial a configurarlo por persona (aprox. 00:16:30–00:17:50).
   Decisiones tomadas
   La planificación base debe ser por curso, no por toda la ruta completa.
   Las rutas de aprendizaje podrán existir como secuencias de cursos, pero la planificación debe iniciar normalmente con el primer curso y, al concluirlo, pasar al siguiente.
   El usuario no elige qué cursos se le asignan; eso viene definido por la empresa o por la lógica de asignación.
   Sí puede elegir qué curso planificar entre los asignados, salvo cuando exista una ruta secuencial que obligue un orden.
   El planificador debe modificarse para contemplar:
   estructura organizacional,
   rutas de estudio,
   mayor flexibilidad en la configuración.
   La liberación no se visualiza para lunes; se perfila martes, después de pruebas.
   Acuerdos
   El sistema debe presentar una propuesta de inicio y fin al responsable de recursos humanos / capacitación o al contacto definido por el cliente.
   La empresa debe poder configurar sus parámetros organizacionales: horarios, días laborales, festivos y excepciones propias.
   La flexibilidad del sistema debe alinearse con la estructura del cliente y no depender únicamente de una lógica fija general.
   El equipo avanzará con prioridad en dejar listo el planificador, dado que se reconoce como una pieza clave del producto.
   Israel realizará pruebas antes de liberar; si se detectan incidencias, se ajustarán antes de publicación.
   Ideas y propuestas exploradas
7. Planificar toda la ruta vs planificar curso por curso
   Se discutió si el sistema debía planificar una ruta completa de varios cursos.
   La conclusión práctica fue que planificar toda la ruta desde el inicio sería demasiado complejo y poco realista para usuarios con agendas cambiantes.
8. Diferenciar reglas para C-levels vs otros empleados
   Fernando plantea que los C-levels no deberían tener exactamente la misma rigidez temporal que otros perfiles operativos.
   Se explora que tengan ventanas más abiertas o distintos criterios de cierre.
9. Permitir consumo flexible y conservar un reporte “formal”
   Se explora la idea de que el sistema permita tomar cursos en horarios amplios, pero que el reporte emitido sea compatible con lo que necesita la organización para efectos de control o cumplimiento.
   Esta idea no quedó cerrada.
10. Configuración por estructura organizacional
    Se exploró manejar fechas distintas según área, departamento o nivel jerárquico.
    Esto apunta a una plataforma más robusta para clientes grandes.
11. Modelo abierto tipo B2C
    Se comparó con plataformas tipo Platzi: cursos abiertos por largo tiempo.
    Se mencionó como referencia, pero no como modelo principal del producto actual B2B.
    Definiciones de producto / lógica de negocio
12. Planificación por curso vs rutas (learning paths)
    La unidad principal de planificación debe ser el curso.
    Las rutas de aprendizaje son conjuntos de cursos de una misma categoría.
    Si la ruta es secuencial, el sistema debe llevar al usuario del curso 1 al 2, luego al 3, etc., conforme vaya completando.
    Si los cursos asignados no están secuenciados, el usuario debe poder escoger cuál planificar primero.
13. Rol de recursos humanos
    RR. HH. o el responsable de capacitación actúa como controlador de ventanas de ejecución.
    La asignación y liberación puede hacerse por olas, tandas o periodos definidos.
    El sistema debe poder presentar a RR. HH. una propuesta de fecha de inicio y fecha de fin.
14. Flexibilidad de fechas
    No se busca imponer un horario rígido diario al usuario final.
    Sí se busca mantener una ventana temporal de inicio/fin acordada con la organización.
    Dentro de esa ventana, el usuario debería tener cierto margen para decidir cuándo tomar las lecciones.
    El grado exacto de flexibilidad sigue parcialmente abierto.
15. Diferencias entre usuarios (C-level vs empleados)
    Los C-levels se consideran usuarios con agenda más volátil y con menor disponibilidad predecible.
    El diseño instruccional de microlearning sugiere una carga de 1 o 2 lecciones diarias como máximo.
    Aun así, desde la lógica B2B, los C-levels siguen formando parte del esquema de control organizacional y no quedan totalmente fuera de la gobernanza de RR. HH.
16. Configuración por estructura organizacional
    La configuración debe poder considerar la estructura libre de la empresa.
    Se perfila una lógica de fechas / ventanas por nodos de estructura organizacional.
    Queda por confirmar si el nivel mínimo será área/departamento o si habrá excepciones más granulares.
    Riesgos identificados
    Técnicos
    El planificador puede volverse excesivamente complejo si mezcla sin diseño claro:
    múltiples cursos,
    rutas secuenciales,
    calendario personal,
    reglas empresariales,
    restricciones de horario,
    y reportes de cumplimiento.
    De UX
    Planificar automáticamente todos los cursos asignados genera fricción, confusión y sensación de falta de control.
    La pérdida del hilo conversacional por el bug de autenticación deteriora fuertemente la experiencia.
    De negocio
    Si el producto no ofrece suficiente flexibilidad para C-levels, puede perder atractivo frente a soluciones más abiertas.
    Si ofrece demasiada flexibilidad sin control administrativo, puede perder valor para compradores B2B.
    De cumplimiento
    No están completamente cerradas las reglas para que la capacitación sea compatible con lo que la organización necesita reportar o justificar.
    Se mencionan restricciones ligadas a horarios laborales y STPS, pero faltan criterios operables definitivos.
    De escalabilidad comercial
    Para clientes grandes, la falta de definición de granularidad por estructura puede impedir una implementación consistente.
    Pendientes y siguientes pasos
    Corregir el bug de vinculación Google/Microsoft para evitar refresh y pérdida del hilo.
    Responsable claro: Fernando Suarez Gonzalez.
    Modificar el flujo del planificador para que no planifique automáticamente todos los cursos asignados.
    Responsable claro: Fernando Suarez Gonzalez.
    Agregar lógica de selección de curso cuando existan varios cursos asignados y no haya secuencia obligatoria.
    Responsable claro: Fernando Suarez Gonzalez.
    Definir e implementar el modelo de rutas de aprendizaje:
    agrupación por categoría,
    secuencia entre cursos,
    transición al siguiente curso tras completar el actual.
    Responsable: pendiente por confirmar.
    Definir la granularidad de configuración empresarial:
    empresa,
    área,
    departamento,
    jerarquía,
    persona.
    Responsable: pendiente por confirmar.
    Cerrar reglas de negocio para flexibilidad vs control en C-levels y otros empleados.
    Responsable: pendiente por confirmar.
    Precisar requisitos de reporte / cumplimiento asociados a horarios laborales y capacitación válida.
    Responsable: pendiente por confirmar.
    Realizar pruebas previas a liberación.
    Responsable claro: Israel Martínez Arias.
    Liberar la versión ajustada tentativamente el martes, siempre que las pruebas no arrojen incidencias críticas.
    Responsable: equipo.
    Suposiciones detectadas
    Que un C-level normalmente solo podrá tomar 1 o 2 lecciones al día.
    Que las empresas querrán manejar la capacitación por ventanas temporales y no con acceso totalmente libre.
    Que la lógica correcta para B2B es que RR. HH. / capacitación controle la apertura y cierre de cursos.
    Que la configuración por estructura organizacional será suficiente para cubrir la mayoría de los casos.
    Que, una vez terminado un curso dentro de una ruta, el usuario debe ser llevado a la planificación del siguiente.
    Que las categorías iniciales de rutas podrían ser algo como liderazgo, pensamiento/estructura analítica e inteligencia artificial.
    Que los requisitos de cumplimiento realmente exigirán cierta relación con horarios laborales, aunque esto no quedó totalmente validado en la reunión.
    Cambios requeridos en el sistema
    Ajustes funcionales
    Preservar estado conversacional al autenticar con Google/Microsoft.
    Separar claramente “cursos asignados” de “curso a planificar ahora”.
    Agregar paso explícito de selección de curso cuando el usuario tenga varios cursos asignados sin secuencia obligatoria.
    Incorporar entidad de ruta de aprendizaje con:
    cursos asociados,
    orden/secuencia,
    reglas de desbloqueo.
    Activar planificación del siguiente curso solo tras completar el anterior cuando aplique secuencia.
    Permitir configuración empresarial de:
    horarios laborales,
    días de trabajo,
    festivos oficiales,
    festivos internos / excepciones,
    ventanas de inicio y fin.
    Modelar fechas por estructura organizacional, no solo de forma global.
    Separar la ventana administrativa (inicio/fin) del momento exacto en que el usuario decide tomar la lección.
    Ajustes de UX
    Cambiar el mensaje inicial de Soflía para evitar que “asuma” la planificación de todos los cursos.
    Mostrar al usuario una experiencia más clara:
    cursos asignados,
    curso recomendado,
    curso obligatorio por secuencia,
    ventana disponible.
    Hacer visible cuándo una ruta es secuencial y cuándo no.
    Reducir ambigüedad sobre qué puede decidir el usuario y qué ya fue definido por la empresa.
    Ajustes de lógica de negocio
    Definir si la configuración de fechas será por:
    empresa,
    área,
    departamento,
    jerarquía,
    o excepciones individuales.
    Definir si el sistema permitirá toma de cursos fuera de horario laboral y, en su caso, cómo se reflejará en reportes.
    Alinear el planificador con el comprador real del modelo B2B: no diseña para “libertad absoluta” del usuario final, sino para una combinación de gobernanza empresarial + flexibilidad operativa.
    Inconsistencias funcionales o de diseño detectadas
    La UX actual contradice la lógica de negocio definida: muestra y planifica todos los cursos, cuando la operación debería ser por curso.
    El producto ya tiene varios cursos, pero el planificador sigue comportándose como si solo existiera uno.
    La lógica de rutas se usa en la conversación como criterio de decisión, pero aún no existe formalmente en el sistema.
    La configuración empresarial se reconoce como crítica, pero todavía no está completamente traducida a reglas de plataforma.
    Existe una tensión no resuelta entre cumplimiento/reportes y experiencia flexible para C-levels.
