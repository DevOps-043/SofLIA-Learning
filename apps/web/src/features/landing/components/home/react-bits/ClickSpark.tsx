'use client';

import {
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
} from 'react';

interface ClickSparkProps {
  sparkColor?: string;
  sparkSize?: number;
  sparkRadius?: number;
  sparkCount?: number;
  duration?: number;
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
  extraScale?: number;
  children?: ReactNode;
}

interface Spark {
  x: number;
  y: number;
  angle: number;
  startTime: number;
}

/**
 * Source-integrated from the React Bits ClickSpark registry component.
 */
export function ClickSpark({
  sparkColor,
  sparkSize = 8,
  sparkRadius = 22,
  sparkCount = 8,
  duration = 440,
  easing = 'ease-out',
  extraScale = 1,
  children,
}: ClickSparkProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sparksRef = useRef<Spark[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      canvas.getContext('2d')?.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    window.addEventListener('resize', resizeCanvas, { passive: true });
    resizeCanvas();
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  const ease = useCallback(
    (progress: number) => {
      switch (easing) {
        case 'linear':
          return progress;
        case 'ease-in':
          return progress * progress;
        case 'ease-in-out':
          return progress < 0.5
            ? 2 * progress * progress
            : -1 + (4 - 2 * progress) * progress;
        default:
          return progress * (2 - progress);
      }
    },
    [easing],
  );

  const startAnimation = useCallback(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context || animationFrameRef.current !== null) return;

    const resolvedSparkColor =
      sparkColor ||
      getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim() ||
      'white';

    const draw = (timestamp: number) => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      context.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

      sparksRef.current = sparksRef.current.filter((spark) => {
        const elapsed = timestamp - spark.startTime;
        if (elapsed >= duration) return false;

        const eased = ease(elapsed / duration);
        const distance = eased * sparkRadius * extraScale;
        const lineLength = sparkSize * (1 - eased);
        const x1 = spark.x + distance * Math.cos(spark.angle);
        const y1 = spark.y + distance * Math.sin(spark.angle);
        const x2 = spark.x + (distance + lineLength) * Math.cos(spark.angle);
        const y2 = spark.y + (distance + lineLength) * Math.sin(spark.angle);

        context.strokeStyle = resolvedSparkColor;
        context.lineWidth = 1.5;
        context.beginPath();
        context.moveTo(x1, y1);
        context.lineTo(x2, y2);
        context.stroke();
        return true;
      });

      if (sparksRef.current.length > 0) {
        animationFrameRef.current = requestAnimationFrame(draw);
      } else {
        animationFrameRef.current = null;
      }
    };

    animationFrameRef.current = requestAnimationFrame(draw);
  }, [duration, ease, extraScale, sparkColor, sparkRadius, sparkSize]);

  useEffect(
    () => () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    },
    [],
  );

  const handleClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;

    const now = performance.now();
    sparksRef.current.push(
      ...Array.from({ length: sparkCount }, (_, index) => ({
        x: event.clientX,
        y: event.clientY,
        angle: (2 * Math.PI * index) / sparkCount,
        startTime: now,
      })),
    );
    startAnimation();
  };

  return (
    <div className="relative min-h-full w-full" onClick={handleClick}>
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-[80]"
        aria-hidden="true"
      />
      {children}
    </div>
  );
}
