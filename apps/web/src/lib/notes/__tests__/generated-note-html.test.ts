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
