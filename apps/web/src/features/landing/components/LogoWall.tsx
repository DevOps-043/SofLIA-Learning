'use client';

import React from 'react';

import { LiaAvatarPanel } from './logo-wall/LiaAvatarPanel';
import { LiaContentPanel } from './logo-wall/LiaContentPanel';

interface LogoWallProps {
  className?: string;
}

export function LogoWall({ className = '' }: LogoWallProps) {
  return (
    <section
      className={`overflow-hidden bg-gradient-to-b from-white to-gray-100/30 py-16 dark:from-gray-900 dark:to-primary/30 lg:py-24 ${className}`}
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <LiaAvatarPanel />
          <LiaContentPanel />
        </div>
      </div>
    </section>
  );
}
