import { forwardRef } from 'react';
import { cn } from '@/utils/cn';

type Variant = 'ghost' | 'danger';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  label: string;
}

export const IconButton = forwardRef<HTMLButtonElement, Props>(function IconButton(
  { variant = 'ghost', label, className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors',
        variant === 'ghost' && 'text-text-muted hover:bg-surface-2 hover:text-text',
        variant === 'danger' && 'text-text-muted hover:bg-danger/10 hover:text-danger',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
});
