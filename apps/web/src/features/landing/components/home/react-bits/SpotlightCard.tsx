'use client';

import {
  type MouseEventHandler,
  type PropsWithChildren,
  useRef,
  useState,
} from 'react';

interface Position {
  x: number;
  y: number;
}

interface SpotlightCardProps extends PropsWithChildren {
  className?: string;
  spotlightColor?: string;
}

/**
 * Source-integrated from the React Bits SpotlightCard registry component.
 */
export function SpotlightCard({
  children,
  className = '',
  spotlightColor = 'rgb(var(--color-accent-rgb) / 0.16)',
}: SpotlightCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove: MouseEventHandler<HTMLDivElement> = (event) => {
    if (!cardRef.current || isFocused) return;
    const rect = cardRef.current.getBoundingClientRect();
    setPosition({ x: event.clientX - rect.left, y: event.clientY - rect.top });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onFocus={() => {
        setIsFocused(true);
        setOpacity(1);
      }}
      onBlur={() => {
        setIsFocused(false);
        setOpacity(0);
      }}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      className={`relative overflow-hidden ${className}`}
    >
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-500"
        style={{
          opacity,
          background: `radial-gradient(circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 72%)`,
        }}
        aria-hidden="true"
      />
      {children}
    </div>
  );
}
