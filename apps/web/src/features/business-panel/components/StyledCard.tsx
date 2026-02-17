'use client';

import { ReactNode, CSSProperties } from 'react';

interface StyledCardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function StyledCard({ children, className = '', style = {} }: StyledCardProps) {
  const defaultStyle: CSSProperties = {
    backgroundColor: `rgba(var(--org-card-background-rgb, 15, 23, 42), var(--org-card-opacity, 1))`,
    borderColor: 'var(--org-border-color, rgba(71, 85, 105, 0.3))',
    ...style
  };

  return (
    <div
      className={`rounded-lg border ${className}`}
      style={defaultStyle}
    >
      {children}
    </div>
  );
}

