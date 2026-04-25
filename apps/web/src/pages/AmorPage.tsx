import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  ChevronDown,
  HandHeart,
  Heart,
  Pencil,
  Plus,
  RefreshCcw,
  Trash2,
  X,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import type { AmorDecision, Cell } from '@/types/api';
import { cn } from '@/utils/cn';
import { useDebounced } from '@/hooks/useDebounced';
import { apiError } from '@/lib/error';
import { formatNumber, formatPct } from '@/lib/format';
import { PageHeader } from '@/components/ui/PageHeader';
import { FilterBar, SearchInput } from '@/components/ui/FilterBar';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { IconButton } from '@/components/ui/IconButton';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toast } from '@/components/ui/Toaster';
import { AmorEditDialog } from '@/components/AmorEditDialog';

type PeriodPreset =
  | 'all'
  | 'today'
  | 'yesterday'
  | '7d'
  | '30d'
  | 'thisMonth'
  | 'lastMonth'
  | 'custom';

export default function AmorPage() {
  const user = useAuth((s) => s.user)!;
  const isAdmin = user.role === 'admin';
  const qc = useQueryClient();

  const [query, setQuery] = useState('');
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('all');
  const [customFrom, setCustomFrom] = useState(''); // yyyy-mm-dd
  const [customTo, setCustomTo] = useState(''); // yyyy-mm-dd

  const [editing, setEditing] = useState<AmorDecision | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<AmorDecision | null>(null);

  const debounced = useDebounced(query, 200);

  const { data: decisions = [], isLoading } = useQuery({
    queryKey: ['amor'],
    queryFn: async () =>
      (await api.get<{ decisions: AmorDecision[] }>('/amor')).data.decisions,
  });
  const cellsQ = useQuery({
    queryKey: ['cells'],
    queryFn: async () => (await api.get<{ cells: Cell[] }>('/cells')).data.cells,
    enabled: isAdmin,
  });

  const create = useMutation({
    mutationFn: async (input: Partial<AmorDecision>) => {
      await api.post('/amor', input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['amor'] });
      toast.success('Decisão registrada');
      setCreating(false);
    },
    onError: (err) => toast.error('Erro ao registrar', apiError(err)),
  });

  const update = useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<AmorDecision>;
    }) => {
      await api.patch(`/amor/${id}`, patch);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['amor'] });
      toast.success('Decisão atualizada');
      setEditing(null);
    },
    onError: (err) => toast.error('Erro ao salvar', apiError(err)),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/amor/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['amor'] });
      toast.success('Decisão removida');
      setDeleting(null);
    },
    onError: (err) => toast.error('Erro ao remover', apiError(err)),
  });

  const range = useMemo(
    () => computeRange(periodPreset, customFrom, customTo),
    [periodPreset, customFrom, customTo],
  );

  const filtered = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    return decisions.filter((d) => {
      if (q) {
        const hay = `${d.nome} ${d.telefone} ${d.bairro} ${d.opcaoCelula}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (range) {
        const date = parseBRDate(d.dataCadastro);
        if (!date) return false;
        if (range.from && date < range.from) return false;
        if (range.to && date > range.to) return false;
      }
      return true;
    });
  }, [decisions, debounced, range]);

  // KPIs refletem o filtro atual (período + busca).
  const stats = useMemo(() => {
    const total = filtered.length;
    const aceitou = filtered.filter((d) =>
      d.decisao.toLowerCase().includes('aceit'),
    ).length;
    const reconciliou = filtered.filter((d) =>
      d.decisao.toLowerCase().includes('reconcilia'),
    ).length;
    return { total, aceitou, reconciliou };
  }, [filtered]);

  const periodActive = periodPreset !== 'all';

  function clearPeriod() {
    setPeriodPreset('all');
    setCustomFrom('');
    setCustomTo('');
  }

  const columns: Column<AmorDecision>[] = [
    {
      key: 'nome',
      header: 'Pessoa',
      sortValue: (d) => d.nome.toLowerCase(),
      cell: (d) => (
        <div>
          <p className="font-medium text-text">{d.nome}</p>
          {(d.telefone || d.dataCadastro) && (
            <p className="text-xs text-text-muted">
              {[d.telefone, d.dataCadastro].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'decisao',
      header: 'Decisão',
      sortValue: (d) => d.decisao.toLowerCase(),
      cell: (d) => (
        <div>
          <p className="text-text-muted">{d.decisao || '—'}</p>
          {d.decidiuNo && <p className="text-xs text-text-subtle">em {d.decidiuNo}</p>}
        </div>
      ),
    },
    {
      key: 'bairro',
      header: 'Bairro',
      sortValue: (d) => d.bairro.toLowerCase(),
      cell: (d) => <span className="text-text-muted">{d.bairro || '—'}</span>,
      hideOn: 'md',
    },
    {
      key: 'opcao',
      header: 'Opção de célula',
      sortValue: (d) => d.opcaoCelula.toLowerCase(),
      cell: (d) => (
        <span className="text-text-muted">{d.opcaoCelula || '—'}</span>
      ),
      hideOn: 'md',
    },
    {
      key: 'emCelula',
      header: 'Em célula?',
      cell: (d) => (
        <span
          className={cn(
            'badge whitespace-nowrap',
            d.jaEmCelula.toLowerCase().startsWith('sim')
              ? 'badge-success'
              : 'badge-neutral',
          )}
        >
          <span className="badge-dot bg-current" />
          {d.jaEmCelula || '—'}
        </span>
      ),
    },
  ];

  return (
    <section className="animate-fade-up">
      <PageHeader
        kicker="Vidas alcançadas"
        title="AMAR"
        subtitle={
          isAdmin
            ? `${formatNumber(filtered.length)} de ${formatNumber(decisions.length)} decisões`
            : `Opção pela célula ${user.celula} · ${formatNumber(filtered.length)} de ${formatNumber(decisions.length)}`
        }
        actions={
          <button
            type="button"
            className="btn-primary"
            onClick={() => setCreating(true)}
          >
            <Plus size={16} />
            Nova decisão
          </button>
        }
      />

      {/* KPIs (3 cards distribuídos) */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Kpi icon={Heart} label="Total de decisões" value={stats.total} />
        <Kpi
          icon={HandHeart}
          label="Aceitaram Jesus"
          value={stats.aceitou}
          hint={formatPct(pct(stats.aceitou, stats.total))}
          tone="primary"
        />
        <Kpi
          icon={RefreshCcw}
          label="Reconciliações"
          value={stats.reconciliou}
          hint={formatPct(pct(stats.reconciliou, stats.total))}
        />
      </div>

      <FilterBar>
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Buscar nome, telefone, bairro ou célula…"
        />
        <PeriodFilter
          preset={periodPreset}
          customFrom={customFrom}
          customTo={customTo}
          onChange={(p, from, to) => {
            setPeriodPreset(p);
            setCustomFrom(from);
            setCustomTo(to);
          }}
        />
        {periodActive && (
          <button
            type="button"
            onClick={clearPeriod}
            className="ml-auto text-xs text-text-muted hover:text-text"
          >
            Limpar período
          </button>
        )}
      </FilterBar>

      <DataTable
        data={filtered}
        columns={columns}
        rowKey={(d) => d.id}
        isLoading={isLoading}
        emptyTitle="Nenhuma decisão encontrada"
        emptyDescription={
          periodActive || query
            ? 'Tente ajustar os filtros.'
            : 'Comece registrando a primeira decisão.'
        }
        emptyAction={
          !periodActive && !query ? (
            <button onClick={() => setCreating(true)} className="btn-primary mt-3">
              <Plus size={16} /> Nova decisão
            </button>
          ) : null
        }
        onRowClick={isAdmin ? (d) => setEditing(d) : undefined}
        actions={
          isAdmin
            ? (d) => (
                <>
                  <IconButton label="Editar" onClick={() => setEditing(d)}>
                    <Pencil size={14} />
                  </IconButton>
                  <IconButton
                    label="Excluir"
                    variant="danger"
                    onClick={() => setDeleting(d)}
                  >
                    <Trash2 size={14} />
                  </IconButton>
                </>
              )
            : undefined
        }
      />

      <AmorEditDialog
        open={!!editing || creating}
        decision={editing}
        isAdmin={isAdmin}
        cells={cellsQ.data ?? []}
        defaultCell={user.celula}
        defaultResponsavel={user.nome}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(null);
            setCreating(false);
          }
        }}
        onSubmit={(values) => {
          if (editing) update.mutate({ id: editing.id, patch: values });
          else create.mutate(values);
        }}
        submitting={create.isPending || update.isPending}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Excluir registro de ${deleting?.nome}?`}
        description={
          <>
            Esta ação remove a linha da planilha e <strong>não pode ser desfeita</strong>.
          </>
        }
        confirmLabel="Excluir"
        variant="danger"
        loading={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </section>
  );
}

// ─── Period filter ───────────────────────────────────────────────────────────

const PRESET_LABELS: Record<PeriodPreset, string> = {
  all: 'Todo o período',
  today: 'Hoje',
  yesterday: 'Ontem',
  '7d': 'Últimos 7 dias',
  '30d': 'Últimos 30 dias',
  thisMonth: 'Este mês',
  lastMonth: 'Mês anterior',
  custom: 'Personalizado',
};

const QUICK_PRESETS: PeriodPreset[] = [
  'today',
  'yesterday',
  '7d',
  '30d',
  'thisMonth',
  'lastMonth',
];

const POPOVER_WIDTH = 340;
const POPOVER_MARGIN = 12;

function PeriodFilter({
  preset,
  customFrom,
  customTo,
  onChange,
}: {
  preset: PeriodPreset;
  customFrom: string;
  customTo: string;
  onChange: (preset: PeriodPreset, from: string, to: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [align, setAlign] = useState<'left' | 'right'>('left');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t)) return;
      if (popRef.current?.contains(t)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function reposition() {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const vw = window.innerWidth;
      const desiredWidth = Math.min(POPOVER_WIDTH, vw - POPOVER_MARGIN * 2);
      // Prefer left-align (popover's left edge at trigger.left).
      // Flip to right-align if it would overflow the viewport.
      const wouldOverflowRight = rect.left + desiredWidth + POPOVER_MARGIN > vw;
      setAlign(wouldOverflowRight ? 'right' : 'left');
    }
    reposition();
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => {
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [open]);

  const label = useMemo(() => {
    if (preset === 'custom') {
      const from = customFrom ? formatDateBR(customFrom) : '…';
      const to = customTo ? formatDateBR(customTo) : '…';
      return `${from} → ${to}`;
    }
    return PRESET_LABELS[preset];
  }, [preset, customFrom, customTo]);

  const isActive = preset !== 'all';

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex h-10 items-center gap-2 rounded-lg border px-3 text-sm transition-all',
          isActive
            ? 'border-primary/40 bg-primary-soft text-primary'
            : 'border-border bg-surface text-text hover:border-border-strong hover:bg-surface-2',
        )}
        style={
          isActive
            ? { boxShadow: '0 0 0 3px rgba(127,29,43,0.10)' }
            : undefined
        }
      >
        <Calendar size={15} className={isActive ? 'text-primary' : 'text-text-muted'} />
        <span className="font-medium">{label}</span>
        <ChevronDown
          size={14}
          className={cn('text-text-muted transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div
          ref={popRef}
          className={cn(
            'absolute top-full z-40 mt-2 rounded-xl border border-border bg-surface p-4 shadow-high',
            align === 'right' ? 'right-0' : 'left-0',
          )}
          style={{
            width: `min(${POPOVER_WIDTH}px, calc(100vw - ${POPOVER_MARGIN * 2}px))`,
            boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
          }}
        >
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-muted">
              Período rápido
            </p>
            {preset !== 'all' && (
              <button
                type="button"
                onClick={() => {
                  onChange('all', '', '');
                  setOpen(false);
                }}
                className="flex items-center gap-1 text-[11px] text-text-muted hover:text-text"
              >
                <X size={11} /> Limpar
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {QUICK_PRESETS.map((p) => {
              const active = preset === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    onChange(p, '', '');
                    setOpen(false);
                  }}
                  className={cn(
                    'rounded-lg border px-3 py-2 text-left text-sm transition-all',
                    active
                      ? 'border-primary/50 bg-primary-soft text-primary'
                      : 'border-border bg-surface text-text hover:border-primary/30 hover:bg-surface-2',
                  )}
                >
                  {PRESET_LABELS[p]}
                </button>
              );
            })}
          </div>

          <div className="my-3 flex items-center gap-2">
            <span className="h-px flex-1 bg-border" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-muted">
              Personalizado
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wide text-text-muted">De</span>
              <input
                type="date"
                value={customFrom}
                max={customTo || undefined}
                onChange={(e) => onChange('custom', e.target.value, customTo)}
                className="h-9 rounded-lg border border-border bg-surface-2 px-2.5 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wide text-text-muted">Até</span>
              <input
                type="date"
                value={customTo}
                min={customFrom || undefined}
                onChange={(e) => onChange('custom', customFrom, e.target.value)}
                className="h-9 rounded-lg border border-border bg-surface-2 px-2.5 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
            </label>
          </div>

          <div className="mt-4 flex items-center justify-between text-[11px] text-text-subtle">
            <span>
              {preset === 'custom' && (customFrom || customTo)
                ? `${customFrom ? formatDateBR(customFrom) : '…'} → ${customTo ? formatDateBR(customTo) : '…'}`
                : 'Filtra pela data de cadastro da decisão.'}
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md px-2 py-1 font-medium text-text hover:bg-surface-2"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Date helpers ────────────────────────────────────────────────────────────

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function computeRange(
  preset: PeriodPreset,
  fromStr: string,
  toStr: string,
): { from: Date | null; to: Date | null } | null {
  const now = new Date();
  switch (preset) {
    case 'all':
      return null;
    case 'today':
      return { from: startOfDay(now), to: endOfDay(now) };
    case 'yesterday': {
      const y = addDays(now, -1);
      return { from: startOfDay(y), to: endOfDay(y) };
    }
    case '7d':
      return { from: startOfDay(addDays(now, -6)), to: endOfDay(now) };
    case '30d':
      return { from: startOfDay(addDays(now, -29)), to: endOfDay(now) };
    case 'thisMonth': {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: startOfDay(from), to: endOfDay(now) };
    }
    case 'lastMonth': {
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const to = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: startOfDay(from), to: endOfDay(to) };
    }
    case 'custom': {
      const from = fromStr ? startOfDay(parseISO(fromStr)) : null;
      const to = toStr ? endOfDay(parseISO(toStr)) : null;
      if (!from && !to) return null;
      return { from, to };
    }
  }
}

