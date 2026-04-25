import { useMemo, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Empty } from './Empty';

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  /** Render do conteúdo da célula. */
  cell: (row: T) => React.ReactNode;
  /** Valor para ordenação — string ou number. Quando ausente, coluna não é ordenável. */
  sortValue?: (row: T) => string | number;
  /** Alinhamento do conteúdo. */
  align?: 'left' | 'right' | 'center';
  /** Largura CSS opcional. */
  width?: string;
  /** Classes Tailwind extras na célula (não no header). */
  className?: string;
  /** Esconder em telas pequenas. */
  hideOn?: 'sm' | 'md' | 'lg';
}

interface Props<T> {
  data: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  /** Ação ao clicar em uma linha inteira (ex.: abrir drawer de edição). */
  onRowClick?: (row: T) => void;
  /** Render de ações por linha (botões à direita, sticky). */
  actions?: (row: T) => React.ReactNode;
  /** Tamanho da página. Default 25. Use 0 pra desativar paginação. */
  pageSize?: number;
}

type SortDir = 'asc' | 'desc';

export function DataTable<T>({
  data,
  columns,
  rowKey,
  isLoading,
  emptyTitle = 'Nada por aqui ainda.',
  emptyDescription,
  emptyAction,
  onRowClick,
  actions,
  pageSize = 25,
}: Props<T>) {
  const [sort, setSort] = useState<{ key: string; dir: SortDir } | null>(null);
  const [page, setPage] = useState(0);

  const sorted = useMemo(() => {
    if (!sort) return data;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return data;
    const factor = sort.dir === 'asc' ? 1 : -1;
    return [...data].sort((a, b) => {
      const va = col.sortValue!(a);
      const vb = col.sortValue!(b);
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * factor;
      return String(va).localeCompare(String(vb), 'pt-BR') * factor;
    });
  }, [data, columns, sort]);

  const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(sorted.length / pageSize)) : 1;
  const visiblePage = Math.min(page, totalPages - 1);
  const visible =
    pageSize > 0
      ? sorted.slice(visiblePage * pageSize, (visiblePage + 1) * pageSize)
      : sorted;

  const colCount = columns.length + (actions ? 1 : 0);

  function toggleSort(col: Column<T>) {
    if (!col.sortValue) return;
    setPage(0);
    setSort((cur) => {
      if (!cur || cur.key !== col.key) return { key: col.key, dir: 'asc' };
      if (cur.dir === 'asc') return { key: col.key, dir: 'desc' };
      return null;
    });
  }

  return (
    <div className="card overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs font-medium text-text-muted">
            <tr className="border-b border-border">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={cn(
                    'px-4 py-3 select-none',
                    col.align === 'right' && 'text-right',
                    col.align === 'center' && 'text-center',
                    col.hideOn === 'sm' && 'hidden sm:table-cell',
                    col.hideOn === 'md' && 'hidden md:table-cell',
                    col.hideOn === 'lg' && 'hidden lg:table-cell',
                  )}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.sortValue ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(col)}
                      className={cn(
                        'inline-flex items-center gap-1 transition-colors hover:text-text',
                        sort?.key === col.key && 'text-text',
                      )}
                    >
                      {col.header}
                      <SortIcon dir={sort?.key === col.key ? sort.dir : null} />
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              ))}
              {actions && <th className="px-4 py-3 text-right">Ações</th>}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={colCount} className="px-4 py-10 text-center text-text-muted">
                  Carregando…
                </td>
              </tr>
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={colCount} className="px-4 py-10">
                  <Empty title={emptyTitle} description={emptyDescription} action={emptyAction} />
                </td>
              </tr>
            ) : (
              visible.map((row) => (
                <tr
                  key={rowKey(row)}
                  className={cn(
                    'border-b border-border last:border-0 transition-colors',
                    onRowClick
                      ? 'cursor-pointer hover:bg-surface-2'
                      : 'hover:bg-surface-2',
                  )}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        'px-4 py-3 align-top',
                        col.align === 'right' && 'text-right',
                        col.align === 'center' && 'text-center',
                        col.hideOn === 'sm' && 'hidden sm:table-cell',
                        col.hideOn === 'md' && 'hidden md:table-cell',
                        col.hideOn === 'lg' && 'hidden lg:table-cell',
                        col.className,
                      )}
                    >
                      {col.cell(row)}
                    </td>
                  ))}
                  {actions && (
                    <td
                      className="px-4 py-3 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="inline-flex items-center gap-1">{actions(row)}</div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {pageSize > 0 && sorted.length > pageSize && (
        <div className="flex items-center justify-between border-t border-border px-4 py-2 text-xs text-text-muted">
          <span>
            {visiblePage * pageSize + 1}–
            {Math.min((visiblePage + 1) * pageSize, sorted.length)} de {sorted.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={visiblePage === 0}
              className="rounded-md p-1 text-text-muted transition-colors hover:bg-surface-2 hover:text-text disabled:opacity-40 disabled:hover:bg-transparent"
              aria-label="Página anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="tabular-nums">
              {visiblePage + 1} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={visiblePage >= totalPages - 1}
              className="rounded-md p-1 text-text-muted transition-colors hover:bg-surface-2 hover:text-text disabled:opacity-40 disabled:hover:bg-transparent"
              aria-label="Próxima página"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SortIcon({ dir }: { dir: SortDir | null }) {
  if (dir === 'asc') return <ChevronUp size={12} />;
  if (dir === 'desc') return <ChevronDown size={12} />;
  return <ChevronDown size={12} className="opacity-30" />;
}
