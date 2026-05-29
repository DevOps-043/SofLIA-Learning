# Responsabilidades de Course Engine/Course Gen: respuestas correctas de quizzes

## 1. Entendimiento del objetivo

Course Engine/Course Gen es la fuente de origen del contenido academico generado. Por lo tanto, debe garantizar que cada quiz exportado tenga una respuesta correcta consistente, verificable y alineada con lo que se muestra visualmente al usuario.

SofLIA Learning puede validar, normalizar y rechazar contenido ambiguo, pero no debe ser el lugar donde se decide semanticamente cual respuesta es correcta.

## 2. Responsabilidad principal

Course Engine/Course Gen debe producir quizzes con un contrato estable:

- Cada pregunta debe tener un `id` estable.
- Cada opcion debe tener un identificador o valor estable.
- La respuesta correcta debe referenciar ese valor estable, no depender solo del label visual.
- El tipo de pregunta debe estar normalizado.
- Las preguntas Verdadero/Falso deben exportarse con un valor interno no ambiguo.

## 3. Contrato recomendado para Verdadero/Falso

Para preguntas `true_false`, el contenido exportado deberia separar valor logico y label visual.

Ejemplo recomendado:

```json
{
  "id": "q-001",
  "questionType": "true_false",
  "question": "La automatizacion siempre elimina la necesidad de supervision humana.",
  "options": [
    { "id": "true", "label": "Verdadero", "value": true },
    { "id": "false", "label": "Falso", "value": false }
  ],
  "correctAnswer": false,
  "explanation": "La automatizacion requiere supervision, criterios y mejora continua.",
  "points": 1
}
```

Si por compatibilidad el contrato actual exige `options: string[]`, entonces Course Engine/Course Gen debe exportar:

```json
{
  "questionType": "true_false",
  "options": ["Verdadero", "Falso"],
  "correctAnswer": "Falso"
}
```

No debe mezclar `correctAnswer: 1`, `correctAnswer: false`, `correct_answer: "Falso"` y labels localizados sin una normalizacion explicita.

## 4. Casos que Course Engine/Course Gen debe evitar

- Respuesta correcta apuntando a un indice despues de reordenar opciones.
- Labels visuales traducidos sin actualizar la respuesta correcta.
- `correct_answer` y `correctAnswer` con valores distintos.
- `correctAnswer` vacio.
- Booleanos serializados como string sin contrato (`"true"` vs `"Verdadero"`).
- Opciones duplicadas.
- Opciones Verdadero/Falso invertidas sin ajustar el valor correcto.
- IDs generados aleatoriamente en cada exportacion para la misma pregunta.

## 5. Validaciones obligatorias antes de exportar

Course Engine/Course Gen debe validar:

- Toda pregunta tiene `id`, `question`, `questionType`, `options`, `correctAnswer` y `points`.
- `correctAnswer` existe dentro del dominio valido de la pregunta.
- En Verdadero/Falso, solo hay dos opciones logicas.
- La respuesta correcta no depende de texto localizado cuando exista valor interno.
- No existen dos campos de respuesta correcta en conflicto.
- La explicacion no contradice la respuesta correcta.

## 6. Pruebas de origen recomendadas

Casos unitarios:

- Generacion de Verdadero/Falso correcto verdadero.
- Generacion de Verdadero/Falso correcto falso.
- Exportacion en espanol, ingles y portugues sin cambiar el valor interno.
- Reordenamiento de opciones sin romper la respuesta correcta.
- Conversion de borrador a publicado sin alterar IDs.

Casos de contrato:

- Exportar quiz y reimportarlo sin cambios semanticos.
- Comparar `correctAnswer` contra opcion visual renderizada.
- Validar que SofLIA feedback use la misma respuesta correcta que la evaluacion.

## 7. Frontera con SofLIA Learning

Course Engine/Course Gen debe:

- Generar la respuesta correcta.
- Mantener integridad academica del contenido.
- Exportar un contrato estable y versionado.
- Corregir contenido mal generado en origen.

SofLIA Learning debe:

- Rechazar contenido ambiguo o invalido.
- Evaluar contra la definicion canonica publicada.
- Reportar inconsistencias con trazabilidad.
- Proteger al usuario de bloqueos causados por fallos tecnicos.

## 8. Resultado esperado

La plataforma deja de depender de heuristicas para adivinar la intencion del contenido, y Course Engine/Course Gen asume la responsabilidad de producir quizzes semanticamente correctos desde origen.