function parseISO(yyyymmdd: string): Date {
  const [y, m, d] = yyyymmdd.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

function parseBRDate(s: string): Date | null {
  if (!s) return null;
  const trimmed = s.trim();
  if (!trimmed) return null;

  // Google Sheets serial number (UNFORMATTED_VALUE returns dates this way).
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    return fromSheetSerial(parseFloat(trimmed));
  }

  // DD/MM/YYYY [HH:mm[:ss]]
  const br = trimmed.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/,
  );
  if (br) {
    const dd = br[1] ?? '1';
    const mm = br[2] ?? '1';
    const yy = br[3] ?? '1970';
    const hh = br[4];
    const mi = br[5];
    const ss = br[6];
    const year = yy.length === 2 ? 2000 + parseInt(yy, 10) : parseInt(yy, 10);
    const dt = new Date(
      year,
      parseInt(mm, 10) - 1,
      parseInt(dd, 10),
      hh ? parseInt(hh, 10) : 0,
      mi ? parseInt(mi, 10) : 0,
      ss ? parseInt(ss, 10) : 0,
    );
    return Number.isNaN(dt.getTime()) ? null : dt;
  }

  // ISO fallback (YYYY-MM-DD, RFC 3339, etc.)
  const iso = new Date(trimmed);
  return Number.isNaN(iso.getTime()) ? null : iso;
}

