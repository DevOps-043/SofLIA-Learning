# Prompt para la Generación Automática de Reportes

A continuación, tienes un prompt preestructurado. Cuando termines tu jornada, simplemente puedes pedirle a tu Asistente IA (Antigravity/Claude/ChatGPT) que lea tu historial de Git o el contexto de la conversación actual para generar el reporte de progreso de hoy enviándole este texto.

---

### Copia desde aquí 👇

**Actúa como un Agile Project Manager y Asistente Técnico Especializado.**

Tu objetivo es analizar la información del trabajo que hemos realizado hoy (leyendo los commits recientes de Git, los archivos modificados o el historial de nuestra conversación) y generar de forma estructurada **dos reportes** de avance: uno extenso y uno ejecutivo (Daily Pulse).

Por favor, genera tu respuesta siguiendo exactamente esta estructura:

#### 1. Reporte Extenso (Trazabilidad Detallada)

Redacta un reporte técnico, narrativo y detallado que explique el trabajo realizado. Debe incluir:

- **Resumen del día:** Un párrafo sobre el enfoque principal del día.
- **Tareas Completadas (Done):** Lista explicativa de qué se hizo, mencionando las tareas visibles en código, refactorizaciones y correcciones.
- **En Testing / Ready for QA:** Lo que está pendiente de validación o revisión manual.
- **Bloqueos / Riesgos:** (Si se infiere alguno del historial o falta de avance).
  _(Nota: Este reporte es para dejar trazabilidad profunda a otros ingenieros o a mí mismo en el futuro)._

#### 2. Reporte Corto (Daily Pulse)

Llena de manera estricta la siguiente plantilla para que yo pueda copiarla y enviarla rápidamente al equipo y a los stakeholders. Este resumen debe ser **orientado a resultados y valor de negocio, cero ruido técnico**. Reemplaza los corchetes con la información extraída:

```text
LMS – Daily Pulse | [Fecha actual]
Estado: [🟢 (Todo fluye) / 🟡 (Retrasos menores) / 🔴 (Bloqueado)] ([1 frase corta de justificación de negocio])
✅ Done hoy: [Lista de 1-3 logros de alto nivel / valor entregado]
🧪 Ready for QA: [Breve mención a las funcionalidades clave a probar]
🚨 Prioridades Abiertas: [Nombres resumidos de temas críticos pendientes]
🔧 Foco siguiente: [Siguiente gran hito a entregar]
⚠️ Riesgos: [Menciona si hay algún riesgo, o "Ninguno"]
🧭 Acción requerida: [Ej. "Revisión de diseño", o "Ninguna"]
🔗 Repositorio / Cambios: En GitHub.
```

**Reglas Críticas:**

- Infiere el semáforo de "Estado" basándote en lo visible: si hay muchos bloqueos o todo está atorado, usa 🔴; si hay buen avance, usa 🟢.
- Elimina la jerga excesiva en el Daily Pulse: háblale a la gente de producto/negocio.
- Formato de Salida: Toda tu respuesta (ambos reportes) debe estar empaquetada dentro de un único gran bloque de código Markdown (\`\`\`markdown ... \`\`\`), de forma que yo pueda copiar todo con un solo clic.
- Usa un tono profesional, directo y orientado a resultados.

### Fin de copia 👆

---

**Instrucción de uso:**

1. Pídele a tu IA que lea los últimos commits o cambios no guardados.
2. Copia el Prompt de arriba, y envíaselo.
3. Toma el resultado devuelto, guárdalo en un archivo de tu repositorio (ej. `reporte-diario.md`).
4. Copia el texto de la sección "Daily Pulse" de ese reporte y envíalo al grupo.

---

## To do

- [x] Remover el apartado de Notion del prompt.
- [x] Hacer el resumen ejecutivo menos técnico y más orientado a resultados.
