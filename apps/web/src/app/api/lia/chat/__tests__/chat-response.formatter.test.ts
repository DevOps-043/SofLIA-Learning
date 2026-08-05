import { beforeEach, describe, expect, it, vi } from 'vitest';

const persistConversationTurn = vi.fn(async () => ({
  assistantMessageId: 'assistant-message',
  conversationId: 'conversation',
  userMessageId: 'user-message',
}));

vi.mock('../lia-chat-history.service', () => ({
  isValidUUID: () => true,
  persistConversationTurn: (...args: unknown[]) =>
    persistConversationTurn(...(args as [])),
}));

import { processAIResponse } from '../chat-response.formatter';
import type { LiaChatProcessingBody } from '../lia-report-workflow.service';

const DRAFT_TOKEN =
  '[[BUG_REPORT_DRAFT:{"title":"Fallo de audio en lecturas","description":"El reading de las lecciones 3 y 4 no se reproduce","category":"bug","priority":"media"}]]';

const request = { headers: { get: () => null } };

function buildBody(userMessage: string): LiaChatProcessingBody {
  return {
    conversationId: '9f1c1b8e-9d5f-4c62-9a5e-2f4a1c0b7d31',
    messages: [{ role: 'user', content: userMessage }],
  };
}

const requestContext = {
  userId: 'a3c9f0f4-6d3a-4d0d-9d5f-1b9a2c3d4e5f',
  currentPage: '/acme/business-user/courses/ia-aplicada/learn',
};

describe('processAIResponse', () => {
  beforeEach(() => {
    persistConversationTurn.mockClear();
  });

  /**
   * Regresión: el usuario describió la incidencia con palabras cotidianas, la
   * heurística de intención no la reconoció y el borrador que SofLIA sí había
   * generado se borraba del historial, dejando el flujo de confirmación muerto.
   */
  it('preserves the draft token even when the message does not look like a report', async () => {
    const body = buildBody('Tengo un problema para escuchar el reading de la lección 3 y 4');

    const result = await processAIResponse(
      `Preparé este borrador técnico para el equipo.\n\n${DRAFT_TOKEN}`,
      body,
      requestContext,
      request,
    );

    const persistedContent = persistConversationTurn.mock.calls[0]?.[0]
      ?.assistantContent as string;

    expect(persistedContent).toContain('BUG_REPORT_DRAFT');
    expect(result.clientContent).not.toContain('BUG_REPORT_DRAFT');
    expect(result.clientContent).toContain('Confirmas');
  });

  it('normalizes a legacy BUG_REPORT block into a pending draft', async () => {
    const body = buildBody('El botón de guardar no responde');

    const result = await processAIResponse(
      'Registro el detalle.\n\n[[BUG_REPORT:{"title":"Boton sin respuesta","description":"Guardar no hace nada","category":"bug","priority":"alta"}]]',
      body,
      requestContext,
      request,
    );

    const persistedContent = persistConversationTurn.mock.calls[0]?.[0]
      ?.assistantContent as string;

    expect(persistedContent).toContain('BUG_REPORT_DRAFT');
    expect(persistedContent).not.toContain('[[BUG_REPORT:');
    expect(result.clientContent).not.toContain('[[');
  });

  it('leaves ordinary answers untouched and does not open a report flow', async () => {
    const body = buildBody('¿Cuánto me falta para terminar el curso?');

    const result = await processAIResponse(
      'Te faltan dos lecciones del módulo 3.',
      body,
      requestContext,
      request,
    );

    const persistedContent = persistConversationTurn.mock.calls[0]?.[0]
      ?.assistantContent as string;

    expect(persistedContent).toBe('Te faltan dos lecciones del módulo 3.');
    expect(result.clientContent).toBe('Te faltan dos lecciones del módulo 3.');
    expect(result.clientContent).not.toContain('Confirmas');
  });

  /**
   * Regresión: SofLIA abría el flujo ("cuéntame qué ocurrió") y ese turno se
   * persistía sin ninguna marca. En el turno siguiente la heurística de
   * intención volvía a evaluar SOLO la descripción del usuario, no la
   * reconocía, y el flujo moría sin que se generara reporte alguno.
   */
  it('marks the turn as an open report flow when no draft could be built yet', async () => {
    const body = buildBody('Quiero reportar un problema');

    const result = await processAIResponse(
      'Describe qué ocurrió, en qué sección y qué esperabas que pasara.',
      body,
      requestContext,
      request,
      null,
      true,
    );

    const persistedContent = persistConversationTurn.mock.calls[0]?.[0]
      ?.assistantContent as string;

    expect(persistedContent).toContain('BUG_REPORT_PENDING');
    // La marca es interna: nunca puede llegar a la pantalla del usuario.
    expect(result.clientContent).not.toContain('BUG_REPORT_PENDING');
  });

  it('does not mark the flow when the turn already carries a draft', async () => {
    const body = buildBody('El reading de la lección 3 no suena');

    await processAIResponse(
      `Preparé este borrador técnico.\n\n${DRAFT_TOKEN}`,
      body,
      requestContext,
      request,
      null,
      true,
    );

    const persistedContent = persistConversationTurn.mock.calls[0]?.[0]
      ?.assistantContent as string;

    expect(persistedContent).toContain('BUG_REPORT_DRAFT');
    expect(persistedContent).not.toContain('BUG_REPORT_PENDING');
  });
});
