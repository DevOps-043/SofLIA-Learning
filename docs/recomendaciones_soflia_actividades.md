# Recomendaciones para el uso de SofLIA en actividades de interacción

## Contexto

En la actividad **“Explorando la Comunicación Asertiva en Equipos Remotos”**, el participante debe ver previamente el video de la lección para poder llegar a la actividad. Los controles del curso impiden que el usuario avance simplemente recorriendo el video, por lo que se presupone que el participante ya vio el contenido antes de interactuar con la actividad.

Además, se cuenta con un apoyo adicional de SofLIA en el panel izquierdo, el cual podría servir para orientar al participante, indicarle en qué parte del video revisar cierta información o ayudarle a estructurar su respuesta.

La decisión recomendada no debería ser binaria. Para esta actividad, SofLIA puede permanecer activa, pero con permisos distintos a los que tendría durante el video o durante una lección explicativa.

---

## Recomendación principal

Mi recomendación es **no deshabilitar SofLIA en actividades**, sino cambiarla a un **modo de apoyo restringido por actividad**.

Deshabilitarla eliminaría una oportunidad importante de acompañamiento. Pero dejarla igual que un chat abierto puede provocar que el participante use SofLIA para obtener la respuesta, no para reflexionar.

La mejor solución es que SofLIA funcione como **tutor contextual**, no como generador de respuestas finales.

---

## Decisión recomendada

**Mantener SofLIA activa, pero con tres restricciones:**

1. **No debe resolver la actividad por el participante.**
2. **Sí debe orientar hacia el video, minuto, segundo o concepto relevante.**
3. **Sí debe ayudar a estructurar la respuesta, pero no escribirla completa como entrega final.**

---

# Cómo debería interactuar SofLIA en esta actividad

## 1. SofLIA debe detectar que el usuario está en una actividad

En esta pantalla, SofLIA no debería comportarse igual que en una lección normal.

Debe reconocer el contexto:

- Curso: **Comunicación Asertiva en Entornos Remotos**
- Lección: **1.1 Anatomía de la comunicación asertiva remota**
- Actividad: **Explorando la Comunicación Asertiva en Equipos Remotos**
- Tipo de actividad: **ai_chat**
- Estado esperado: el participante ya vio el video antes de llegar aquí

Con eso, SofLIA debería entrar en modo:

> **Apoyo para completar actividad, sin entregar respuesta final.**

---

## 2. SofLIA puede indicar dónde está la información en el video

Este sería el uso más valioso.

Si el participante pregunta:

> “¿Dónde explican los estilos de comunicación?”

SofLIA debería responder algo como:

> Puedes revisar la explicación sobre estilos de comunicación en el video de la lección, especialmente en el segmento donde se comparan los estilos pasivo, agresivo y asertivo. Vuelve al minuto **X:XX** para repasar esa parte y después intenta identificar cuál aparece en tu situación.

Cuando exista transcripción o marcadores internos, SofLIA debería poder mostrar:

- Minuto exacto
- Segundo exacto
- Tema tratado
- Botón para volver al fragmento del video

Ejemplo de interfaz:

```text
Revisa en el video:

02:14 – Comunicación pasiva
03:05 – Comunicación agresiva
04:20 – Comunicación asertiva
05:10 – Ejemplo aplicado a equipos remotos

[Ir al minuto 04:20]
```

Esto no sustituye el aprendizaje. Lo refuerza.

---

## 3. SofLIA debe responder dudas conceptuales, pero redirigir a la actividad

Si el participante escribe:

> “¿Cuáles son los estilos?”

SofLIA no debería marcarlo como error ni resolver toda la actividad. Debería responder:

> Los estilos principales son pasivo, agresivo y asertivo.  
> Ahora aplica uno de ellos a una situación remota que hayas vivido o que puedas imaginar. Para completar la actividad, describe: situación, incomodidad, estilo predominante y justificación.

Esto convierte una pregunta básica en avance hacia la entrega.

---

## 4. SofLIA debe usar preguntas guía

En actividades, SofLIA debería guiar con preguntas, no entregar respuestas completas.

Por ejemplo:

> Piensa en una videollamada, correo o mensaje de chat donde algo no haya quedado claro.  
> ¿Qué fue lo que generó incomodidad: falta de claridad, tono del mensaje, ausencia de respuesta, presión o ambigüedad?

