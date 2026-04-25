import { Search, X } from 'lucide-react';
import { cn } from '@/utils/cn';

export function FilterBar({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('card mb-4 flex flex-wrap items-center gap-3 !py-2.5', className)}>
      {children}
    </div>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Buscar…',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-1 items-center gap-2 min-w-[180px]">
      <Search size={15} className="text-text-subtle" />
      <input
        type="search"
        className="w-full border-0 bg-transparent p-0 text-sm text-text outline-none placeholder:text-text-subtle focus:ring-0"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ label: string; value: string }>;
}) {
  const selected = options.find((o) => o.value === value);
  return (
    <label className="inline-flex items-center gap-2 text-xs">
      <span className="text-text-subtle">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'rounded-md border bg-surface-2 px-2 py-1 text-text outline-none',
          value ? 'border-border-strong' : 'border-border',
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {selected && value !== '' && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="rounded-full p-0.5 text-text-subtle hover:bg-surface hover:text-text"
          aria-label={`Limpar ${label}`}
        >
          <X size={12} />
        </button>
      )}
    </label>
  );
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: Array<{ label: string; value: T }>;
}) {
  return (
    <div className="flex gap-1 rounded-md bg-surface-2 p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'rounded px-3 py-1.5 text-xs transition-colors',
            value === opt.value ? 'bg-surface text-text' : 'text-text-muted hover:text-text',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
