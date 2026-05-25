import type { FlowContext } from './flow-context';

export async function aiFlow(context: FlowContext) {
  await context.post('lia', 'lia-chat', '/api/lia/chat', {
    stream: false,
    messages: [
      {
        role: 'user',
        content:
          'Estoy realizando una prueba QA de carga. Responde brevemente con un consejo de estudio para una leccion de IA empresarial.',
      },
    ],
    context: {
      userId: context.user.userId,
      organizationId: context.user.orgId,
      currentPage: 'load-test',
      language: 'es',
    },
  });
}