Luego:

> Ahora identifica el estilo:  
> ¿La persona evitó decir claramente lo que necesitaba? Puede ser pasivo.  
> ¿Impuso o presionó? Puede ser agresivo.  
> ¿Fue clara y respetuosa? Puede ser asertivo.

---

## 5. SofLIA puede revisar la respuesta antes de enviarla

Este sería un flujo ideal.

El participante escribe su respuesta y pulsa:

> **Revisar antes de enviar**

SofLIA valida si contiene los elementos mínimos:

- Situación remota
- Incomodidad o ambigüedad
- Estilo predominante
- Justificación
- Alternativa asertiva

Ejemplo:

> Tu respuesta ya describe la situación, pero todavía falta explicar por qué corresponde a un estilo pasivo, agresivo o asertivo. Agrega una frase que justifique tu elección.

Esto mejora la calidad sin regalar la respuesta.

---

# Cuándo sí debería limitarse o deshabilitarse

No deshabilitaría SofLIA para todas las actividades. La limitaría según el tipo de actividad.

| Tipo de actividad | SofLIA activa | Nivel de ayuda recomendado |
|---|---:|---|
| Video / lección | Sí | Explicación completa, ejemplos, timestamps |
| Actividad reflexiva | Sí | Preguntas guía, estructura, revisión |
| Actividad ai_chat | Sí | Tutor contextual, no respuesta final |
| Ejercicio práctico | Sí | Pistas, criterios, feedback parcial |
| Quiz evaluativo requerido | Limitada | Solo aclaraciones técnicas o instrucciones |
| Evaluación final | Muy limitada o deshabilitada | No debe explicar respuestas |

Para esta actividad específica, que es formativa, **sí mantendría SofLIA activa**.

Para el quiz requerido que aparece después, la restringiría más.

---

# Reglas concretas para SofLIA en actividades

## Permitido

- Explicar conceptos del video.
- Indicar minuto o segundo donde aparece la información.
- Mostrar ejemplos parciales.
- Hacer preguntas guía.
- Ayudar a estructurar la respuesta.
- Revisar si la respuesta cumple la rúbrica.
- Sugerir mejoras sin escribir la entrega final.

## No permitido

- Redactar la respuesta completa lista para enviar.
- Dar una solución única sin pedir reflexión.
- Responder quizzes evaluativos.
- Saltarse la necesidad de haber visto el video.
- Convertirse en un chat general sin contexto de la actividad.

---

# Mensaje sugerido para SofLIA dentro de la actividad

Podría mostrarse algo así en el panel:

> **Estoy aquí para ayudarte a completar esta actividad sin hacerla por ti.**  
> Puedo ayudarte a recordar conceptos del video, indicarte en qué minuto revisar una idea clave, hacerte preguntas guía o revisar si tu respuesta cumple con lo solicitado.

Botones sugeridos:

```text
[Recordar conceptos del video]
[Ver dónde se explica en el video]
[Ayúdame a estructurar mi respuesta]
[Revisar mi respuesta antes de enviar]
```

---

# Mejor flujo recomendado

Para esta actividad, usaría este flujo:

```text
1. Participante ve el video.
2. Sistema desbloquea la actividad.
3. SofLIA entra en modo "apoyo de actividad".
4. Participante puede pedir ayuda.
5. SofLIA responde con:
   - referencia al video,
   - pregunta guía,
   - estructura sugerida,
   - revisión parcial.
6. Participante redacta su respuesta.
7. SofLIA valida si cumple criterios.
8. Participante envía.
```

---

# Recomendación final

No deshabilites SofLIA para actividades como esta.

La mejor decisión es convertirla en un **acompañante pedagógico contextual**, con acceso al video y a sus timestamps, pero con bloqueo para no entregar respuestas finales.

La lógica sería:

> **Durante el video:** SofLIA enseña.  
> **Durante la actividad:** SofLIA guía.  
> **Durante el quiz:** SofLIA se limita.  
> **Durante evaluación formal:** SofLIA se desactiva o solo da soporte técnico.

Para la actividad **“Explorando la Comunicación Asertiva en Equipos Remotos”**, SofLIA debería mantenerse activa porque puede reducir ambigüedad, mejorar la calidad de las respuestas y reforzar que el participante use lo aprendido en el video.
