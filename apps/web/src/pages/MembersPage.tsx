import { useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Droplets,
  GraduationCap,
  HeartHandshake,
  Pencil,
  Plus,
  Trash2,
  Users,
  Check,
  X,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import type { Cell, Member } from '@/types/api';
import { cn } from '@/utils/cn';
import { useDebounced } from '@/hooks/useDebounced';
import { apiError } from '@/lib/error';
import { formatNumber, formatPct } from '@/lib/format';
import { PageHeader } from '@/components/ui/PageHeader';
import { FilterBar, FilterSelect, SearchInput } from '@/components/ui/FilterBar';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { IconButton } from '@/components/ui/IconButton';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toast } from '@/components/ui/Toaster';
import { MemberEditDialog } from '@/components/MemberEditDialog';

export default function MembersPage() {
  const user = useAuth((s) => s.user)!;
  const isAdmin = user.role === 'admin';
  const qc = useQueryClient();

  const [query, setQuery] = useState('');
  const [celula, setCelula] = useState('');

  const [editing, setEditing] = useState<Member | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Member | null>(null);

  const debouncedQuery = useDebounced(query, 200);

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['members'],
    queryFn: async () => (await api.get<{ members: Member[] }>('/members')).data.members,
  });
  const cellsQ = useQuery({
    queryKey: ['cells'],
    queryFn: async () => (await api.get<{ cells: Cell[] }>('/cells')).data.cells,
    enabled: isAdmin,
  });
  const cells = cellsQ.data ?? [];

  // Stats globais (igreja inteira) — para a Meta. Líderes também precisam ver
  // o progresso global, então sempre carregamos de /members/stats.
  const globalStatsQ = useQuery({
    queryKey: ['members', 'stats'],
    queryFn: async () =>
      (
        await api.get<{
          stats: {
            total: number;
            batismo: number;
            encontro: number;
            escola: number;
            completo: number;
          };
        }>('/members/stats')
      ).data.stats,
  });
  const globalTotal = globalStatsQ.data?.total ?? 0;

  const create = useMutation({
    mutationFn: async (input: Partial<Member>) => {
      await api.post('/members', input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members'] });
      toast.success('Membro criado com sucesso');
      setCreating(false);
    },
    onError: (err) => toast.error('Erro ao criar membro', apiError(err)),
  });

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Member> }) => {
      await api.patch(`/members/${id}`, patch);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members'] });
      toast.success('Membro atualizado');
      setEditing(null);
    },
    onError: (err) => toast.error('Erro ao salvar', apiError(err)),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/members/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members'] });
      toast.success('Membro removido');
      setDeleting(null);
    },
    onError: (err) => toast.error('Erro ao remover', apiError(err)),
  });

  const celulaOptions = useMemo(
    () => uniqueOptions(members.map((m) => m.celula)),
    [members],
  );

  const stats = useMemo(() => {
    const total = members.length;
    const batismo = members.filter((m) => isYes(m.batismo)).length;
    const encontro = members.filter((m) => isYes(m.encontroDeus)).length;
    const escola = members.filter((m) => isYes(m.escolaDiscipulos)).length;
    const completo = members.filter(
      (m) => isYes(m.batismo) && isYes(m.encontroDeus) && isYes(m.escolaDiscipulos),
    ).length;
    return { total, batismo, encontro, escola, completo };
  }, [members]);

  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    return members.filter((m) => {
      if (q) {
        const hay = `${m.nome} ${m.telefone} ${m.bairro} ${m.celula}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (celula && m.celula !== celula) return false;
      return true;
    });
  }, [members, debouncedQuery, celula]);

  const columns: Column<Member>[] = [
    {
      key: 'nome',
      header: 'Membro',
      sortValue: (m) => m.nome.toLowerCase(),
      cell: (m) => (
        <div>
          <p className="font-medium text-text">{m.nome}</p>
          {m.telefone && <p className="text-xs text-text-muted">{m.telefone}</p>}
        </div>
      ),
    },
    {
      key: 'celula',
      header: 'Célula',
      sortValue: (m) => m.celula.toLowerCase(),
      cell: (m) => <span className="text-text-muted">{m.celula || '—'}</span>,
      hideOn: 'sm',
    },
    {
      key: 'bairro',
      header: 'Bairro',
      sortValue: (m) => m.bairro.toLowerCase(),
      cell: (m) => <span className="text-text-muted">{m.bairro || '—'}</span>,
      hideOn: 'md',
    },
    {
      key: 'discipulado',
      header: 'Discipulado',
      cell: (m) => (
        <div className="flex flex-wrap gap-1">
          <Tag label="Bat." active={isYes(m.batismo)} />
          <Tag label="Enc." active={isYes(m.encontroDeus)} />
          <Tag label="Esc." active={isYes(m.escolaDiscipulos)} />
        </div>
      ),
    },
  ];

  return (
    <section className="animate-fade-up">
      <PageHeader
        kicker="Gestão"
        title="Membros"
        subtitle={
          isAdmin
            ? `${formatNumber(filtered.length)} de ${formatNumber(members.length)} membros`
            : `Célula ${user.celula} · ${formatNumber(filtered.length)} de ${formatNumber(members.length)}`
        }
        actions={
          <button
            type="button"
            className="btn-primary"
            onClick={() => setCreating(true)}
          >
            <Plus size={16} />
            Novo membro
          </button>
        }
      />

      {/* Meta tracker — sempre global (igreja inteira), inclusive para líderes. */}
      <MetaTracker total={globalTotal} />

      {/* KPIs — refletem o escopo do usuário (admin = todos, líder = sua célula). */}
      {!isAdmin && (
        <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-text-muted">
          Indicadores da célula {user.celula}
        </p>
      )}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          icon={Users}
          label={isAdmin ? 'Total de membros' : 'Membros da célula'}
          value={stats.total}
          hint={
            stats.completo > 0
              ? `${formatNumber(stats.completo)} com discipulado completo (${formatPct(pct(stats.completo, stats.total))})`
              : 'cadastrados na planilha'
          }
        />
        <Kpi
          icon={Droplets}
          label="Batizados nas águas"
          value={stats.batismo}
          hint={formatPct(pct(stats.batismo, stats.total))}
          tone="primary"
        />
        <Kpi
          icon={HeartHandshake}
          label="Encontro com Deus"
          value={stats.encontro}
          hint={formatPct(pct(stats.encontro, stats.total))}
        />
        <Kpi
          icon={GraduationCap}
          label="Escola de Discípulos"
          value={stats.escola}
          hint={formatPct(pct(stats.escola, stats.total))}
        />
      </div>

      <FilterBar>
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Buscar por nome, telefone ou bairro…"
        />
        {celulaOptions.length > 0 && (
          <FilterSelect
            label="Célula"
            value={celula}
            onChange={setCelula}
            options={[{ label: 'Todas', value: '' }, ...celulaOptions]}
          />
        )}
        {celula && (
          <button
            type="button"
            onClick={() => setCelula('')}
            className="ml-auto text-xs text-text-muted hover:text-text"
          >
            Limpar filtro
          </button>
        )}
      </FilterBar>

      <DataTable
        data={filtered}
        columns={columns}
        rowKey={(m) => m.id}
        isLoading={isLoading}
        emptyTitle="Nenhum membro encontrado"
        emptyDescription={
          celula || query ? 'Tente ajustar os filtros.' : 'Comece cadastrando o primeiro membro.'
        }
        emptyAction={
          !celula && !query ? (
            <button onClick={() => setCreating(true)} className="btn-primary mt-3">
              <Plus size={16} /> Novo membro
            </button>
          ) : null
        }
        onRowClick={(m) => setEditing(m)}
        actions={(m) => (
          <>
            <IconButton label="Editar" onClick={() => setEditing(m)}>
              <Pencil size={14} />
            </IconButton>
            {isAdmin && (
              <IconButton
                label="Excluir"
                variant="danger"
                onClick={() => setDeleting(m)}
              >
                <Trash2 size={14} />
              </IconButton>
            )}
          </>
        )}
      />

      <MemberEditDialog
        open={!!editing || creating}
        member={editing}
        isAdmin={isAdmin}
        cells={cells}
        defaultCell={user.celula}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(null);
            setCreating(false);
          }
        }}
        onSubmit={(values) => {
          if (editing) {
            update.mutate({ id: editing.id, patch: values });
          } else {
            create.mutate(values);
          }
        }}
        submitting={create.isPending || update.isPending}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Excluir ${deleting?.nome}?`}
        description={
          <>
            Esta ação remove a linha da planilha e <strong>não pode ser desfeita</strong>.
          </>
        }
        confirmLabel="Excluir membro"
        variant="danger"
        loading={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </section>
  );
}

// ─── Meta Tracker ────────────────────────────────────────────────────────────

const STORAGE_KEY = 'membros-meta-goal';

function MetaTracker({ total }: { total: number }) {
  const [goal, setGoal] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? Math.max(1, parseInt(saved, 10)) : 3000;
  });
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function openEdit() {
    setDraft(String(goal));
    setEditMode(true);
    setTimeout(() => inputRef.current?.select(), 0);
  }

  function confirmEdit() {
    const n = parseInt(draft, 10);
    if (n > 0) {
      setGoal(n);
      localStorage.setItem(STORAGE_KEY, String(n));
    }
    setEditMode(false);
  }

  function cancelEdit() {
    setEditMode(false);
  }

  const progress = Math.min((total / goal) * 100, 100);
  const remaining = Math.max(goal - total, 0);
  const reached = total >= goal;

  const R = 48;
  const circ = 2 * Math.PI * R;
  const fillDash = (progress / 100) * circ;

  return (
    <div
      className="mb-6 overflow-hidden rounded-2xl border"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      {/* accent bar */}
      <div
        style={{
          height: 4,
          background: reached
            ? 'linear-gradient(90deg, #166534 0%, #22c55e 100%)'
            : 'linear-gradient(90deg, #7f1d2b 0%, #e05a7a 100%)',
        }}
      />

      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:gap-8">
        {/* Ring */}
        <div className="relative mx-auto flex h-[130px] w-[130px] shrink-0 items-center justify-center sm:mx-0">
          <svg
            width="130"
            height="130"
            viewBox="0 0 130 130"
            style={{ transform: 'rotate(-90deg)' }}
          >
            <defs>
              <linearGradient id="metaRingGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                {reached ? (
                  <>
                    <stop offset="0%" stopColor="#166534" />
                    <stop offset="100%" stopColor="#22c55e" />
                  </>
                ) : (
                  <>
                    <stop offset="0%" stopColor="#7f1d2b" />
                    <stop offset="100%" stopColor="#e05a7a" />
                  </>
                )}
              </linearGradient>
            </defs>
            {/* track */}
            <circle
              cx="65"
              cy="65"
              r={R}
              fill="none"
              stroke="var(--surface-2)"
              strokeWidth="12"
            />
            {/* progress */}
            <circle
              cx="65"
              cy="65"
              r={R}
              fill="none"
              stroke="url(#metaRingGrad)"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${fillDash} ${circ}`}
              style={{ transition: 'stroke-dasharray 0.6s ease' }}
            />
          </svg>
          <div className="absolute flex flex-col items-center leading-none">
            <span
              className="text-2xl font-bold tabular-nums"
              style={{ color: reached ? '#22c55e' : 'var(--text)' }}
            >
              {progress < 1 && total > 0 ? '<1' : Math.round(progress)}%
            </span>
            <span className="mt-1 text-[10px] font-medium uppercase tracking-wide text-text-muted">
              da meta
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-text">
              {reached ? 'Meta alcançada!' : 'Meta Igreja dos 3 Mil'}
            </h2>
            {!editMode && (
              <button
                type="button"
                onClick={openEdit}
                title="Editar meta"
                className="flex h-6 w-6 items-center justify-center rounded-md transition-colors hover:bg-surface-2"
                style={{ color: 'var(--text-muted)' }}
              >
                <Pencil size={12} />
              </button>
            )}
          </div>

          {/* Edit inline form */}
          {editMode && (
            <div className="mt-2 flex items-center gap-2">
              <input
                ref={inputRef}
                type="number"
                min={1}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') confirmEdit();
                  if (e.key === 'Escape') cancelEdit();
                }}
                className="w-28 rounded-lg border px-2.5 py-1.5 text-sm tabular-nums text-text outline-none focus:ring-2"
                style={{
                  background: 'var(--surface-2)',
                  borderColor: 'var(--primary)',
                  '--tw-ring-color': 'var(--primary)',
                } as React.CSSProperties}
              />
              <button
                type="button"
                onClick={confirmEdit}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-white"
                style={{ background: 'var(--primary)' }}
                title="Confirmar"
              >
                <Check size={13} />
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="flex h-7 w-7 items-center justify-center rounded-lg"
                style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}
                title="Cancelar"
              >
                <X size={13} />
              </button>
              <span className="text-xs text-text-muted">nova meta de membros</span>
            </div>
          )}

          {/* Stats row */}
          <div className="mt-3 grid grid-cols-3 gap-3 sm:max-w-sm">
            <MetaStat label="Membros" value={formatNumber(total)} />
            <MetaStat label="Meta" value={formatNumber(goal)} />
            <MetaStat
              label="Faltam"
              value={reached ? '—' : formatNumber(remaining)}
              highlight={!reached}
            />
          </div>

          {/* Bar */}
          <div className="mt-4">
            <div
              className="h-2.5 overflow-hidden rounded-full"
              style={{ background: 'var(--surface-2)' }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  background: reached
                    ? 'linear-gradient(90deg, #166534 0%, #22c55e 100%)'
                    : 'linear-gradient(90deg, #7f1d2b 0%, #e05a7a 100%)',
                  transition: 'width 0.6s ease',
                }}
                className="h-full rounded-full"
              />
            </div>
            <p className="mt-2 text-xs text-text-muted">
              {reached
                ? `Parabéns! Vocês atingiram a meta de ${formatNumber(goal)} membros.`
                : `Faltam ${formatNumber(remaining)} membros para atingir a meta de ${formatNumber(goal)}.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetaStat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className="rounded-xl px-3 py-2.5 text-center"
      style={{ background: 'var(--surface-2)' }}
    >
      <p className="text-[10px] font-medium uppercase tracking-wide text-text-muted">{label}</p>
      <p
        className="mt-0.5 text-lg font-bold tabular-nums"
        style={{ color: highlight ? 'var(--primary)' : 'var(--text)' }}
      >
        {value}
      </p>
    </div>
  );
}

// ─── Shared sub-components ───────────────────────────────────────────────────

function Tag({ label, active }: { label: string; active: boolean }) {
  return (
    <span
      className={cn(
        'badge text-[10px]',
        active ? 'badge-success' : 'badge-neutral',
      )}
    >
      <span className={cn('badge-dot', active ? 'bg-current' : 'bg-text-subtle')} />
      {label}
    </span>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  hint,
  tone = 'neutral',
}: {
  icon: typeof Users;
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isYes(v: string): boolean {
  return v.trim().toLowerCase() === 'sim';
}

function pct(n: number, total: number): number {
  return total === 0 ? 0 : (n / total) * 100;
}

function uniqueOptions(values: string[]): Array<{ label: string; value: string }> {
  const set = new Set<string>();
  for (const v of values) {
    const t = (v ?? '').trim();
    if (t) set.add(t);
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'pt-BR')).map((v) => ({
    label: v,
    value: v,
  }));
}
