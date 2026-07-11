import { describe, expect, it } from "vitest";

import {
  normalizeGeneratedNoteHtml,
  normalizeNoteContentHtml,
} from "../generated-note-html";

describe("normalizeGeneratedNoteHtml", () => {
  it("restores semantic sections in legacy flattened lesson notes", () => {
    const html = normalizeGeneratedNoteHtml(
      "Resumen estratégico El cierre consolida el aprendizaje. " +
        "Video, lectura y reflexión El material presenta un marco práctico. " +
        "Puntos clave de mi interacción con SofLIA Primero validé el criterio. Después definí una acción. " +
        "Retroalimentación de la actividad Fortaleza: la respuesta fue clara. " +
        "Retroalimentación del quiz Pregunta 1: la opción correcta fue el criterio de impacto. " +
        "Para repasar Explicar el marco. Aplicarlo a un caso nuevo.",
      "lesson_auto_note",
    );

    expect(html).toContain("<h2>Índice</h2><ol>");
    expect(html).toContain('class="notebook-note-index"');
    expect(html).toContain("<h2>Resumen estratégico</h2>");
    expect(html).toContain("<p>El cierre consolida el aprendizaje.</p>");
    expect(html).toContain(
      "<h2>Puntos clave de mi interacción con SofLIA</h2><ul>",
    );
    expect(html).toContain("<strong>Fortaleza:</strong>");
    expect(html).toContain("<h2>Para repasar</h2><ol>");
  });

  it("adds an index without altering already structured section content", () => {
    const html =
      "<h2>Resumen</h2><p>Texto</p><h2>Repaso</h2><ol><li>Paso</li></ol>";
    const normalized = normalizeGeneratedNoteHtml(html, "lesson_auto_note");

    expect(normalized).toContain(
      "<h2>Índice</h2><ol><li>Resumen</li><li>Repaso</li></ol>",
    );
    expect(normalized).toContain('class="notebook-note-index"');
    expect(normalized.endsWith("<h2>Repaso</h2><ol><li>Paso</li></ol>")).toBe(
      true,
    );
  });

  it("recovers real structure from notes stored with escaped HTML tags", () => {
    const html = normalizeGeneratedNoteHtml(
      "&lt;h2&gt;Resumen de la lección&lt;/h2&gt;&lt;p&gt;El participante analiza la brecha.&lt;/p&gt;" +
        "&lt;h2&gt;Conceptos y evidencias&lt;/h2&gt;&lt;ul&gt;&lt;li&gt;Actividad: Mapeo de procesos.&lt;/li&gt;&lt;/ul&gt;",
      "lesson_auto_note",
    );

    expect(html).toContain("<h2>Resumen de la lección</h2>");
    expect(html).toContain("<ul><li>Actividad: Mapeo de procesos.</li></ul>");
    expect(html).not.toContain("&lt;h2&gt;");
  });

  it("structures flattened deterministic notes and drops serialized JSON debris", () => {
    const html = normalizeGeneratedNoteHtml(
      "Resumen de la lecciónEl participante será capaz de analizar el riesgo. " +
        'Conceptos y evidenciasActividad: Mapeo Ágil (reflection). Contenido: {"introduction":"Analizar la brecha de productividad."}. Respuesta del usuario: {}. ' +
        "Retroalimentación de SofLIAEvaluación: Pregunta 1: ¿Cuál es el principal beneficio? Tu respuesta: Deducción inmediata (correcta). " +
        "Preguntas de repaso ¿Qué aprendí y qué evidencia lo demuestra?",
      "lesson_auto_note",
    );

    expect(html).toContain("<h2>Resumen de la lección</h2>");
    expect(html).toContain("<h2>Conceptos y evidencias</h2>");
    expect(html).toContain("<h2>Retroalimentación de SofLIA</h2>");
    expect(html).toContain("Analizar la brecha de productividad.");
    expect(html).not.toContain('{"introduction"');
    expect(html).not.toContain("Respuesta del usuario: {}");
  });

  it("keeps only the spoken messages from serialized ai_chat scene payloads", () => {
    const html = normalizeGeneratedNoteHtml(
      "Resumen de la lecciónEl participante optimiza flujos con IA. " +
        'Conceptos y evidenciasActividad: Optimizando Flujos (ai_chat). Contenido: {"scenes":[{"emotion":"neutral","message":"¡Hola! Como directivo, sé que tu tiempo es oro.","character":"Lia"},{"emotion":"thinking","message":"Eso es NotebookLM.","character":"Lia"}]}.',
      "lesson_auto_note",
    );

    expect(html).toContain("Como directivo, sé que tu tiempo es oro.");
    expect(html).toContain("<li>Eso es NotebookLM.</li>");
    expect(html).not.toContain('"scenes"');
    expect(html).not.toContain('"character"');
    expect(html).not.toContain('"emotion"');
    expect(html).not.toContain("{");
  });

  it("converts markdown headings and lists when a model returns markdown", () => {
    const html = normalizeGeneratedNoteHtml(
      "## Resumen\nTexto breve.\n\n## Claves\n- Primera\n- Segunda",
      "lesson_auto_note",
    );

    expect(html).toContain('class="notebook-note-index"');
    expect(html).toContain("<h2>Resumen</h2>");
    expect(html).toContain("<ul><li>Primera</li><li>Segunda</li></ul>");
  });

  it("formats legacy inline markdown and plain manual notes", () => {
    const html = normalizeNoteContentHtml(
      "**Idea central:** valida la información antes de actuar.\n\n" +
        "- Revisar la fuente\n- Aplicar el criterio",
    );

    expect(html).toContain("<strong>Idea central:</strong>");
    expect(html).toContain("<ul><li>Revisar la fuente</li><li>Aplicar el criterio</li></ul>");
  });

  it("escapes markup in plain notes while preserving semantic HTML", () => {
    const html = normalizeNoteContentHtml("Texto <script>alert(1)</script>");

    expect(html).not.toContain("<script>");
    expect(html).toContain("<p>Texto</p>");
    expect(normalizeNoteContentHtml("<u>Importante</u>")).toBe(
      "<p><u>Importante</u></p>",
    );
  });
});
