import { describe, expect, it } from 'vitest';

import {
  generateNotePdfWithJsPdf,
  parseNoteHtmlToPdfItems,
  shouldAddPdfPage,
  wrapPdfText,
} from '../shared/notes-pdf-jspdf.service';

const measureByCharacterCount = (value: string) => value.length;

function buildLongTranscript(paragraphCount: number): string {
  return Array.from({ length: paragraphCount }, (_, index) => {
    const minute = String(index).padStart(2, '0');

    return `<p>[${minute}:00] Bienvenidos a esta demostracion comparativa. Hoy exploraremos las fortalezas y debilidades de ChatGPT, un motor generativo, y Atlas, un sistema de busqueda referencial verificado. Veremos cuando cada uno brilla y cuando su uso indebido puede llevarnos a errores criticos en produccion.</p>`;
  }).join('');
}

const sampleSingleBlockTranscript =
  '[00:00] Bienvenidos a esta demostración comparativa. Hoy exploraremos las fortalezas y debilidades de ChatGPT, un motor generativo, y Atlas, un sistema de búsqueda referencial verificado. Veremos cuándo cada uno brilla y, crucialmente, cuándo su uso indebido puede llevarnos a errores. [00:45] Para nuestra demostración, utilizaremos una interfaz estándar de ChatGPT a la izquierda y una interfaz hipotética de Atlas, diseñada para la búsqueda de información verificada con fuentes, a la derecha. Observemos sus diferencias iniciales. [02:00] Primero, veamos dónde ChatGPT sobresale. Le pediremos que genere un plan de marketing creativo para un nuevo producto ecológico. A la derecha, Atlas buscará datos de participación de mercado para ese sector. Fíjense en la fluidez de ChatGPT y la precisión de Atlas. [04:00] Ahora, invertiremos las tareas para ilustrar sus limitaciones. Pediremos a ChatGPT que nos dé la cuota de mercado exacta de X empresa en Y sector, y a Atlas que escriba un poema sobre la sostenibilidad. Observen cómo cada herramienta lucha fuera de su dominio principal.';

describe('wrapPdfText', () => {
  it('wraps transcript paragraphs to the configured width', () => {
    expect(
      wrapPdfText({
        maxWidth: 20,
        measureText: measureByCharacterCount,
        text: '[00:00] Bienvenidos a esta demostracion comparativa con una frase larga.',
      })
    ).toEqual([
      '[00:00] Bienvenidos',
      'a esta demostracion',
      'comparativa con una',
      'frase larga.',
    ]);
  });

  it('splits oversized tokens so they cannot overflow the PDF page', () => {
    expect(
      wrapPdfText({
        maxWidth: 8,
        measureText: measureByCharacterCount,
        text: 'supercalifragilistico',
      })
    ).toEqual(['supercal', 'ifragili', 'stico']);
  });

  it('normalizes non-breaking spaces from copied transcript content', () => {
    expect(
      wrapPdfText({
        maxWidth: 12,
        measureText: measureByCharacterCount,
        text: 'uno\u00a0dos\u00a0tres cuatro',
      })
    ).toEqual(['uno dos tres', 'cuatro']);
  });

  it('keeps every generated line inside the requested width', () => {
    const lines = wrapPdfText({
      maxWidth: 18,
      measureText: measureByCharacterCount,
      text: 'https://sof-lia.example.com/materiales/transcript_chatgpt_vs_atlas_razonamiento_frente_a_busqueda_verificada',
    });

    expect(lines.length).toBeGreaterThan(1);
    expect(lines.every((line) => measureByCharacterCount(line) <= 18)).toBe(true);
  });
});

