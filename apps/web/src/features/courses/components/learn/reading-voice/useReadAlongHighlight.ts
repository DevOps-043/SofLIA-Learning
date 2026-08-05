'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';

import {
  collectReadAlongBlocks,
  type ReadAlongBlock,
} from './read-along-blocks';
import {
  buildTimedSegments,
  getActiveSegmentIndex,
  type TimedSegment,
} from './reading-highlight';

interface UseReadAlongHighlightParams {
  /** Contenedor ya renderizado (incluye HTML inyectado con dangerouslySetInnerHTML). */
  containerRef: RefObject<HTMLElement>;
  /** Cambia cuando cambia el contenido: fuerza a recalcular los bloques. */
  contentKey: string;
  currentTime: number;
  duration: number;
  /** Clase que marca el bloque en curso. */
  highlightClassName: string;
  /** `true` mientras hay reproducción (sonando o en pausa). */
  isActive: boolean;
}

interface BlockTimeline {
  blocks: ReadAlongBlock[];
  segments: TimedSegment[];
  totalChars: number;
}

const EMPTY_TIMELINE: BlockTimeline = { blocks: [], segments: [], totalChars: 0 };

/**
 * Subrayado de seguimiento sobre DOM ya renderizado.
 *
 * POR QUÉ SOBRE EL DOM Y NO EN JSX: las lecturas y reflexiones se guardan como
 * HTML enriquecido y se pintan con `dangerouslySetInnerHTML`. Ese contenido no
 * pasa por el árbol de React, así que no hay dónde colgar una clase condicional;
 * el bloque activo se marca mutando `classList` sobre los nodos reales.
 *
 * La clase se aplica y se retira sobre el mismo nodo, sin volver a escribir el
 * `innerHTML`: React solo reemplaza el HTML cuando la cadena cambia, de modo que
 * el marcado sobrevive a los ~4 renders por segundo del reloj del audio.
 */
export function useReadAlongHighlight({
  containerRef,
  contentKey,
  currentTime,
  duration,
  highlightClassName,
  isActive,
}: UseReadAlongHighlightParams): void {
  const timelineRef = useRef<BlockTimeline>(EMPTY_TIMELINE);
  const highlightedRef = useRef<HTMLElement | null>(null);
  // El recálculo de bloques ocurre en un efecto (necesita el DOM montado); este
  // contador reactiva el efecto de subrayado cuando la lista ya está lista.
  const [timelineVersion, setTimelineVersion] = useState(0);

  useEffect(() => {
    // `classList.add('')` lanza. Un nombre de clase vacío solo puede venir de un
    // módulo CSS que no resolvió: mejor quedarse sin subrayado que romper el
    // lector entero.
    if (!highlightClassName) return;

    const blocks = collectReadAlongBlocks(containerRef.current);
    const { segments, totalChars } = buildTimedSegments(
      blocks.map((block) => block.text),
    );

    highlightedRef.current?.classList.remove(highlightClassName);
    highlightedRef.current = null;
    timelineRef.current = { blocks, segments, totalChars };
    setTimelineVersion((version) => version + 1);
  }, [containerRef, contentKey, highlightClassName]);

  useEffect(() => {
    if (!highlightClassName) return;

    const { blocks, segments, totalChars } = timelineRef.current;
    const activeIndex = isActive
      ? getActiveSegmentIndex(segments, totalChars, currentTime, duration)
      : -1;
    const nextElement =
      activeIndex >= 0 ? blocks[activeIndex]?.element ?? null : null;

    if (highlightedRef.current === nextElement) return;

    highlightedRef.current?.classList.remove(highlightClassName);
    nextElement?.classList.add(highlightClassName);
    highlightedRef.current = nextElement;
  }, [currentTime, duration, highlightClassName, isActive, timelineVersion]);

  // Al desmontar se limpia la clase: el nodo puede sobrevivir al componente si
  // el contenedor se reutiliza entre lecciones.
  useEffect(
    () => () => {
      highlightedRef.current?.classList.remove(highlightClassName);
      highlightedRef.current = null;
    },
    [highlightClassName],
  );
}
