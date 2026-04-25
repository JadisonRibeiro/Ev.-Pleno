import type { LucideIcon } from 'lucide-react';

export function Empty({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-5 py-12 text-center">
      {Icon && (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 text-text-muted">
          <Icon size={18} />
        </div>
      )}
      <p className="text-sm font-medium text-text">{title}</p>
      {description && <p className="max-w-md text-xs text-text-muted">{description}</p>}
      {action}
    </div>
  );
}