describe('parseNoteHtmlToPdfItems', () => {
  it('extracts safe readable blocks from headings, lists, links and scripts', () => {
    const items = parseNoteHtmlToPdfItems(`
      <h1>Resumen del taller</h1>
      <p>Leer <a href="sof-lia.com/recurso">recurso oficial</a></p>
      <ol><li>Primer paso</li><li>Segundo paso</li></ol>
      <script>alert('no')</script>
    `);

    expect(items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          content: 'Resumen del taller',
          style: 'h1',
          type: 'text',
        }),
        expect.objectContaining({
          content: 'recurso oficial',
          type: 'link',
          url: 'https://sof-lia.com/recurso',
        }),
        expect.objectContaining({
          content: '1. Primer paso',
          type: 'text',
        }),
        expect.objectContaining({
          content: '2. Segundo paso',
          type: 'text',
        }),
      ])
    );
    expect(items.some((item) => item.content?.includes('alert'))).toBe(false);
  });

  it('keeps transcript timestamps as readable separated blocks', () => {
    const items = parseNoteHtmlToPdfItems(`
      <div>[00:00] Inicio del transcript con contexto. [00:45] Segunda seccion que no debe quedar pegada. [02:00] Tercera seccion.</div>
    `);
    const textItems = items.filter((item) => item.type === 'text');

    expect(textItems).toEqual([
      expect.objectContaining({
        content: '[00:00] Inicio del transcript con contexto.',
      }),
      expect.objectContaining({
        content: '[00:45] Segunda seccion que no debe quedar pegada.',
      }),
      expect.objectContaining({
        content: '[02:00] Tercera seccion.',
      }),
    ]);
  });
});

describe('shouldAddPdfPage', () => {
  it('requests a new page only when the next block would exceed the content area', () => {
    expect(
      shouldAddPdfPage({
        contentBottom: 260,
        requiredHeight: 10,
        y: 240,
      })
    ).toBe(false);

    expect(
      shouldAddPdfPage({
        contentBottom: 260,
        requiredHeight: 24,
        y: 240,
      })
    ).toBe(true);
  });
});

describe('generateNotePdfWithJsPdf', () => {
  it('generates multiple pages for long transcript notes without saving', async () => {
    const pdf = await generateNotePdfWithJsPdf(
      {
        content: buildLongTranscript(35),
        tags: ['transcript', 'automatic'],
        title: 'Transcript: ChatGPT vs. Atlas: Razonamiento frente a Busqueda Verificada',
      },
      {
        generatedAt: new Date('2026-04-29T16:56:00.000Z'),
      }
    );

    expect(pdf.getNumberOfPages()).toBeGreaterThan(1);
  });

  it('handles headings, lists, links and long tags in one document', async () => {
    const pdf = await generateNotePdfWithJsPdf(
      {
        content: `
          <h1>Hallazgos principales</h1>
          <p>Este taller contiene una URL extremadamente larga para validar que no se salga del area imprimible: https://sof-lia.example.com/materiales/transcript_chatgpt_vs_atlas_razonamiento_frente_a_busqueda_verificada</p>
          <ul><li>Revisar fuentes</li><li>Comparar resultados</li></ul>
          <p><a href="https://sof-lia.com">Abrir SofLIA</a></p>
        `,
        tags: [
          'transcript',
          'automatic',
          'etiqueta-extraordinariamente-larga-para-validar-wrapping-de-chips',
        ],
        title: 'Nota editorial',
      },
      {
        generatedAt: new Date('2026-04-29T16:56:00.000Z'),
      }
    );

    expect(pdf.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });

  it('does not let jsPDF auto-wrap transcript lines outside the layout cursor', async () => {
    const pdf = await generateNotePdfWithJsPdf(
      {
        content: `<div>${sampleSingleBlockTranscript}</div>`,
        tags: ['transcript', 'automatic'],
        title: 'Transcript: ChatGPT vs. Atlas',
      },
      {
        generatedAt: new Date('2026-04-29T16:56:00.000Z'),
      }
    );
    const pdfContent = pdf.output();

    expect(pdfContent).not.toContain('T*');
    expect(pdfContent).toContain('([00:45]');
    expect(pdfContent).toContain('([02:00]');
    expect(pdfContent).toContain('([04:00]');
  });

  it('rejects empty notes with the current user-facing error', async () => {
    await expect(
      generateNotePdfWithJsPdf({
        content: '   ',
        tags: [],
        title: 'Nota vacia',
      })
    ).rejects.toThrow('La nota debe tener contenido para exportar');
  });
});
