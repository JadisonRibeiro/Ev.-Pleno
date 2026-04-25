import { useState } from 'react';
import { cn } from '@/utils/cn';

interface Props {
  src?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClass = {
  sm: 'h-8 w-8 text-[10px]',
  md: 'h-10 w-10 text-xs',
  lg: 'h-12 w-12 text-sm',
};

export function Avatar({ src, name, size = 'md', className }: Props) {
  const [broken, setBroken] = useState(false);
  const initials = (name ?? '')
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  const useImg = !!src && !broken;

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold text-white',
        sizeClass[size],
        !useImg && 'bg-primary/90',
        className,
      )}
    >
      {useImg ? (
        <img
          src={src}
          alt={name || 'Avatar'}
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
          onError={() => setBroken(true)}
        />
      ) : (
        <span>{initials || '–'}</span>
      )}
    </div>
  );
}
