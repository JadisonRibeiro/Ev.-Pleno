import { cn } from '@/utils/cn';

interface Props {
  kicker?: string;
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ kicker, title, subtitle, actions, className }: Props) {
  return (
    <header className={cn('mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0">
        {kicker && <p className="kicker">{kicker}</p>}
        <h1 className="page-title mt-1">{title}</h1>
        {subtitle && <div className="page-subtitle">{subtitle}</div>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
