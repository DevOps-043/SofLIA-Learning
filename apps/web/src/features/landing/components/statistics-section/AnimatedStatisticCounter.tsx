import { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';

interface AnimatedStatisticCounterProps {
  duration?: number;
  endValue: string;
}

export function AnimatedStatisticCounter({
  duration = 2,
  endValue,
}: AnimatedStatisticCounterProps) {
  const [count, setCount] = useState<number | string>(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    const numericValue = Number.parseInt(endValue.replace(/[^\d]/g, ''), 10);
    if (Number.isNaN(numericValue)) {
      setCount(endValue);
      return;
    }

    const increment = numericValue / (duration * 60);
    const timer = window.setInterval(() => {
      setCount((previous) => {
        if (typeof previous !== 'number') return numericValue;

        const next = previous + increment;
        if (next >= numericValue) {
          window.clearInterval(timer);
          return numericValue;
        }

        return next;
      });
    }, 1000 / 60);

    return () => window.clearInterval(timer);
  }, [duration, endValue, isInView]);

  return (
    <div ref={ref} className="text-4xl font-bold text-white lg:text-5xl xl:text-6xl">
      {typeof count === 'number' ? Math.floor(count).toLocaleString() : count}
    </div>
  );
}
