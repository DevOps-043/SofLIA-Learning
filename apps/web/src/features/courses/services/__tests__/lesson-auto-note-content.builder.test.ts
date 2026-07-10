import { describe, expect, it } from "vitest";

import {
  buildDeterministicLessonAutoNoteHtml,
  buildLessonAutoNoteHtmlFromModel,
} from "../lesson-auto-note-content.builder";

describe("buildLessonAutoNoteHtmlFromModel", () => {
  it("renders a predictable study-note hierarchy from Gemini JSON", () => {
    const html = buildLessonAutoNoteHtmlFromModel(
      JSON.stringify({
        titles: {
          index: "Índice",
          summary: "Resumen estratégico",
          lessonContent: "Video, lectura y reflexión",
          sofliaHighlights: "Puntos clave con SofLIA",
          activityFeedback: "Retroalimentación de la actividad",
          quizFeedback: "Retroalimentación del quiz",
          review: "Para repasar",
        },
        strategicSummary: ["La lección conecta criterio y acción."],
        lessonOverview: ["El video presenta un marco de tres pasos."],
        lessonKeyPoints: [
          { label: "Criterio", detail: "Prioriza por impacto." },
        ],
        sofliaHighlights: [
          { label: "Hallazgo", detail: "Conviene validar antes de actuar." },
        ],
        activityFeedback: [
          { label: "Fortaleza", detail: "La respuesta fue aplicable." },
        ],
        quizFeedback: [
          { label: "Pregunta 1", detail: "La respuesta clave fue correcta." },
        ],
        reviewChecklist: ["Explicar el marco sin consultar el material."],
      }),
    );

    expect(html).toContain("<h2>Índice</h2>");
    expect(html).toContain('class="notebook-note-index"');
    expect(html).toContain("<h2>Resumen estratégico</h2>");
    expect(html).toContain("<p>La lección conecta criterio y acción.</p>");
    expect(html).toContain("<ul><li><strong>Criterio:</strong>");
    expect(html).toContain("<ol><li><strong>Pregunta 1:</strong>");
    expect(html).toContain("<strong>Hallazgo:</strong>");
  });

  it("escapes model text before creating HTML", () => {
    const html = buildLessonAutoNoteHtmlFromModel(
      JSON.stringify({
        strategicSummary: ["Resumen <script>alert(1)</script>"],
        lessonOverview: ["Contenido"],
        lessonKeyPoints: [{ label: "<b>Clave</b>", detail: "Detalle" }],
        sofliaHighlights: [{ label: "Idea", detail: "Detalle" }],
        activityFeedback: [{ label: "Actividad", detail: "Detalle" }],
        quizFeedback: [],
        reviewChecklist: [],
      }),
    );

    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&lt;b&gt;Clave&lt;/b&gt;");
  });
});

describe("buildDeterministicLessonAutoNoteHtml", () => {
  it("keeps quiz question, user answer and correct answer as separate lines", () => {
    const html = buildDeterministicLessonAutoNoteHtml({
      activityNotes: [
        "Actividad: Mapeo Ágil (reflection). Contenido: Analizar la brecha de productividad.",
      ],
      dialogueHighlights: [],
      lessonDescription: null,
      lessonSummary: "El participante analiza el riesgo de pérdida de capacidad.",
      lessonTitle: "Mapeo de procesos",
      quizReviews: [
        "Pregunta 1 (Quiz final): ¿Cuál es el principal beneficio?\n" +
          "Tu respuesta: Deducción inmediata (correcta).\n" +
          "Respuesta correcta: Deducción inmediata del 100%.\n" +
          "Explicación: Permite aplicar el monto invertido en un solo año.",
      ],
      transcript: null,
    });

    expect(html).toContain("<h2>Resumen de la lección</h2>");
    expect(html).toContain("<strong>Tu respuesta:</strong> Deducción inmediata (correcta).");
    expect(html).toContain("<br><strong>Respuesta correcta:</strong>");
    expect(html).toContain("<br><strong>Explicación:</strong>");
    expect(html).not.toContain('{"');
  });
});
