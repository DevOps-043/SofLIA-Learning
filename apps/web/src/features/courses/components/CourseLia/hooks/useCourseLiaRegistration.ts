import { useEffect, useMemo } from 'react';

import type { CourseLessonContext } from '@/core/types/lia.types';
import type { UseLiaCourseChatReturn } from '@/core/hooks/useLiaCourseChat';

interface UseCourseLiaRegistrationArgs {
  liaChat: UseLiaCourseChatReturn;
  registerLiaChat: (chat: UseLiaCourseChatReturn | null) => void;
  resolvedLessonContext?: CourseLessonContext;
  setCourseContext: (context: CourseLessonContext | null) => void;
}

export function useCourseLiaRegistration({
  liaChat,
  registerLiaChat,
  resolvedLessonContext,
  setCourseContext,
}: UseCourseLiaRegistrationArgs) {
  useEffect(() => {
    registerLiaChat(liaChat);
    return () => registerLiaChat(null);
  }, [liaChat, registerLiaChat]);

  // Clave estable por valor: si el caller construye `resolvedLessonContext`
  // en cada render (objeto nuevo), depender de la referencia haría que el
  // efecto corra siempre -> setCourseContext re-renderiza -> bucle infinito
  // ("Maximum update depth exceeded"). Serializar el contenido evita el loop.
  const lessonContextKey = useMemo(
    () => (resolvedLessonContext ? JSON.stringify(resolvedLessonContext) : null),
    [resolvedLessonContext],
  );

  useEffect(() => {
    setCourseContext(resolvedLessonContext || null);
    return () => setCourseContext(null);
    // El efecto depende del CONTENIDO (lessonContextKey), no de la referencia.
    // `setCourseContext` es un setter estable y `resolvedLessonContext` se lee
    // siempre actualizado porque cambia junto con `lessonContextKey`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonContextKey]);
}
