'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ModernNavbarAvatarProps {
  alt: string;
  className: string;
  initials: string;
  profilePictureUrl?: string | null;
  size: number;
}

export function ModernNavbarAvatar({
  alt,
  className,
  initials,
  profilePictureUrl,
  size,
}: ModernNavbarAvatarProps) {
  const [imgError, setImgError] = useState(false);

  if (profilePictureUrl && !imgError) {
    return (
      <Image
        src={profilePictureUrl}
        alt={alt}
        width={size}
        height={size}
        className={className}
        onError={() => setImgError(true)}
      />
    );
  }

  return <span className="text-sm font-bold text-white">{initials}</span>;
}
