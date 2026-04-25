import { cn } from '@/utils/cn';
import { Logo } from './Logo';

interface Props {
  variant?: 'branca' | 'preta';
  compact?: boolean;
  className?: string;
}

/** Marca do sistema: logo + "Evangelho Pleno · Gestão Ministerial". */
export function Brand({ variant = 'branca', compact, className }: Props) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Logo variant={variant} className={cn(compact ? 'h-7' : 'h-9', 'w-auto')} />
      {!compact && (
        <div className="leading-tight">
          <p className="font-brand text-[13px] font-semibold tracking-wide text-current">
            EVANGELHO PLENO
          </p>
          <p className="text-[10.5px] uppercase tracking-[0.14em] text-current/60">
            Gestão Ministerial
          </p>
        </div>
      )}
    </div>
  );
}
