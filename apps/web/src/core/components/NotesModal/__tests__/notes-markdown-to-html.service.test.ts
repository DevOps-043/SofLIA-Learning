import { describe, expect, it } from 'vitest';
import { convertNoteMarkdownToHtml } from '../shared/notes-markdown-to-html.service';

describe('convertNoteMarkdownToHtml', () => {
  it('returns empty string for empty or whitespace input', () => {
    expect(convertNoteMarkdownToHtml('')).toBe('');
    expect(convertNoteMarkdownToHtml('   ')).toBe('');
    expect(convertNoteMarkdownToHtml('\n\n')).toBe('');
  });

  it('wraps plain text in a <p> tag', () => {
    expect(convertNoteMarkdownToHtml('Hello world')).toBe('<p>Hello world</p>');
  });

  it('converts **bold** to <strong>', () => {
    const result = convertNoteMarkdownToHtml('This is **important** text');
    expect(result).toBe('<p>This is <strong>important</strong> text</p>');
  });

  it('converts *italic* to <em>', () => {
    const result = convertNoteMarkdownToHtml('This is *emphasized* text');
    expect(result).toBe('<p>This is <em>emphasized</em> text</p>');
  });

  it('converts bold and italic together', () => {
    const result = convertNoteMarkdownToHtml(
      '**Bold** and *italic* in one line',
    );
    expect(result).toBe(
      '<p><strong>Bold</strong> and <em>italic</em> in one line</p>',
    );
  });

  it('converts ## headings to <h2> and ### to <h3>', () => {
    const input = '## Main Topic\n\nSome text\n\n### Sub Topic';
    const result = convertNoteMarkdownToHtml(input);
    expect(result).toContain('<h2>Main Topic</h2>');
    expect(result).toContain('<p>Some text</p>');
    expect(result).toContain('<h3>Sub Topic</h3>');
  });

  it('converts unordered list items (- prefix)', () => {
    const input = '- First item\n- Second item\n- Third item';
    const result = convertNoteMarkdownToHtml(input);
    expect(result).toContain('<ul>');
    expect(result).toContain('<li>First item</li>');
    expect(result).toContain('<li>Second item</li>');
    expect(result).toContain('<li>Third item</li>');
    expect(result).toContain('</ul>');
  });

  it('converts unordered list items (* prefix)', () => {
    const input = '* Apple\n* Banana';
    const result = convertNoteMarkdownToHtml(input);
    expect(result).toContain('<ul>');
    expect(result).toContain('<li>Apple</li>');
    expect(result).toContain('<li>Banana</li>');
  });

  it('converts ordered list items', () => {
    const input = '1. Step one\n2. Step two\n3. Step three';
    const result = convertNoteMarkdownToHtml(input);
    expect(result).toContain('<ol>');
    expect(result).toContain('<li>Step one</li>');
    expect(result).toContain('<li>Step two</li>');
    expect(result).toContain('<li>Step three</li>');
    expect(result).toContain('</ol>');
  });

  it('converts markdown links to <a> with security attributes', () => {
    const input = 'Visit [SofLIA](https://sof-lia.com) for more';
    const result = convertNoteMarkdownToHtml(input);
    expect(result).toContain(
      '<a href="https://sof-lia.com" target="_blank" rel="noopener noreferrer">SofLIA</a>',
    );
  });

  it('strips unsafe link protocols', () => {
    const input = 'Click [here](javascript:alert(1))';
    const result = convertNoteMarkdownToHtml(input);
    expect(result).not.toContain('javascript:');
    expect(result).toContain('here'); // text is preserved
  });

  it('converts inline code', () => {
    const result = convertNoteMarkdownToHtml('Use `npm install` to add deps');
    expect(result).toContain('<code>npm install</code>');
  });

  it('handles a full SofLIA-style message with mixed formatting', () => {
    const input = [
      '**Resumen de la lección:**',
      '',
      'La inteligencia artificial está transformando la forma en que trabajamos.',
      '',
      '**Puntos clave:**',
      '- Automatización de tareas repetitivas',
      '- Mejora en la toma de decisiones',
      '- Nuevas oportunidades de innovación',
      '',
      '**Conclusión:**',
      'Es fundamental adaptarse a estos cambios.',
    ].join('\n');

    const result = convertNoteMarkdownToHtml(input);

    // Bold headers become paragraphs with <strong>
    expect(result).toContain('<strong>Resumen de la lección:</strong>');
    // Plain text becomes paragraph
    expect(result).toContain(
      '<p>La inteligencia artificial está transformando',
    );
    // List items are proper <ul><li>
    expect(result).toContain('<ul>');
    expect(result).toContain(
      '<li>Automatización de tareas repetitivas</li>',
    );
    expect(result).toContain('<li>Mejora en la toma de decisiones</li>');
    // Conclusion: single-newline continuation merges into one paragraph
    expect(result).toContain(
      '<strong>Conclusión:</strong> Es fundamental adaptarse a estos cambios.',
    );
  });

  it('separates consecutive paragraphs by double newline', () => {
    const input = 'Paragraph one.\n\nParagraph two.';
    const result = convertNoteMarkdownToHtml(input);
    expect(result).toBe('<p>Paragraph one.</p><p>Paragraph two.</p>');
  });

  it('merges single-newline text into one paragraph', () => {
    const input = 'Line one\nLine two\nLine three';
    const result = convertNoteMarkdownToHtml(input);
    expect(result).toBe('<p>Line one Line two Line three</p>');
  });

  it('handles heading with inline bold', () => {
    const input = '## **Important** heading';
    const result = convertNoteMarkdownToHtml(input);
    expect(result).toBe('<h2><strong>Important</strong> heading</h2>');
  });

  it('flushes list before switching to different list type', () => {
    const input = '- Bullet\n\n1. Number';
    const result = convertNoteMarkdownToHtml(input);
    expect(result).toContain('<ul><li>Bullet</li></ul>');
    expect(result).toContain('<ol><li>Number</li></ol>');
  });

  it('handles bold items within list items', () => {
    const input = '- **Key concept**: explanation';
    const result = convertNoteMarkdownToHtml(input);
    expect(result).toContain(
      '<li><strong>Key concept</strong>: explanation</li>',
    );
  });
});