/** Sheets epoch is 1899-12-30; Unix epoch is 1970-01-01 → 25569 days apart. */
function fromSheetSerial(serial: number): Date | null {
  if (!Number.isFinite(serial) || serial <= 0) return null;
  const epochMs = (serial - 25569) * 86400 * 1000;
  const utc = new Date(epochMs);
  if (Number.isNaN(utc.getTime())) return null;
  // Re-anchor UTC components as local-time so wall-clock matches the sheet cell.
  return new Date(
    utc.getUTCFullYear(),
    utc.getUTCMonth(),
    utc.getUTCDate(),
    utc.getUTCHours(),
    utc.getUTCMinutes(),
    utc.getUTCSeconds(),
  );
}

function formatDateBR(yyyymmdd: string): string {
  if (!yyyymmdd) return '';
  const [y, m, d] = yyyymmdd.split('-');
  return `${d}/${m}/${y}`;
}

// ─── Shared sub-components ───────────────────────────────────────────────────

function Kpi({
  icon: Icon,
  label,
  value,
  hint,
  tone = 'neutral',
}: {
  icon: typeof Heart;
  label: string;
  value: number;
  hint?: string;
  tone?: 'neutral' | 'primary';
}) {
  const tint =
    tone === 'primary'
      ? { background: 'var(--primary-soft)', color: 'var(--primary)' }
      : { background: 'var(--surface-2)', color: 'var(--text-muted)' };
  return (
    <div className="card card-hover">
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          style={tint}
        >
          <Icon size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-text-muted">{label}</p>
          <p className="mt-0.5 text-2xl font-semibold tabular-nums text-text">
            {formatNumber(value)}
          </p>
          {hint && <p className="mt-0.5 text-xs text-text-subtle">{hint}</p>}
        </div>
      </div>
    </div>
  );
}

function pct(n: number, total: number): number {
  return total === 0 ? 0 : (n / total) * 100;
}
