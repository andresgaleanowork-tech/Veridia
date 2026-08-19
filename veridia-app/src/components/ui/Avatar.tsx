import { useState } from 'react';

type AvatarSize = 'sm' | 'md' | 'lg';
type AvatarStatus = 'online' | 'offline' | 'busy' | null;

interface AvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: AvatarSize;
  status?: AvatarStatus;
  className?: string;
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
};

const statusColors: Record<NonNullable<AvatarStatus>, string> = {
  online: 'bg-success',
  offline: 'bg-text-3',
  busy: 'bg-danger',
};

export function Avatar({ src, alt = 'Avatar', fallback, size = 'md', status, className = '' }: AvatarProps) {
  const [imageError, setImageError] = useState(false);

  const showFallback = !src || imageError;
  const initials = fallback || alt.charAt(0).toUpperCase();

  return (
    <div className={`relative inline-flex shrink-0 ${className}`}>
      {showFallback ? (
        <div
          className={[
            sizeClasses[size],
            'inline-flex items-center justify-center rounded-full',
            'bg-gradient-to-br from-primary to-accent text-white font-semibold',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {initials}
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className={[
            sizeClasses[size],
            'rounded-full object-cover',
          ]
            .filter(Boolean)
            .join(' ')}
          onError={() => setImageError(true)}
        />
      )}
      {status && (
        <span
          className={[
            'absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-bg',
            statusColors[status],
          ]
            .filter(Boolean)
            .join(' ')}
        />
      )}
    </div>
  );
}
